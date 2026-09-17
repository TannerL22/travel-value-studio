from __future__ import annotations

from io import BytesIO
import math
import os
import threading
import time
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd
import pycountry
import requests

from data_sources import fetch_wdi_indicator

WEF_TTDI_2024_XLSX = "https://www3.weforum.org/docs/WEF_TTDI_2024_edition_data.xlsx"
WEF_GROUND_COLUMN = "Ground and Port Infrastructure pillar: 2024 Value"
WEF_ICT_COLUMN = "ICT Readiness pillar: 2024 Value"
MOBILITY_DATABASE_CSV = "https://files.mobilitydatabase.org/feeds_v2.csv"
FINDEX_2025_CSV = (
    "https://thedocs.worldbank.org/en/doc/"
    "be6615202d1f08a25855c8ac2d615122-0050012025/related/GlobalFindexDatabase2025.csv"
)

PHASE6_CACHE_TTL_SECONDS = int(os.getenv("PHASE6_CACHE_TTL_SECONDS", "86400"))
MOBILITY_CATALOG_CACHE_TTL_SECONDS = int(os.getenv("MOBILITY_CATALOG_CACHE_TTL_SECONDS", "86400"))

DIGITAL_WEIGHTS = {
    "internet": 0.35,
    "fixed_broadband": 0.15,
    "digital_payments": 0.35,
    "ttdi_ict": 0.15,
}

_CACHE_LOCK = threading.Lock()
_COUNTRY_CACHE: Dict[int, Tuple[float, pd.DataFrame, str]] = {}
_MOBILITY_CACHE: Dict[str, object] = {"built_at": 0.0, "frame": None, "warning": ""}


def _norm(value: object) -> str:
    return "".join(ch for ch in str(value).strip().lower() if ch.isalnum())


def _find_column(frame: pd.DataFrame, candidates: Iterable[str]) -> Optional[str]:
    normalized = {_norm(column): str(column) for column in frame.columns}
    for candidate in candidates:
        found = normalized.get(_norm(candidate))
        if found:
            return found
    return None


def _find_contains(frame: pd.DataFrame, required_tokens: Iterable[str]) -> Optional[str]:
    tokens = [_norm(token) for token in required_tokens]
    for column in frame.columns:
        normalized = _norm(column)
        if all(token in normalized for token in tokens):
            return str(column)
    return None


def _ttdi_to_100(value: object) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(numeric):
        return None
    return float(np.clip((numeric - 1.0) / 6.0, 0.0, 1.0) * 100.0)


def _saturating(value: object, floor: float, target: float) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(numeric):
        return None
    if target <= floor:
        raise ValueError("target must exceed floor")
    return float(np.clip((numeric - floor) / (target - floor), 0.0, 1.0))


def _parse_ttdi_phase6(workbook_bytes: bytes) -> pd.DataFrame:
    excel = pd.ExcelFile(BytesIO(workbook_bytes))
    for sheet_name in excel.sheet_names:
        frame = pd.read_excel(excel, sheet_name=sheet_name)
        if frame.empty:
            continue
        iso_col = _find_column(frame, ["ISO Code", "ISO3", "Economy ISO3"])
        ground_col = _find_column(frame, [WEF_GROUND_COLUMN])
        ict_col = _find_column(frame, [WEF_ICT_COLUMN])
        if not iso_col or (not ground_col and not ict_col):
            continue
        out = pd.DataFrame({"iso3": frame[iso_col].astype(str).str.upper().str.strip()})
        out["mobility_ttdi_2024_value"] = pd.to_numeric(frame[ground_col], errors="coerce") if ground_col else np.nan
        out["digital_ttdi_ict_2024_value"] = pd.to_numeric(frame[ict_col], errors="coerce") if ict_col else np.nan
        out = out[out["iso3"].str.fullmatch(r"[A-Z]{3}", na=False)]
        return out.drop_duplicates(subset=["iso3"], keep="first").reset_index(drop=True)
    raise ValueError("Phase 6 TTDI columns not found")


def _fetch_ttdi_phase6() -> Tuple[pd.DataFrame, str]:
    try:
        response = requests.get(WEF_TTDI_2024_XLSX, timeout=60, headers={"User-Agent": "TravelValueStudio/1.0"})
        response.raise_for_status()
        return _parse_ttdi_phase6(response.content), ""
    except Exception as exc:
        return pd.DataFrame(columns=["iso3", "mobility_ttdi_2024_value", "digital_ttdi_ict_2024_value"]), f"ttdi_phase6_failed:{type(exc).__name__}"


