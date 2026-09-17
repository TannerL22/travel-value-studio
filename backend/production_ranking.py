from __future__ import annotations

from typing import Dict

import numpy as np
import pandas as pd

from basic_comfort import add_basic_comfort_v3
from data_sources import (
    add_origin_fx_tailwind_diagnostics,
    compute_scores,
    promote_origin_fx_tailwind_component,
)
from fx_opportunity import add_fx_opportunity_v2, apply_fx_opportunity_to_ranking
from ranking_v7 import apply_phase7_country_ranking
from service_depth import add_service_depth_v4, align_data_quality_with_service_depth


LEGACY_SCORE_KWARGS: Dict[str, object] = {
    "nominal_penalty_exp": 1.0,
    "ppp_quality_floor": 10_000.0,
    "floor_strength": 2.0,
    "tourism_cost_weight": 1.0,
    "tourism_infra_weight": 0.0,
    "safety_weight": 1.0,
    "arrivals_weight": 1.0,
    "min_stability": None,
}

LEGACY_AUDIT_FIELDS = {
    "score": "legacy_score_pre_phase7",
    "component_overall_value": "legacy_component_overall_value_pre_phase7",
    "score_base": "legacy_score_base_pre_phase7",
    "score_floor_penalty": "legacy_score_floor_penalty_pre_phase7",
    "score_tourism_cost": "legacy_score_tourism_cost_pre_phase7",
    "score_infra": "legacy_score_infra_pre_phase7",
    "score_safety": "legacy_score_safety_pre_phase7",
    "component_ppp_advantage": "legacy_component_ppp_advantage_pre_phase7",
    "component_fx_tailwind": "legacy_component_fx_tailwind_pre_phase7",
    "component_fx_tailwind_source": "legacy_component_fx_tailwind_source_pre_phase7",
    "component_comfort_floor": "legacy_component_comfort_floor_pre_phase7",
    "component_tourism_depth": "legacy_component_tourism_depth_pre_phase7",
    "component_safety_stability": "legacy_component_safety_stability_pre_phase7",
}


def attach_legacy_score_audit_fields(df: pd.DataFrame) -> pd.DataFrame:
    """Attach legacy diagnostics without allowing the legacy scorer to gate the universe.

    ``compute_scores`` is intentionally run on a separate copy. Its filtered result is
    reduced to prefixed audit fields and left-joined back onto the unfiltered production
    evidence by ISO3. A country that cannot receive the old GDP-led score therefore
    remains present for Phase 7.1 if the production evidence can score it.
    """
    out = df.copy()
    original_count = len(out)

    legacy = compute_scores(out.copy(), **LEGACY_SCORE_KWARGS)
    available_fields = [field for field in LEGACY_AUDIT_FIELDS if field in legacy.columns]
    if available_fields:
        audit = legacy[["iso3", *available_fields]].drop_duplicates(subset=["iso3"], keep="first")
        audit = audit.rename(columns={field: LEGACY_AUDIT_FIELDS[field] for field in available_fields})
        out = out.merge(audit, on="iso3", how="left", validate="many_to_one")

    if len(out) != original_count:
        raise AssertionError("Legacy audit attachment changed the production country universe")

    legacy_score = pd.to_numeric(
        out.get("legacy_score_pre_phase7", pd.Series(np.nan, index=out.index)),
        errors="coerce",
    )
    out["legacy_score_available_pre_phase7"] = legacy_score.notna()
    out["legacy_score_missing_pre_phase7"] = legacy_score.isna()
    return out


def prepare_country_evidence(df_raw: pd.DataFrame, target_year: int) -> pd.DataFrame:
    """Build all production country evidence from the raw dataset before ranking.

    This function is deliberately non-filtering. Basic Comfort and Service Depth add
    evidence to the raw country universe; legacy score diagnostics are attached last by
    a left join and cannot remove rows.
    """
    out = df_raw.copy()
    raw_count = len(out)
    out = add_basic_comfort_v3(out, target_year=target_year)
    out = add_service_depth_v4(out, target_year=target_year)
    out = align_data_quality_with_service_depth(out)
    out = attach_legacy_score_audit_fields(out)
    if len(out) != raw_count:
        raise AssertionError("Evidence preparation changed the raw country universe")
    return out


def rank_prepared_countries(
    prepared: pd.DataFrame,
    *,
    origin_pp_multiplier: float,
    origin_currency: str | None,
    cheapness_priority: float,
    comfort_requirement: float,
    service_requirement: float,
    stability_priority: float,
) -> pd.DataFrame:
    """Run the Phase 7.1 production score and final bounded FX overlay."""
    out = apply_phase7_country_ranking(
        prepared,
        origin_pp_multiplier=origin_pp_multiplier,
        cheapness_priority=cheapness_priority,
        comfort_requirement=comfort_requirement,
        service_requirement=service_requirement,
        stability_priority=stability_priority,
    )
    out = add_origin_fx_tailwind_diagnostics(out, origin_currency)
    out = promote_origin_fx_tailwind_component(out)
    out = add_fx_opportunity_v2(out, origin_currency)
    out = apply_fx_opportunity_to_ranking(out)

    out["stability"] = pd.to_numeric(out.get("component_safety_stability"), errors="coerce")
    out["quality_adjusted_value"] = pd.to_numeric(out.get("component_overall_value"), errors="coerce")
    out["rank"] = np.arange(1, len(out) + 1)
    out["Score"] = out["quality_adjusted_value"]
    return out
