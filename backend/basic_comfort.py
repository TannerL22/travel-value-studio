from __future__ import annotations

import math
import os
import threading
import time
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd
import requests

WDI_API = "https://api.worldbank.org/v2"
COMFORT_CACHE_TTL_SECONDS = int(os.getenv("BASIC_COMFORT_CACHE_TTL_SECONDS", "43200"))
LEGACY_GDP_FALLBACK_FLOOR = 12_000.0
LEGACY_GDP_FALLBACK_STRENGTH = 2.0

INDICATORS: Dict[str, str] = {
    "comfort_water_safe_pct": "SH.H2O.SMDW.ZS",
    "comfort_water_basic_pct": "SH.H2O.BASW.ZS",
    "comfort_sanitation_safe_pct": "SH.STA.SMSS.ZS",
    "comfort_sanitation_basic_pct": "SH.STA.BASS.ZS",
    "comfort_electricity_pct": "EG.ELC.ACCS.ZS",
    "comfort_internet_pct": "IT.NET.USER.ZS",
    "comfort_uhc_index": "SH.UHC.SRVS.CV.XD",
}

PILLAR_WEIGHTS = {
    "water": 0.25,
    "sanitation": 0.20,
    "electricity": 0.20,
    "internet": 0.15,
    "health": 0.20,
}

PILLAR_THRESHOLDS = {
    "water": (50.0, 95.0),
    "sanitation": (45.0, 90.0),
    "electricity": (70.0, 99.0),
    "internet": (35.0, 90.0),
    "health": (40.0, 80.0),
}

_CACHE_LOCK = threading.Lock()
_CACHE: Dict[int, Tuple[float, pd.DataFrame, str]] = {}


def _get_json(url: str, params: Optional[dict] = None, timeout: int = 45):
    response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def _fetch_wdi_latest(indicator: str, target_year: int) -> pd.DataFrame:
    start_year = max(2000, int(target_year) - 12)
    url = f"{WDI_API}/country/all/indicator/{indicator}"
    payload = _get_json(
        url,
        params={
            "date": f"{start_year}:{int(target_year)}",
            "format": "json",
            "per_page": 20000,
        },
    )
    if not isinstance(payload, list) or len(payload) < 2:
        return pd.DataFrame(columns=["iso3", "value", "year_used"])

    rows = []
    for row in payload[1] or []:
        if not row:
            continue
        iso3 = row.get("countryiso3code")
        value = row.get("value")
        year = row.get("date")
        if not iso3 or value is None or year is None:
            continue
        try:
            numeric = float(value)
            year_int = int(year)
        except (TypeError, ValueError):
            continue
        if not np.isfinite(numeric) or year_int > target_year:
            continue
        rows.append((str(iso3), numeric, year_int))

    if not rows:
        return pd.DataFrame(columns=["iso3", "value", "year_used"])

    frame = pd.DataFrame(rows, columns=["iso3", "value", "year_used"])
    frame = frame.sort_values(["iso3", "year_used"], ascending=[True, False])
    return frame.groupby("iso3", as_index=False).head(1)


