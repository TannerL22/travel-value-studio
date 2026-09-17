from __future__ import annotations

from io import BytesIO
import math
import os
import threading
import time
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd
import requests

from data_sources import fetch_wdi_indicator

WEF_TTDI_2024_XLSX = "https://www3.weforum.org/docs/WEF_TTDI_2024_edition_data.xlsx"
TTDI_SERVICE_COLUMN = "Tourist Services and Infrastructure pillar: 2024 Value"
TTDI_SERVICE_RANK_COLUMN = "Tourist Services and Infrastructure pillar: 2024 Rank"
POPULATION_INDICATOR = "SP.POP.TOTL"
SERVICE_DEPTH_CACHE_TTL_SECONDS = int(os.getenv("SERVICE_DEPTH_CACHE_TTL_SECONDS", "86400"))

# The WEF TTDI Tourist Services and Infrastructure pillar is already a supply-side
# composite: hotel-room density, short-term-rental density, hotel/restaurant labour
# productivity, and T&T capital investment intensity. We use it as the Phase 4
# country-level bootstrap, then replace/augment it with city amenity data in Phase 5.
TTDI_SOURCE_YEAR = 2024

_CACHE_LOCK = threading.Lock()
_TTDI_CACHE: Dict[str, object] = {"built_at": 0.0, "frame": None, "warning": ""}
_POP_CACHE: Dict[int, Tuple[float, pd.DataFrame, str]] = {}


def _normalize_column_name(value: object) -> str:
    return " ".join(str(value).replace("\n", " ").split()).strip().lower()


def _find_column(frame: pd.DataFrame, target: str) -> Optional[str]:
    normalized_target = _normalize_column_name(target)
    for column in frame.columns:
        if _normalize_column_name(column) == normalized_target:
            return str(column)
    return None


def _get_wef_workbook(timeout: int = 60) -> bytes:
    response = requests.get(
        WEF_TTDI_2024_XLSX,
        timeout=timeout,
        headers={"User-Agent": "TravelValueStudio/1.0"},
    )
    response.raise_for_status()
    return response.content


def _parse_ttdi_service_frame(workbook_bytes: bytes) -> pd.DataFrame:
    """Extract ISO3 and the 2024 Tourist Services pillar from the official workbook."""
    excel = pd.ExcelFile(BytesIO(workbook_bytes))
    for sheet_name in excel.sheet_names:
        frame = pd.read_excel(excel, sheet_name=sheet_name)
        if frame.empty:
            continue
        iso_column = _find_column(frame, "ISO Code")
        service_column = _find_column(frame, TTDI_SERVICE_COLUMN)
        if not iso_column or not service_column:
            continue
        rank_column = _find_column(frame, TTDI_SERVICE_RANK_COLUMN)
        keep = [iso_column, service_column] + ([rank_column] if rank_column else [])
        out = frame[keep].copy()
        rename_map = {
            iso_column: "iso3",
            service_column: "service_depth_ttdi_2024_value",
        }
        if rank_column:
            rename_map[rank_column] = "service_depth_ttdi_2024_rank"
        out = out.rename(columns=rename_map)
        out["iso3"] = out["iso3"].astype(str).str.upper().str.strip()
        out = out[out["iso3"].str.fullmatch(r"[A-Z]{3}", na=False)]
        out["service_depth_ttdi_2024_value"] = pd.to_numeric(
            out["service_depth_ttdi_2024_value"], errors="coerce"
        )
        if "service_depth_ttdi_2024_rank" in out.columns:
            out["service_depth_ttdi_2024_rank"] = pd.to_numeric(
                out["service_depth_ttdi_2024_rank"], errors="coerce"
            )
        out = out.dropna(subset=["service_depth_ttdi_2024_value"])
        return out.drop_duplicates(subset=["iso3"], keep="first").reset_index(drop=True)
    raise ValueError("TTDI Tourist Services and Infrastructure column not found")


