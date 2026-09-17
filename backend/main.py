from __future__ import annotations

from typing import Dict, Any, Tuple
import os
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from basic_comfort import add_basic_comfort_v3, apply_basic_comfort_to_ranking
from city_intelligence import get_country_cities
from data_sources import (
    add_origin_fx_tailwind_diagnostics,
    build_dataset,
    compute_scores,
    promote_origin_fx_tailwind_component,
    resolve_origin_context,
)
from fx_opportunity import (
    FX_MAX_RANKING_EFFECT,
    add_fx_opportunity_v2,
    apply_fx_opportunity_to_ranking,
)
from model_contract import phase_5_methodology
from phase5_registry import get_phase5_source_registry
from service_depth import (
    add_service_depth_v4,
    align_data_quality_with_service_depth,
    apply_service_depth_to_ranking,
)
from source_registry import get_methodology_summary


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
    return get_phase5_source_registry()


@app.get("/api/methodology")
def get_api_methodology() -> Any:
    return phase_5_methodology(get_methodology_summary())


@app.get("/api/cities/{country_iso3}")
def get_cities(
    country_iso3: str,
    limit: int = Query(default=6, ge=1, le=20),
    include_amenities: int = Query(default=1, ge=0, le=1),
) -> Any:
    cities, meta = get_country_cities(
        country_iso3=country_iso3,
        limit=limit,
        include_amenities=bool(include_amenities),
    )
    return {
        "meta": {
            **meta,
            "country_iso3": str(country_iso3).upper().strip(),
            "model_contract": "phase_5_quality_adjusted_purchasing_power_city_intelligence",
            "city_amenities_affect_country_ranking": False,
        },
        "results": cities,
    }


@app.post("/api/rankings")
def get_rankings(query: RankingQuery, include_meta: int = 0) -> Any:
    df_raw, meta = _get_cached_dataset(target_year=query.year)
    origin_context = resolve_origin_context(df_raw, query.origin_iso3)

    alpha = 1.0 + 2.2 * query.budget_sens
    safety_weight = 0.1 + 1.3 * query.risk_pri
    tourism_cost_weight = float(np.clip(0.2 + 1.0 * query.budget_sens, 0.0, 1.5))

    # The legacy GDP comfort floor and arrivals-led infrastructure term are kept
    # only to produce audit fields inside compute_scores. Their production effects
    # are neutralized/replaced downstream by Phase 3 and Phase 4 respectively.
    scored = compute_scores(
        df_raw,
        nominal_penalty_exp=float(alpha),
        ppp_quality_floor=10_000.0,
        floor_strength=2.0,
        tourism_cost_weight=float(tourism_cost_weight),
        tourism_infra_weight=0.0,
        safety_weight=float(safety_weight),
        arrivals_weight=1.0,
        min_stability=None,
    )

    # Phase 3: objective basic-service score + preference-controlled shortfall penalty.
    scored = add_basic_comfort_v3(scored, target_year=query.year)
    scored = apply_basic_comfort_to_ranking(scored, comfort_requirement=query.comfort)

    # Phase 4: supply-side Service Depth. WEF TTDI Tourist Services is preferred;
    # arrivals per resident survive only as a capped, low-confidence fallback.
    scored = add_service_depth_v4(scored, target_year=query.year)
    scored = align_data_quality_with_service_depth(scored)
    scored = apply_service_depth_to_ranking(scored, service_requirement=query.supply_need)

    origin_pp = origin_context["origin_pp_multiplier"]
    origin_currency = origin_context["origin_currency"]

    # Phase 2 FX timing remains the final bounded overlay after structural quality penalties.
    scored = add_origin_fx_tailwind_diagnostics(scored, origin_currency)
    scored = promote_origin_fx_tailwind_component(scored)
    scored = add_fx_opportunity_v2(scored, origin_currency)
    scored = apply_fx_opportunity_to_ranking(scored)

    scored["value_multiplier_relative"] = scored["tourism_pp_power"] / origin_pp
    scored["structural_purchasing_power"] = scored["value_multiplier_relative"]
    scored["purchasing_power_advantage_pct"] = (
        scored["structural_purchasing_power"] - 1.0
    ) * 100.0

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
    meta["model_contract"] = "phase_5_quality_adjusted_purchasing_power_city_intelligence"
    meta["daily_cost_estimate_removed"] = True
    meta["fx_opportunity_horizons"] = ["1w", "1m", "3m", "1y", "3y"]
    meta["fx_opportunity_max_ranking_effect"] = FX_MAX_RANKING_EFFECT
    meta["basic_comfort_pillars"] = ["water", "sanitation", "electricity", "internet", "health"]
    meta["basic_comfort_legacy_gdp_proxy_is_fallback_only"] = True
    meta["service_depth_primary_source"] = "WEF TTDI 2024 Tourist Services and Infrastructure"
    meta["service_depth_arrivals_are_fallback_only"] = True
    meta["service_depth_ttdi_source_year"] = 2024
    meta["city_intelligence_endpoint"] = "/api/cities/{country_iso3}"
    meta["city_amenities_affect_country_ranking"] = False

    if include_meta:
        return {"meta": meta, "results": results}
    return results
