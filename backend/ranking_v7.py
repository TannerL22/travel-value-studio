from __future__ import annotations

import math
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd


STRUCTURAL_PP_MIN = 1.0 / 3.0
STRUCTURAL_PP_MAX = 3.0
CITY_USABILITY_WEIGHTS = {
    "amenity_depth": 0.60,
    "mobility": 0.20,
    "digital_convenience": 0.20,
}


def structural_purchasing_power_factor(value: object, cheapness_priority: float) -> Optional[float]:
    """Direct, origin-relative purchasing-power factor with symmetric log saturation.

    1.0x purchasing power is neutral. Ratios beyond 1/3x and 3x are deliberately
    capped so noisy PPP/FX observations cannot dominate the model indefinitely.
    Cheapness remains part of the product even at priority=0, but its elasticity
    rises smoothly with user preference.
    """
    try:
        ratio = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(ratio) or ratio <= 0:
        return None
    priority = float(np.clip(cheapness_priority, 0.0, 1.0))
    elasticity = 0.45 + 0.55 * priority
    bounded = float(np.clip(ratio, STRUCTURAL_PP_MIN, STRUCTURAL_PP_MAX))
    return float(math.exp(elasticity * math.log(bounded)))


def _shortfall_penalty(
    score: object,
    requirement: float,
    threshold_low: float,
    threshold_high: float,
    strength_extra: float,
    coverage: float = 1.0,
) -> float:
    req = float(np.clip(requirement, 0.0, 1.0))
    cov = float(np.clip(coverage, 0.0, 1.0))
    if req <= 0 or cov <= 0:
        return 1.0
    try:
        numeric = float(score)
    except (TypeError, ValueError):
        return 1.0
    if not np.isfinite(numeric):
        return 1.0
    threshold = threshold_low + (threshold_high - threshold_low) * req
    strength = 1.0 + strength_extra * req
    full = float(np.clip(numeric / threshold, 0.0, 1.0) ** strength)
    return float(1.0 - req * cov * (1.0 - full))


def basic_comfort_penalty(score: object, requirement: float, coverage: float = 1.0) -> float:
    # Preserve the Phase 3 threshold logic, but calculate it independently of the legacy score.
    return _shortfall_penalty(score, requirement, 55.0, 90.0, 1.5, coverage)


def service_depth_penalty(score: object, requirement: float, coverage: float = 1.0) -> float:
    # Preserve the Phase 4 threshold logic.
    return _shortfall_penalty(score, requirement, 35.0, 75.0, 1.2, coverage)


def stability_penalty(score: object, priority: float, coverage: float = 1.0) -> float:
    """Preference-controlled stability shortfall; priority=0 is exactly neutral."""
    return _shortfall_penalty(score, priority, 40.0, 75.0, 1.2, coverage)