def _fetch_wdi_latest(indicator: str, target_year: int, field_name: str) -> Tuple[pd.DataFrame, str]:
    try:
        raw = fetch_wdi_indicator(indicator, max(2000, int(target_year) - 8), int(target_year))
        raw = raw.dropna(subset=["value"]).copy()
        raw = raw.sort_values(["iso3", "year"], ascending=[True, False])
        out = raw.groupby("iso3", as_index=False).head(1)[["iso3", "year", "value"]]
        out = out.rename(columns={"year": f"{field_name}_year", "value": field_name})
        out[field_name] = pd.to_numeric(out[field_name], errors="coerce")
        return out, ""
    except Exception as exc:
        return pd.DataFrame(columns=["iso3", f"{field_name}_year", field_name]), f"{field_name}_failed:{type(exc).__name__}"


def _parse_findex_csv(csv_bytes: bytes) -> pd.DataFrame:
    frame = pd.read_csv(BytesIO(csv_bytes), low_memory=False)
    iso_col = _find_column(frame, ["economycode", "economy code", "countrycode", "country code", "iso3", "code"])
    year_col = _find_column(frame, ["year", "surveyyear", "survey year"])
    payment_col = _find_column(frame, ["g20_t", "made or received digital payments in the past year (% age 15+)"])
    if payment_col is None:
        payment_col = _find_contains(frame, ["made", "received", "digital", "payments"])
    if iso_col is None or payment_col is None:
        raise ValueError("Findex ISO/payment columns not found")

    work = frame.copy()
    if year_col is not None:
        years = pd.to_numeric(work[year_col], errors="coerce")
        if (years == 2024).any():
            work = work.loc[years == 2024].copy()

    out = pd.DataFrame(
        {
            "iso3": work[iso_col].astype(str).str.upper().str.strip(),
            "digital_payments_pct": pd.to_numeric(work[payment_col], errors="coerce"),
        }
    )
    out = out[out["iso3"].str.fullmatch(r"[A-Z]{3}", na=False)]
    out = out.dropna(subset=["digital_payments_pct"])
    out["digital_payments_year"] = 2024
    return out.drop_duplicates(subset=["iso3"], keep="first").reset_index(drop=True)


def _fetch_findex() -> Tuple[pd.DataFrame, str]:
    try:
        response = requests.get(FINDEX_2025_CSV, timeout=60, headers={"User-Agent": "TravelValueStudio/1.0"})
        response.raise_for_status()
        return _parse_findex_csv(response.content), ""
    except Exception as exc:
        return pd.DataFrame(columns=["iso3", "digital_payments_pct", "digital_payments_year"]), f"findex_failed:{type(exc).__name__}"