def fetch_basic_comfort_frame(target_year: int, force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _CACHE.get(int(target_year))
        if cached and not force_refresh and now - cached[0] <= COMFORT_CACHE_TTL_SECONDS:
            return cached[1].copy(), cached[2]

    merged: Optional[pd.DataFrame] = None
    warnings = []
    for field_name, indicator in INDICATORS.items():
        try:
            frame = _fetch_wdi_latest(indicator, target_year).rename(
                columns={"value": field_name, "year_used": f"{field_name}_year"}
            )
        except Exception as exc:
            frame = pd.DataFrame(columns=["iso3", field_name, f"{field_name}_year"])
            warnings.append(f"{field_name}:{type(exc).__name__}")
        merged = frame if merged is None else merged.merge(frame, on="iso3", how="outer")

    if merged is None:
        merged = pd.DataFrame(columns=["iso3"])
    warning_text = "|".join(warnings)
    with _CACHE_LOCK:
        _CACHE[int(target_year)] = (now, merged.copy(), warning_text)
    return merged, warning_text


def saturating_service_score(value: object, floor: float, target: float) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(number):
        return None
    if target <= floor:
        raise ValueError("target must be greater than floor")
    return float(np.clip((number - floor) / (target - floor), 0.0, 1.0))


def _legacy_gdp_comfort(value: object) -> float:
    """Preference-independent fallback retained only for missing direct evidence."""
    try:
        gdp_ppp = float(value)
    except (TypeError, ValueError):
        return 0.5
    if not np.isfinite(gdp_ppp) or gdp_ppp <= 0:
        return 0.5
    ratio = max(0.0, gdp_ppp / LEGACY_GDP_FALLBACK_FLOOR)
    return float(np.clip(min(1.0, ratio) ** LEGACY_GDP_FALLBACK_STRENGTH, 0.0, 1.0))


def _select_service(preferred: object, fallback: object, floor: float, target: float) -> Tuple[Optional[float], float, str]:
    preferred_score = saturating_service_score(preferred, floor, target)
    if preferred_score is not None:
        return preferred_score, 1.0, "preferred"
    fallback_score = saturating_service_score(fallback, floor, target)
    if fallback_score is not None:
        return min(fallback_score, 0.88), 0.75, "basic_fallback"
    return None, 0.0, "missing"


def _weighted_geometric(values: Dict[str, Optional[float]], reliability: Dict[str, float]) -> Tuple[Optional[float], float]:
    numerator = 0.0
    denominator = 0.0
    total_reliable_weight = 0.0
    for pillar, base_weight in PILLAR_WEIGHTS.items():
        value = values.get(pillar)
        rel = float(np.clip(reliability.get(pillar, 0.0), 0.0, 1.0))
        total_reliable_weight += base_weight * rel
        if value is None or rel <= 0:
            continue
        effective_weight = base_weight * rel
        numerator += effective_weight * math.log(max(float(value), 0.01))
        denominator += effective_weight
    if denominator <= 0:
        return None, 0.0
    direct = math.exp(numerator / denominator)
    return float(np.clip(direct, 0.0, 1.0)), float(np.clip(total_reliable_weight, 0.0, 1.0))


def add_basic_comfort_v3(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    """Attach direct basic-service metrics and an objective, coverage-aware comfort score."""
    out = df.copy()
    comfort_frame, warnings = fetch_basic_comfort_frame(target_year)
    if not comfort_frame.empty:
        out = out.merge(comfort_frame, on="iso3", how="left")
    else:
        for field_name in INDICATORS:
            out[field_name] = np.nan
            out[f"{field_name}_year"] = np.nan

    out["legacy_request_comfort_component"] = pd.to_numeric(
        out.get("component_comfort_floor", pd.Series(np.nan, index=out.index)), errors="coerce"
    )
    out["legacy_basic_comfort"] = pd.to_numeric(
        out.get("gdp_ppp_pc_int", pd.Series(np.nan, index=out.index)), errors="coerce"
    ).map(lambda value: round(_legacy_gdp_comfort(value) * 100.0, 2))

    water_scores = []
    sanitation_scores = []
    electricity_scores = []
    internet_scores = []
    health_scores = []
    direct_scores = []
    coverage_scores = []
    final_scores = []
    sources = []
    flags_list = []

    for _, row in out.iterrows():
        water, water_rel, water_source = _select_service(
            row.get("comfort_water_safe_pct"), row.get("comfort_water_basic_pct"), *PILLAR_THRESHOLDS["water"]
        )
        sanitation, sanitation_rel, sanitation_source = _select_service(
            row.get("comfort_sanitation_safe_pct"), row.get("comfort_sanitation_basic_pct"), *PILLAR_THRESHOLDS["sanitation"]
        )
        electricity = saturating_service_score(row.get("comfort_electricity_pct"), *PILLAR_THRESHOLDS["electricity"])
        internet = saturating_service_score(row.get("comfort_internet_pct"), *PILLAR_THRESHOLDS["internet"])
        health = saturating_service_score(row.get("comfort_uhc_index"), *PILLAR_THRESHOLDS["health"])

        values = {"water": water, "sanitation": sanitation, "electricity": electricity, "internet": internet, "health": health}
        reliability = {
            "water": water_rel,
            "sanitation": sanitation_rel,
            "electricity": 1.0 if electricity is not None else 0.0,
            "internet": 1.0 if internet is not None else 0.0,
            "health": 1.0 if health is not None else 0.0,
        }
        direct, coverage = _weighted_geometric(values, reliability)
        legacy_01 = float(np.clip(_legacy_gdp_comfort(row.get("gdp_ppp_pc_int")), 0.0, 1.0))

        if direct is None:
            final = legacy_01
            source = "legacy_gdp_ppp_fallback"
        else:
            final = coverage * direct + (1.0 - coverage) * legacy_01
            source = "direct_services" if coverage >= 0.95 else "blended_direct_legacy"

        flags = []
        if water_source == "basic_fallback": flags.append("water_basic_fallback")
        elif water_source == "missing": flags.append("missing_water")
        if sanitation_source == "basic_fallback": flags.append("sanitation_basic_fallback")
        elif sanitation_source == "missing": flags.append("missing_sanitation")
        for pillar, value in [("electricity", electricity), ("internet", internet), ("health", health)]:
            if value is None: flags.append(f"missing_{pillar}")
        if source == "legacy_gdp_ppp_fallback": flags.append("comfort_legacy_fallback")
        if warnings: flags.append("comfort_source_warning")

        water_scores.append(None if water is None else round(water * 100.0, 2))
        sanitation_scores.append(None if sanitation is None else round(sanitation * 100.0, 2))
        electricity_scores.append(None if electricity is None else round(electricity * 100.0, 2))
        internet_scores.append(None if internet is None else round(internet * 100.0, 2))
        health_scores.append(None if health is None else round(health * 100.0, 2))
        direct_scores.append(None if direct is None else round(direct * 100.0, 2))
        coverage_scores.append(round(coverage, 4))
        final_scores.append(round(float(np.clip(final, 0.0, 1.0)) * 100.0, 2))
        sources.append(source)
        flags_list.append(flags)

    out["comfort_water_score"] = water_scores
    out["comfort_sanitation_score"] = sanitation_scores
    out["comfort_electricity_score"] = electricity_scores
    out["comfort_internet_score"] = internet_scores
    out["comfort_health_score"] = health_scores
    out["basic_comfort_direct"] = direct_scores
    out["basic_comfort_coverage"] = coverage_scores
    out["basic_comfort"] = final_scores
    out["basic_comfort_source"] = sources
    out["basic_comfort_flags"] = flags_list
    out["basic_comfort_source_warnings"] = warnings
    out["component_comfort_floor"] = out["basic_comfort"]
    out["component_comfort_floor_source"] = out["basic_comfort_source"]
    return out


def apply_basic_comfort_to_ranking(df: pd.DataFrame, comfort_requirement: float) -> pd.DataFrame:
    """Apply user preference only after the objective Phase 3 comfort score exists."""
    out = df.copy()
    requirement = float(np.clip(comfort_requirement, 0.0, 1.0))
    threshold = 55.0 + 35.0 * requirement
    strength = 1.0 + 1.5 * requirement

    comfort = pd.to_numeric(out.get("basic_comfort"), errors="coerce").fillna(50.0).clip(0.0, 100.0)
    full_penalty = (comfort / threshold).clip(0.0, 1.0).pow(strength)
    penalty = (1.0 - requirement) + requirement * full_penalty

    out["legacy_score_floor_penalty"] = out.get("score_floor_penalty", 1.0)
    out["basic_comfort_requirement_threshold"] = threshold
    out["basic_comfort_penalty"] = penalty
    out["score_floor_penalty"] = penalty

    base = pd.to_numeric(out.get("score_base"), errors="coerce")
    cost = pd.to_numeric(out.get("score_tourism_cost"), errors="coerce")
    infra = pd.to_numeric(out.get("score_infra"), errors="coerce")
    safety = pd.to_numeric(out.get("score_safety"), errors="coerce")
    out["score_pre_basic_comfort"] = out.get("score")
    out["score_without_legacy_comfort"] = base * cost * infra * safety
    out["score"] = out["score_without_legacy_comfort"] * penalty
    out = out.dropna(subset=["score"]).sort_values("score", ascending=False).reset_index(drop=True)

    maximum = out["score"].max()
    out["component_overall_value"] = (
        100.0 * out["score"] / (maximum if pd.notna(maximum) and maximum > 0 else 1.0)
    ).round(2)
    return out