def apply_phase7_country_ranking(
    df: pd.DataFrame,
    origin_pp_multiplier: float,
    cheapness_priority: float,
    comfort_requirement: float,
    service_requirement: float,
    stability_priority: float,
) -> pd.DataFrame:
    """Rebuild the country score from interpretable Phase 1-6 production evidence.

    Legacy GDP-based score fields are retained for audit, but no longer drive the
    production ordering.
    """
    out = df.copy()
    origin_pp = float(origin_pp_multiplier) if origin_pp_multiplier and origin_pp_multiplier > 0 else 1.0

    out["legacy_score_pre_phase7"] = pd.to_numeric(out.get("score"), errors="coerce")
    out["legacy_component_overall_value_pre_phase7"] = pd.to_numeric(
        out.get("component_overall_value"), errors="coerce"
    )

    tpp = pd.to_numeric(out.get("tourism_pp_power"), errors="coerce")
    out["structural_purchasing_power"] = tpp / origin_pp
    out["value_multiplier_relative"] = out["structural_purchasing_power"]
    out["purchasing_power_advantage_pct"] = (out["structural_purchasing_power"] - 1.0) * 100.0
    out["structural_value_factor"] = out["structural_purchasing_power"].map(
        lambda value: structural_purchasing_power_factor(value, cheapness_priority)
    )

    comfort = pd.to_numeric(out.get("basic_comfort"), errors="coerce")
    comfort_cov = pd.to_numeric(out.get("basic_comfort_coverage"), errors="coerce").fillna(0.0)
    out["basic_comfort_penalty"] = [
        basic_comfort_penalty(score, comfort_requirement, cov)
        for score, cov in zip(comfort, comfort_cov)
    ]

    service = pd.to_numeric(out.get("service_depth"), errors="coerce")
    service_cov = pd.to_numeric(out.get("service_depth_coverage"), errors="coerce").fillna(0.0)
    out["service_depth_penalty"] = [
        service_depth_penalty(score, service_requirement, cov)
        for score, cov in zip(service, service_cov)
    ]

    stability = pd.to_numeric(out.get("component_safety_stability"), errors="coerce")
    stability_evidence = pd.to_numeric(out.get("wgi_political_stability"), errors="coerce").notna().astype(float)
    out["stability_evidence_coverage"] = stability_evidence
    out["stability_penalty"] = [
        stability_penalty(score, stability_priority, cov)
        for score, cov in zip(stability, stability_evidence)
    ]

    out["score_pre_fx_opportunity"] = (
        pd.to_numeric(out["structural_value_factor"], errors="coerce")
        * pd.to_numeric(out["basic_comfort_penalty"], errors="coerce")
        * pd.to_numeric(out["service_depth_penalty"], errors="coerce")
        * pd.to_numeric(out["stability_penalty"], errors="coerce")
    )
    out["score"] = out["score_pre_fx_opportunity"]
    out = out.dropna(subset=["score"]).sort_values("score", ascending=False).reset_index(drop=True)

    maximum = out["score"].max()
    out["component_overall_value"] = (
        100.0 * out["score"] / (maximum if pd.notna(maximum) and maximum > 0 else 1.0)
    ).round(2)
    return out


def city_usability_score(city: Dict[str, object]) -> Tuple[Optional[float], float]:
    """Evidence-aware usability composite anchored by city-specific Amenity Depth.

    Amenity evidence is required because Mobility and Digital Convenience are still
    mainly country-level context. Missing mobility/digital evidence reduces coverage
    but is not interpreted as poor usability.
    """
    amenity = city.get("amenity_depth")
    try:
        amenity_numeric = float(amenity) if amenity is not None else float("nan")
    except (TypeError, ValueError):
        amenity_numeric = float("nan")
    if not np.isfinite(amenity_numeric):
        return None, 0.0

    numerator = 0.0
    denominator = 0.0
    coverage = 0.0
    for field, weight in CITY_USABILITY_WEIGHTS.items():
        value = city.get(field)
        try:
            numeric = float(value) if value is not None else float("nan")
        except (TypeError, ValueError):
            numeric = float("nan")
        if not np.isfinite(numeric):
            continue
        normalized = float(np.clip(numeric / 100.0, 0.01, 1.0))
        numerator += weight * math.log(normalized)
        denominator += weight
        coverage += weight
    if denominator <= 0:
        return None, 0.0
    score = float(np.clip(math.exp(numerator / denominator), 0.0, 1.0) * 100.0)
    return round(score, 2), round(float(np.clip(coverage, 0.0, 1.0)), 4)


def add_city_usability_v7(cities: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    for city in cities:
        score, coverage = city_usability_score(city)
        row = dict(city)
        row["city_usability"] = score
        row["city_usability_coverage"] = coverage
        row["city_usability_source"] = (
            "amenity_mobility_digital_geometric" if score is not None else "unavailable"
        )
        row["city_usability_rank_within_country"] = None
        rows.append(row)

    observed = sorted(
        [row for row in rows if row.get("city_usability") is not None],
        key=lambda row: float(row.get("city_usability") or -1.0),
        reverse=True,
    )
    rank_lookup = {str(row.get("city_id")): index + 1 for index, row in enumerate(observed)}
    for row in rows:
        if row.get("city_usability") is not None:
            row["city_usability_rank_within_country"] = rank_lookup.get(str(row.get("city_id")))
    return rows
