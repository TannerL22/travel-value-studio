from __future__ import annotations

from typing import Dict

from babel.numbers import get_territory_currencies
import numpy as np
import pandas as pd
import pycountry

from basic_comfort import add_basic_comfort_v3
from country_universe import filter_production_country_universe, is_production_country_iso3
from data_sources import (
    add_origin_fx_tailwind_diagnostics,
    compute_scores,
    fetch_country_currency_map,
    fetch_wdi_indicator,
    promote_origin_fx_tailwind_component,
)
from fx_opportunity import add_fx_opportunity_v2, apply_fx_opportunity_to_ranking
from ranking_v7 import apply_phase7_country_ranking
from service_depth import add_service_depth_v4, align_data_quality_with_service_depth


# World Bank's current Indicators surface exposes the revised WGI series under
# GOV_WGI_PV_EST. PV.EST is retained as an alternate/legacy lookup fallback.
WGI_STABILITY_INDICATORS = ("GOV_WGI_PV_EST", "PV.EST")
SPECIAL_CURRENCY_OVERRIDES = {"XKX": "EUR", "TWN": "TWD"}

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


def _babel_currency_map(iso3_codes: list[str]) -> Dict[str, str]:
    """Resolve current tender currency from ISO territory metadata without network I/O."""
    mapping: Dict[str, str] = {}
    for code in iso3_codes:
        upper = str(code).upper()
        if upper in SPECIAL_CURRENCY_OVERRIDES:
            mapping[upper] = SPECIAL_CURRENCY_OVERRIDES[upper]
            continue
        country = pycountry.countries.get(alpha_3=upper)
        if country is None:
            continue
        currencies = get_territory_currencies(country.alpha_2, tender=True)
        if currencies:
            mapping[upper] = str(currencies[0]).upper()
    return mapping


def repair_country_currencies(df: pd.DataFrame) -> pd.DataFrame:
    """Fill current ISO currency codes for the production economy universe.

    Phase 7.1 uses local ISO territory/currency metadata as the primary mapping so a
    third-party country API outage cannot disable FX Opportunity globally. Existing
    raw currency data is preserved. RestCountries remains a best-effort fallback only
    for any ISO economies Babel cannot resolve.
    """
    out = filter_production_country_universe(df)
    if "currency" not in out.columns:
        out["currency"] = np.nan

    existing = out["currency"].copy()
    codes = sorted({
        str(code).upper()
        for code in out["iso3"].dropna().tolist()
        if is_production_country_iso3(code)
    })
    mapping = _babel_currency_map(codes)
    fallback_warning = ""
    missing_codes = [code for code in codes if code not in mapping]
    if missing_codes:
        try:
            mapping.update(fetch_country_currency_map(missing_codes))
        except Exception as exc:
            fallback_warning = f"country_currency_network_fallback_failed:{type(exc).__name__}"

    mapping.update(SPECIAL_CURRENCY_OVERRIDES)
    repaired = out["iso3"].astype(str).str.upper().map(mapping)
    out["currency"] = existing.combine_first(repaired)

    source_values = []
    for had_existing, code, repaired_value in zip(
        existing.notna(),
        out["iso3"].astype(str).str.upper(),
        repaired,
    ):
        if had_existing:
            source_values.append("raw_dataset")
        elif pd.notna(repaired_value):
            source_values.append("iso_territory_currency_metadata")
        elif code in SPECIAL_CURRENCY_OVERRIDES:
            source_values.append("explicit_override")
        else:
            source_values.append("unavailable")
    out["currency_mapping_source"] = source_values
    out["currency_mapping_warning"] = fallback_warning
    return out


def repair_wgi_stability(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    """Refresh WGI Political Stability from the current World Bank indicator code."""
    out = df.copy()
    replacement = pd.DataFrame(columns=["iso3", "wgi_political_stability_repaired", "wgi_year_repaired"])
    source = "unavailable"
    warning = ""

    for indicator in WGI_STABILITY_INDICATORS:
        try:
            raw = fetch_wdi_indicator(indicator, max(2000, int(target_year) - 12), int(target_year))
            raw = raw.dropna(subset=["value"]).copy()
            if raw.empty:
                continue
            raw = raw.sort_values(["iso3", "year"], ascending=[True, False])
            replacement = raw.groupby("iso3", as_index=False).head(1)[["iso3", "year", "value"]]
            replacement = replacement.rename(
                columns={
                    "year": "wgi_year_repaired",
                    "value": "wgi_political_stability_repaired",
                }
            )
            source = indicator
            break
        except Exception as exc:
            warning = f"wgi_stability_refresh_failed:{type(exc).__name__}"

    if not replacement.empty:
        out = out.merge(replacement, on="iso3", how="left", validate="one_to_one")
        repaired = pd.to_numeric(out["wgi_political_stability_repaired"], errors="coerce")
        repaired_year = pd.to_numeric(out["wgi_year_repaired"], errors="coerce")
        current = pd.to_numeric(out.get("wgi_political_stability"), errors="coerce")
        current_year = pd.to_numeric(out.get("wgi_year"), errors="coerce")
        out["wgi_political_stability"] = repaired.combine_first(current)
        out["wgi_year"] = repaired_year.combine_first(current_year)
        out = out.drop(columns=["wgi_political_stability_repaired", "wgi_year_repaired"])

    out["wgi_political_stability_source"] = source
    out["wgi_political_stability_warning"] = warning
    return out


def prepare_country_identity(df_raw: pd.DataFrame, target_year: int) -> pd.DataFrame:
    """Create the production economy universe and repair country-level identity evidence."""
    out = repair_country_currencies(df_raw)
    out = repair_wgi_stability(out, target_year=target_year)
    return out


def attach_legacy_score_audit_fields(df: pd.DataFrame) -> pd.DataFrame:
    """Attach legacy diagnostics without allowing the legacy scorer to gate the universe.

    ``compute_scores`` is intentionally run on a separate copy. Its filtered result is
    reduced to prefixed audit fields and left-joined back onto the production economy
    universe by ISO3. A country that cannot receive the old GDP-led score therefore
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
    """Build production evidence without evidence-based country filtering.

    World Bank aggregate rows are removed first because they are not destinations.
    Every remaining production economy then receives the same evidence pipeline;
    missing evidence affects coverage/neutrality rather than silently removing rows.
    """
    out = prepare_country_identity(df_raw, target_year=target_year)
    production_count = len(out)
    out = add_basic_comfort_v3(out, target_year=target_year)
    out = add_service_depth_v4(out, target_year=target_year)
    out = align_data_quality_with_service_depth(out)
    out = attach_legacy_score_audit_fields(out)
    if len(out) != production_count:
        raise AssertionError("Evidence preparation changed the production country universe")
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