def fetch_ttdi_service_frame(force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached_frame = _TTDI_CACHE.get("frame")
        age = now - float(_TTDI_CACHE.get("built_at") or 0.0)
        if isinstance(cached_frame, pd.DataFrame) and not force_refresh and age <= SERVICE_DEPTH_CACHE_TTL_SECONDS:
            return cached_frame.copy(), str(_TTDI_CACHE.get("warning") or "")

    warning = ""
    try:
        frame = _parse_ttdi_service_frame(_get_wef_workbook())
    except Exception as exc:
        frame = pd.DataFrame(
            columns=["iso3", "service_depth_ttdi_2024_value", "service_depth_ttdi_2024_rank"]
        )
        warning = f"wef_ttdi_2024_failed:{type(exc).__name__}"

    with _CACHE_LOCK:
        _TTDI_CACHE["built_at"] = now
        _TTDI_CACHE["frame"] = frame.copy()
        _TTDI_CACHE["warning"] = warning
    return frame, warning


def fetch_population_frame(target_year: int, force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _POP_CACHE.get(int(target_year))
        if cached and not force_refresh and now - cached[0] <= SERVICE_DEPTH_CACHE_TTL_SECONDS:
            return cached[1].copy(), cached[2]

    warning = ""
    try:
        raw = fetch_wdi_indicator(
            POPULATION_INDICATOR,
            max(2000, int(target_year) - 8),
            int(target_year),
        )
        raw = raw.dropna(subset=["value"]).copy()
        raw = raw.sort_values(["iso3", "year"], ascending=[True, False])
        frame = raw.groupby("iso3", as_index=False).head(1)[["iso3", "year", "value"]]
        frame = frame.rename(
            columns={"year": "service_depth_population_year", "value": "service_depth_population"}
        )
        frame["service_depth_population"] = pd.to_numeric(
            frame["service_depth_population"], errors="coerce"
        )
    except Exception as exc:
        frame = pd.DataFrame(
            columns=["iso3", "service_depth_population_year", "service_depth_population"]
        )
        warning = f"population_failed:{type(exc).__name__}"

    with _CACHE_LOCK:
        _POP_CACHE[int(target_year)] = (now, frame.copy(), warning)
    return frame, warning


def ttdi_pillar_to_score(value: object) -> Optional[float]:
    """Convert WEF's 1-7 pillar scale to a transparent 0-100 scale."""
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(numeric):
        return None
    return float(np.clip((numeric - 1.0) / 6.0, 0.0, 1.0) * 100.0)


def arrivals_maturity_fallback_score(arrivals_per_100_residents: object) -> Optional[float]:
    """Low-confidence fallback only; arrivals are demand/maturity evidence, not supply."""
    try:
        value = float(arrivals_per_100_residents)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(value) or value < 0:
        return None
    # Log transform stops tourism-heavy microstates from exploding the fallback.
    # The fallback is capped at 70 because demand/popularity cannot prove service supply.
    normalized = math.log1p(value) / math.log1p(100.0)
    return float(min(70.0, max(0.0, normalized * 100.0)))


def add_service_depth_v4(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    """Attach objective service-depth evidence independent of user preference."""
    out = df.copy()
    out["legacy_service_depth"] = pd.to_numeric(
        out.get("component_tourism_depth", pd.Series(np.nan, index=out.index)),
        errors="coerce",
    )

    warnings = []
    if int(target_year) >= TTDI_SOURCE_YEAR:
        ttdi, ttdi_warning = fetch_ttdi_service_frame()
        if ttdi_warning:
            warnings.append(ttdi_warning)
        if not ttdi.empty:
            out = out.merge(ttdi, on="iso3", how="left")
    if "service_depth_ttdi_2024_value" not in out.columns:
        out["service_depth_ttdi_2024_value"] = np.nan
    if "service_depth_ttdi_2024_rank" not in out.columns:
        out["service_depth_ttdi_2024_rank"] = np.nan

    population, pop_warning = fetch_population_frame(target_year)
    if pop_warning:
        warnings.append(pop_warning)
    if not population.empty:
        out = out.merge(population, on="iso3", how="left")
    if "service_depth_population" not in out.columns:
        out["service_depth_population"] = np.nan
    if "service_depth_population_year" not in out.columns:
        out["service_depth_population_year"] = np.nan

    out["service_depth_arrivals_per_100"] = np.where(
        pd.to_numeric(out.get("intl_arrivals"), errors="coerce").notna()
        & pd.to_numeric(out["service_depth_population"], errors="coerce").notna()
        & (pd.to_numeric(out["service_depth_population"], errors="coerce") > 0),
        pd.to_numeric(out.get("intl_arrivals"), errors="coerce")
        / pd.to_numeric(out["service_depth_population"], errors="coerce")
        * 100.0,
        np.nan,
    )
    out["service_depth_arrivals_fallback_score"] = out["service_depth_arrivals_per_100"].map(
        arrivals_maturity_fallback_score
    )
    out["service_depth_direct"] = out["service_depth_ttdi_2024_value"].map(ttdi_pillar_to_score)

    service_scores = []
    coverages = []
    sources = []
    reference_years = []
    flags_list = []

    for _, row in out.iterrows():
        direct = row.get("service_depth_direct")
        fallback = row.get("service_depth_arrivals_fallback_score")
        flags = []

        if pd.notna(direct):
            score = float(direct)
            coverage = 1.0
            source = "wef_ttdi_2024_tourist_services"
            reference_year = TTDI_SOURCE_YEAR
        elif pd.notna(fallback):
            score = float(fallback)
            coverage = 0.45
            source = "arrivals_per_capita_fallback"
            reference_year = row.get("arrivals_year")
            flags.append("service_depth_arrivals_fallback")
        else:
            score = np.nan
            coverage = 0.0
            source = "unavailable"
            reference_year = np.nan
            flags.append("missing_service_depth")

        if warnings:
            flags.append("service_depth_source_warning")
        service_scores.append(score)
        coverages.append(coverage)
        sources.append(source)
        reference_years.append(reference_year)
        flags_list.append(flags)

    out["service_depth"] = service_scores
    out["service_depth_coverage"] = coverages
    out["service_depth_source"] = sources
    out["service_depth_reference_year"] = reference_years
    out["service_depth_flags"] = flags_list
    out["service_depth_source_warnings"] = "|".join(warnings)

    # Compatibility alias: from Phase 4 onward this field means service supply,
    # not raw international-arrivals depth. The old value is kept separately.
    out["component_tourism_depth"] = out["service_depth"]
    return out


def apply_service_depth_to_ranking(df: pd.DataFrame, service_requirement: float) -> pd.DataFrame:
    """Apply service depth as a confidence-aware shortfall penalty, never a rich-market bonus."""
    out = df.copy()
    requirement = float(np.clip(service_requirement, 0.0, 1.0))
    threshold = 35.0 + 40.0 * requirement
    strength = 1.0 + 1.2 * requirement

    service = pd.to_numeric(
        out.get("service_depth", pd.Series(np.nan, index=out.index)), errors="coerce"
    )
    coverage = pd.to_numeric(
        out.get("service_depth_coverage", pd.Series(0.0, index=out.index)), errors="coerce"
    ).fillna(0.0).clip(0.0, 1.0)

    scoring_value = service.fillna(threshold).clip(0.0, 100.0)
    full_penalty = (scoring_value / threshold).clip(0.0, 1.0).pow(strength)
    penalty = 1.0 - requirement * coverage * (1.0 - full_penalty)

    out["service_depth_requirement_threshold"] = threshold
    out["service_depth_penalty"] = penalty
    out["score_pre_service_depth"] = out.get("score")
    out["score"] = pd.to_numeric(out.get("score"), errors="coerce") * penalty
    out = out.dropna(subset=["score"]).sort_values("score", ascending=False).reset_index(drop=True)

    maximum = out["score"].max()
    out["component_overall_value"] = (
        100.0 * out["score"] / (maximum if pd.notna(maximum) and maximum > 0 else 1.0)
    ).round(2)
    return out
