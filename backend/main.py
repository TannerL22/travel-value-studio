from __future__ import annotations

from typing import List, Dict, Any, Tuple
import os
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from data_sources import (
    add_origin_fx_tailwind_diagnostics,
    build_dataset,
    compute_scores,
    promote_origin_fx_tailwind_component,
    resolve_origin_context,
)
from source_registry import get_methodology_summary, get_source_registry


class RankingQuery(BaseModel):
    year: int = Field(default=2025, ge=2000, le=2035)
    origin_iso3: str = Field(default="USA")
    budget_sens: float = Field(default=0.7, ge=0.0, le=1.0)
    comfort: float = Field(default=0.55, ge=0.0, le=1.0)
    supply_need: float = Field(default=0.65, ge=0.0, le=1.0)
    risk_pri: float = Field(default=0.75, ge=0.0, le=1.0)


app = FastAPI(title="Travel Value Studio API")

_allow_origins_env = os.getenv("ALLOW_ORIGINS", "http://localhost:3000").strip()
if _allow_origins_env == "*":
    _allow_origins = ["*"]
    _allow_credentials = False
else:
    _allow_origins = [o.strip() for o in _allow_origins_env.split(",") if o.strip()]
    if not _allow_origins:
        _allow_origins = ["http://localhost:3000"]
    _allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

_DATASET_CACHE: Dict[Tuple[int], Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = int(os.getenv("DATASET_CACHE_TTL_SECONDS", "43200"))


def _get_cached_dataset(target_year: int) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    now = time.time()
    key = (int(target_year),)
    cached = _DATASET_CACHE.get(key)
    if cached:
        age = now - cached["built_at_ts"]
        if age <= _CACHE_TTL_SECONDS:
            meta = {
                "cache_hit": True,
                "cache_age_seconds": int(age),
                "dataset_built_at": cached["built_at_iso"],
                "country_count": int(cached["country_count"]),
            }
            return cached["df_raw"], meta

    df_raw, _ = build_dataset(target_year=target_year, use_live_fx=True)
    built_at = datetime.now(timezone.utc)
    _DATASET_CACHE[key] = {
        "df_raw": df_raw,
        "built_at_ts": now,
        "built_at_iso": built_at.isoformat(),
        "country_count": int(len(df_raw)),
    }
    meta = {
        "cache_hit": False,
        "cache_age_seconds": 0,
        "dataset_built_at": _DATASET_CACHE[key]["built_at_iso"],
        "country_count": int(len(df_raw)),
    }
    return df_raw, meta


@app.get("/api/origins")
def get_origins() -> Any:
    df_raw, _ = _get_cached_dataset(target_year=2025)
    valid = df_raw[df_raw["iso3"].notna() & df_raw["country"].notna()].copy()
    valid = valid.sort_values("country")

    origins = []
    for _, row in valid.iterrows():
        origins.append({
            "name": row["country"],
            "code": row["iso3"],
            "pp_multiplier": float(row["tourism_pp_power"]) if pd.notna(row["tourism_pp_power"]) else 1.0,
            "currency": row.get("currency", "USD"),
        })
    return origins


@app.get("/api/source-registry")
def get_api_source_registry() -> Any:
    return get_source_registry()


@app.get("/api/methodology")
def get_api_methodology() -> Any:
    return get_methodology_summary()


@app.post("/api/rankings")
def get_rankings(query: RankingQuery, include_meta: int = 0) -> Any:
    df_raw, meta = _get_cached_dataset(target_year=query.year)
    origin_context = resolve_origin_context(df_raw, query.origin_iso3)

    # Phase 1 preserves the production ranking formula while renaming its outputs
    # to match what the data actually measures. Later phases will rebuild the
    # component inputs and make origin-aware FX directly affect ranking.
    alpha = 1.0 + 2.2 * query.budget_sens
    ppp_floor = 3000 + 17000 * query.comfort
    floor_strength = 1.0 + 2.0 * query.comfort
    tourism_infra_weight = 0.1 + 1.2 * query.supply_need
    arrivals_weight = 0.2 + 0.6 * query.supply_need
    safety_weight = 0.1 + 1.3 * query.risk_pri
    tourism_cost_weight = float(
        np.clip(0.2 + 0.9 * query.budget_sens + 0.2 * query.comfort, 0.0, 1.5)
    )

    scored = compute_scores(
        df_raw,
        nominal_penalty_exp=float(alpha),
        ppp_quality_floor=float(ppp_floor),
        floor_strength=float(floor_strength),
        tourism_cost_weight=float(tourism_cost_weight),
        tourism_infra_weight=float(tourism_infra_weight),
        safety_weight=float(safety_weight),
        arrivals_weight=float(arrivals_weight),
        min_stability=None,
    )

    origin_pp = origin_context["origin_pp_multiplier"]
    origin_currency = origin_context["origin_currency"]
    scored = add_origin_fx_tailwind_diagnostics(scored, origin_currency)
    scored = promote_origin_fx_tailwind_component(scored)

    # Broad purchasing power in the destination relative to the selected origin.
    # This is an index, not an estimate of a personal or tourist daily budget.
    scored["value_multiplier_relative"] = scored["tourism_pp_power"] / origin_pp
    scored["structural_purchasing_power"] = scored["value_multiplier_relative"]
    scored["purchasing_power_advantage_pct"] = (
        scored["structural_purchasing_power"] - 1.0
    ) * 100.0

    # Phase 1 semantic aliases. The legacy component columns are retained so
    # historical validation snapshots and downstream analysis remain readable.
    scored["fx_opportunity"] = scored["component_fx_tailwind"]
    scored["basic_comfort"] = scored["component_comfort_floor"]
    scored["service_depth"] = scored["component_tourism_depth"]
    scored["stability"] = scored["component_safety_stability"]
    scored["quality_adjusted_value"] = scored["component_overall_value"]

    scored["rank"] = np.arange(1, len(scored) + 1)
    scored["Score"] = scored["quality_adjusted_value"]

    top = scored.head(250).replace([np.inf, -np.inf], np.nan)
    results = top.where(top.notna(), None).to_dict(orient="records")

    meta["origin_requested"] = origin_context["origin_requested"]
    meta["origin_used"] = origin_context["origin_used"]
    meta["origin_fallback_used"] = origin_context["origin_fallback_used"]
    meta["origin_pp_multiplier"] = float(origin_context["origin_pp_multiplier"])
    meta["origin_currency"] = origin_currency
    meta["model_contract"] = "phase_1_quality_adjusted_purchasing_power"
    meta["daily_cost_estimate_removed"] = True

    if include_meta:
        return {"meta": meta, "results": results}
    return results