def fetch_phase6_country_frame(target_year: int = 2025, force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _COUNTRY_CACHE.get(int(target_year))
        if cached and not force_refresh and now - cached[0] <= PHASE6_CACHE_TTL_SECONDS:
            return cached[1].copy(), cached[2]

    warnings: List[str] = []
    ttdi, warning = _fetch_ttdi_phase6()
    if warning:
        warnings.append(warning)
    internet, warning = _fetch_wdi_latest("IT.NET.USER.ZS", target_year, "digital_internet_users_pct")
    if warning:
        warnings.append(warning)
    fixed, warning = _fetch_wdi_latest("IT.NET.BBND.P2", target_year, "digital_fixed_broadband_per_100")
    if warning:
        warnings.append(warning)
    findex, warning = _fetch_findex()
    if warning:
        warnings.append(warning)

    frames = [frame for frame in [ttdi, internet, fixed, findex] if not frame.empty]
    if not frames:
        merged = pd.DataFrame(columns=["iso3"])
    else:
        merged = frames[0]
        for frame in frames[1:]:
            merged = merged.merge(frame, on="iso3", how="outer")

    rows: List[Dict[str, object]] = []
    for _, row in merged.iterrows():
        mobility = _ttdi_to_100(row.get("mobility_ttdi_2024_value"))
        inputs = {
            "internet": _saturating(row.get("digital_internet_users_pct"), 45.0, 95.0),
            "fixed_broadband": _saturating(row.get("digital_fixed_broadband_per_100"), 3.0, 35.0),
            "digital_payments": _saturating(row.get("digital_payments_pct"), 25.0, 90.0),
            "ttdi_ict": None,
        }
        ttdi_ict_100 = _ttdi_to_100(row.get("digital_ttdi_ict_2024_value"))
        if ttdi_ict_100 is not None:
            inputs["ttdi_ict"] = ttdi_ict_100 / 100.0

        numerator = 0.0
        denominator = 0.0
        coverage = 0.0
        for key, weight in DIGITAL_WEIGHTS.items():
            value = inputs.get(key)
            if value is None:
                continue
            numerator += weight * math.log(max(float(value), 0.01))
            denominator += weight
            coverage += weight
        digital = None if denominator <= 0 else float(np.clip(math.exp(numerator / denominator), 0.0, 1.0) * 100.0)

        record = row.to_dict()
        record.update(
            {
                "mobility": None if mobility is None else round(mobility, 2),
                "mobility_source": "wef_ttdi_2024_ground_port" if mobility is not None else "unavailable",
                "mobility_coverage": 1.0 if mobility is not None else 0.0,
                "digital_convenience": None if digital is None else round(digital, 2),
                "digital_convenience_coverage": round(float(coverage), 4),
                "digital_convenience_source": "direct_connectivity_findex_ttdi_blend" if digital is not None else "unavailable",
                "digital_internet_score": None if inputs["internet"] is None else round(float(inputs["internet"]) * 100.0, 2),
                "digital_fixed_broadband_score": None if inputs["fixed_broadband"] is None else round(float(inputs["fixed_broadband"]) * 100.0, 2),
                "digital_payments_score": None if inputs["digital_payments"] is None else round(float(inputs["digital_payments"]) * 100.0, 2),
                "digital_ttdi_ict_score": None if inputs["ttdi_ict"] is None else round(float(inputs["ttdi_ict"]) * 100.0, 2),
            }
        )
        rows.append(record)

    result = pd.DataFrame(rows)
    warning_text = "|".join(warnings)
    with _CACHE_LOCK:
        _COUNTRY_CACHE[int(target_year)] = (now, result.copy(), warning_text)
    return result, warning_text


def _canonicalize_mobility_catalog(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return pd.DataFrame()

    def col(*names: str) -> Optional[str]:
        exact = _find_column(frame, names)
        if exact:
            return exact
        return _find_contains(frame, names[-1].split()) if names else None

    data_type = col("data_type", "data type")
    status = col("status")
    official = col("is_official", "official")
    country = col("location.country_code", "country_code", "country code")
    municipality = col("location.municipality", "municipality")
    provider = col("provider")
    feed_id = col("id", "mdb_source_id")
    min_lat = col("location.bounding_box.minimum_latitude", "minimum_latitude")
    max_lat = col("location.bounding_box.maximum_latitude", "maximum_latitude")
    min_lon = col("location.bounding_box.minimum_longitude", "minimum_longitude")
    max_lon = col("location.bounding_box.maximum_longitude", "maximum_longitude")

    out = pd.DataFrame(index=frame.index)
    out["feed_id"] = frame[feed_id].astype(str) if feed_id else frame.index.astype(str)
    out["data_type"] = frame[data_type].astype(str).str.lower().str.strip() if data_type else "gtfs"
    out["status"] = frame[status].astype(str).str.lower().str.strip() if status else ""
    out["official"] = frame[official].astype(str).str.lower().str.strip() if official else ""
    out["country_code"] = frame[country].astype(str).str.upper().str.strip() if country else ""
    out["municipality"] = frame[municipality].astype(str).str.strip() if municipality else ""
    out["provider"] = frame[provider].astype(str).str.strip() if provider else ""
    for target, source in [("min_lat", min_lat), ("max_lat", max_lat), ("min_lon", min_lon), ("max_lon", max_lon)]:
        out[target] = pd.to_numeric(frame[source], errors="coerce") if source else np.nan
    return out.reset_index(drop=True)


def fetch_mobility_catalog(force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _MOBILITY_CACHE.get("frame")
        age = now - float(_MOBILITY_CACHE.get("built_at") or 0.0)
        if isinstance(cached, pd.DataFrame) and not force_refresh and age <= MOBILITY_CATALOG_CACHE_TTL_SECONDS:
            return cached.copy(), str(_MOBILITY_CACHE.get("warning") or "")

    warning = ""
    try:
        response = requests.get(MOBILITY_DATABASE_CSV, timeout=60, headers={"User-Agent": "TravelValueStudio/1.0"})
        response.raise_for_status()
        raw = pd.read_csv(BytesIO(response.content), low_memory=False)
        frame = _canonicalize_mobility_catalog(raw)
    except Exception as exc:
        frame = pd.DataFrame(columns=["feed_id", "data_type", "status", "official", "country_code", "municipality", "provider", "min_lat", "max_lat", "min_lon", "max_lon"])
        warning = f"mobility_catalog_failed:{type(exc).__name__}"

    with _CACHE_LOCK:
        _MOBILITY_CACHE["built_at"] = now
        _MOBILITY_CACHE["frame"] = frame.copy()
        _MOBILITY_CACHE["warning"] = warning
    return frame, warning


def _iso3_to_iso2(iso3: str) -> Optional[str]:
    match = pycountry.countries.get(alpha_3=str(iso3).upper().strip())
    return getattr(match, "alpha_2", None) if match else None


def city_gtfs_evidence(city: Dict[str, object], catalog: pd.DataFrame, country_iso3: str) -> Dict[str, object]:
    if catalog.empty:
        return {
            "mobility_gtfs_feed_count": None,
            "mobility_gtfs_official_feed_count": None,
            "mobility_gtfs_evidence": "unknown",
            "mobility_gtfs_providers": [],
        }

    iso2 = _iso3_to_iso2(country_iso3)
    work = catalog.copy()
    if iso2:
        country_mask = work["country_code"].eq(iso2)
        if country_mask.any():
            work = work[country_mask]
    if "data_type" in work.columns:
        work = work[work["data_type"].str.contains("gtfs", na=False) & ~work["data_type"].str.contains("rt", na=False)]
    if "status" in work.columns:
        active = work["status"].isin(["active", "", "nan"])
        if active.any():
            work = work[active]

    lat = float(city.get("lat") or 0.0)
    lon = float(city.get("lon") or 0.0)
    city_name = str(city.get("city_name") or "").lower().strip()
    has_box = work[["min_lat", "max_lat", "min_lon", "max_lon"]].notna().all(axis=1)
    in_box = has_box & (work["min_lat"] <= lat) & (work["max_lat"] >= lat) & (work["min_lon"] <= lon) & (work["max_lon"] >= lon)
    municipality_match = work["municipality"].str.lower().str.contains(city_name, regex=False, na=False) if city_name else pd.Series(False, index=work.index)
    matched = work[in_box | municipality_match]

    if matched.empty:
        # Absence in an open-data catalog is explicitly unknown, not evidence of no transit.
        return {
            "mobility_gtfs_feed_count": 0,
            "mobility_gtfs_official_feed_count": 0,
            "mobility_gtfs_evidence": "no_catalog_match_unknown_not_zero",
            "mobility_gtfs_providers": [],
        }

    official_mask = matched["official"].isin(["true", "1", "yes"])
    providers = [value for value in matched["provider"].dropna().astype(str).unique().tolist() if value and value != "nan"][:8]
    return {
        "mobility_gtfs_feed_count": int(len(matched)),
        "mobility_gtfs_official_feed_count": int(official_mask.sum()),
        "mobility_gtfs_evidence": "positive_catalog_evidence",
        "mobility_gtfs_providers": providers,
    }


def enrich_cities_phase6(
    cities: List[Dict[str, object]],
    country_iso3: str,
    target_year: int = 2025,
) -> Tuple[List[Dict[str, object]], Dict[str, object]]:
    country_frame, country_warning = fetch_phase6_country_frame(target_year=target_year)
    country_row: Dict[str, object] = {}
    if not country_frame.empty:
        match = country_frame[country_frame["iso3"] == str(country_iso3).upper().strip()]
        if not match.empty:
            country_row = match.iloc[0].where(pd.notna(match.iloc[0]), None).to_dict()

    catalog, catalog_warning = fetch_mobility_catalog()
    enriched: List[Dict[str, object]] = []
    for city in cities:
        gtfs = city_gtfs_evidence(city, catalog, country_iso3)
        enriched.append(
            {
                **city,
                "mobility": country_row.get("mobility"),
                "mobility_source": country_row.get("mobility_source", "unavailable"),
                "mobility_coverage": country_row.get("mobility_coverage", 0.0),
                "mobility_ttdi_2024_value": country_row.get("mobility_ttdi_2024_value"),
                **gtfs,
                "digital_convenience": country_row.get("digital_convenience"),
                "digital_convenience_coverage": country_row.get("digital_convenience_coverage", 0.0),
                "digital_convenience_source": country_row.get("digital_convenience_source", "unavailable"),
                "digital_internet_users_pct": country_row.get("digital_internet_users_pct"),
                "digital_fixed_broadband_per_100": country_row.get("digital_fixed_broadband_per_100"),
                "digital_payments_pct": country_row.get("digital_payments_pct"),
                "digital_internet_score": country_row.get("digital_internet_score"),
                "digital_fixed_broadband_score": country_row.get("digital_fixed_broadband_score"),
                "digital_payments_score": country_row.get("digital_payments_score"),
                "digital_ttdi_ict_score": country_row.get("digital_ttdi_ict_score"),
            }
        )

    return enriched, {
        "mobility_source": "WEF TTDI 2024 Ground and Port Infrastructure + MobilityDatabase GTFS metadata",
        "mobility_city_feed_absence_means_zero": False,
        "mobility_catalog_warning": catalog_warning,
        "digital_source": "ITU/WDI connectivity + Global Findex 2025 (2024 survey) + WEF TTDI 2024 ICT",
        "phase6_country_source_warning": country_warning,
        "phase6_scores_affect_country_ranking": False,
        "phase6_scores_affect_city_amenity_rank": False,
    }
