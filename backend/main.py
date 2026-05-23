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

from data_sources import build_dataset, compute_scores
from source_registry import get_methodology_summary, get_source_registry


class RankingQuery(BaseModel):
    year: int = Field(default=2025, ge=2000, le=2035)
    origin_iso3: str = Field(default="USA")
    budget_sens: float = Field(default=0.7, ge=0.0, le=1.0)
    comfort: float = Field(default=0.55, ge=0.0, le=1.0)
    supply_need: float = Field(default=0.65, ge=0.0, le=1.0)
    risk_pri: float = Field(default=0.75, ge=0.0, le=1.0)
    user_base_spend: float = Field(default=180.0, gt=0)
    scarcity_k: float = Field(default=0.7, ge=0.0, le=1.0)


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
    # Use the current year's dataset to get the list of countries
    df_raw, _ = _get_cached_dataset(target_year=2025)
    
    # We want countries that have at least basic data
    valid = df_raw[df_raw["iso3"].notna() & df_raw["country"].notna()].copy()
    valid = valid.sort_values("country")
    
    origins = []
    for _, row in valid.iterrows():
        origins.append({
            "name": row["country"],
            "code": row["iso3"],
            "pp_multiplier": float(row["tourism_pp_power"]) if pd.notna(row["tourism_pp_power"]) else 1.0,
            "currency": row.get("currency", "USD")
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

    # Calculate base weights
    alpha = 1.0 + 2.2 * query.budget_sens
    ppp_floor = 3000 + 17000 * query.comfort
    floor_strength = 1.0 + 2.0 * query.comfort
    tourism_infra_weight = 0.1 + 1.2 * query.supply_need
    arrivals_weight = 0.2 + 0.6 * query.supply_need
    safety_weight = 0.1 + 1.3 * query.risk_pri
    tourism_cost_weight = float(
        np.clip(0.2 + 0.9 * query.budget_sens + 0.2 * query.comfort, 0.0, 1.5)
    )

    # 1. Calculate absolute value metrics for all countries
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

    # 2. Origin-Based Normalization
    origin_mask = scored["iso3"] == query.origin_iso3.upper()
    if not origin_mask.any():
        # Fallback to USA if origin not found in dataset
        origin_mask = scored["iso3"] == "USA"
    
    origin_pp = scored.loc[origin_mask, "tourism_pp_power"].iloc[0] if not scored.loc[origin_mask].empty else 1.0
    if pd.isna(origin_pp) or origin_pp == 0:
        origin_pp = 1.0

    # Relative Value Power: How much more/less value you get vs home
    scored["value_multiplier_relative"] = scored["tourism_pp_power"] / origin_pp

    # 3. Cost Estimation
    arr_scaled = np.log1p(scored["intl_arrivals"].fillna(0).clip(lower=0))
    arr_scaled = (arr_scaled - arr_scaled.min()) / (arr_scaled.max() - arr_scaled.min() + 1e-9)
    availability = arr_scaled.clip(0, 1)
    scored["scarcity_mult"] = 1.0 + float(query.scarcity_k) * (1.0 - availability) * float(query.supply_need)

    def est_cost(base_spend: float) -> np.ndarray:
        vm = scored["value_multiplier_relative"].replace([np.inf, -np.inf], np.nan)
        # We divide origin spend by the multiplier to get target cost
        return (base_spend / vm) * scored["scarcity_mult"]

    scored["est_daily_cost"] = est_cost(float(query.user_base_spend))

    # 4. Final Scoring
    scored["rank"] = np.arange(1, len(scored) + 1)
    scored["Score"] = scored["component_overall_value"]

    top = scored.head(250).replace([np.inf, -np.inf], np.nan)
    results = top.where(top.notna(), None).to_dict(orient="records")
    
    meta["origin_used"] = query.origin_iso3
    meta["origin_pp_multiplier"] = float(origin_pp)

    if include_meta:
        return {"meta": meta, "results": results}
    return results
