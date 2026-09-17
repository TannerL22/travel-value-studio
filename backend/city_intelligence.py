from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
import math
import os
import threading
import time
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
from zipfile import ZipFile

import numpy as np
import pandas as pd
import pycountry
import requests


JRC_CITY_STATS_ZIP = (
    "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/"
    "GHS_WUP_MTUC_GLOBE_R2025A/V1-1/"
    "GHS_WUP_MTUC_GLOBE_R2025A_V1_1_statistics.zip"
)
OVERTURE_STAC = "https://stac.overturemaps.org/catalog.json"
OVERTURE_FALLBACK_RELEASE = "2026-08-19.0"
CITY_DATA_CACHE_TTL_SECONDS = int(os.getenv("CITY_DATA_CACHE_TTL_SECONDS", "604800"))
OVERTURE_AMENITY_CACHE_TTL_SECONDS = int(os.getenv("OVERTURE_AMENITY_CACHE_TTL_SECONDS", "604800"))
OVERTURE_CONFIDENCE_MIN = float(os.getenv("OVERTURE_CONFIDENCE_MIN", "0.75"))
CITY_CANDIDATE_LIMIT = int(os.getenv("CITY_CANDIDATE_LIMIT", "12"))
CITY_AMENITY_MAX_WORKERS = int(os.getenv("CITY_AMENITY_MAX_WORKERS", "4"))

# Phase 5 uses broad taxonomy branches so it survives category-level churn.
# These are discovery weights, not claims about universal quality-of-life utility.
AMENITY_GROUPS: Dict[str, Dict[str, object]] = {
    "food_drink": {
        "hierarchy": ["food_and_drink"],
        "weight": 0.27,
        "per_10k_target": 35.0,
        "per_km2_target": 8.0,
    },
    "shopping": {
        "hierarchy": ["shopping"],
        "weight": 0.20,
        "per_10k_target": 30.0,
        "per_km2_target": 6.0,
    },
    "health_care": {
        "hierarchy": ["health_care"],
        "weight": 0.15,
        "per_10k_target": 10.0,
        "per_km2_target": 2.0,
    },
    "recreation_culture": {
        "hierarchy": ["sports_and_recreation", "arts_and_entertainment", "cultural_and_historic"],
        "weight": 0.20,
        "per_10k_target": 14.0,
        "per_km2_target": 3.0,
    },
    "lifestyle_services": {
        "hierarchy": ["lifestyle_services"],
        "weight": 0.10,
        "per_10k_target": 10.0,
        "per_km2_target": 2.0,
    },
    "lodging": {
        "hierarchy": ["lodging"],
        "weight": 0.08,
        "per_10k_target": 5.0,
        "per_km2_target": 1.0,
    },
}

_CACHE_LOCK = threading.Lock()
_CITY_CACHE: Dict[str, object] = {"built_at": 0.0, "frame": None, "warning": ""}
_AMENITY_CACHE: Dict[Tuple[str, str], Tuple[float, Dict[str, object]]] = {}


def _norm(value: object) -> str:
    return "".join(ch for ch in str(value).strip().lower() if ch.isalnum())


def _pick_column(frame: pd.DataFrame, candidates: Iterable[str]) -> Optional[str]:
    normalized = {_norm(column): str(column) for column in frame.columns}
    for candidate in candidates:
        found = normalized.get(_norm(candidate))
        if found:
            return found
    return None


def _metric_year_column(frame: pd.DataFrame, prefixes: Iterable[str], year: int) -> Optional[str]:
    normalized = {_norm(column): str(column) for column in frame.columns}
    for prefix in prefixes:
        for pattern in (
            f"{prefix}{year}",
            f"{prefix}_{year}",
            f"{year}{prefix}",
            f"{year}_{prefix}",
        ):
            found = normalized.get(_norm(pattern))
            if found:
                return found
    return None


def _m49_to_iso3(value: object) -> Optional[str]:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    try:
        numeric = f"{int(float(value)):03d}"
    except (TypeError, ValueError, OverflowError):
        return None
    match = pycountry.countries.get(numeric=numeric)
    return getattr(match, "alpha_3", None) if match else None


def _country_name_to_iso3(value: object) -> Optional[str]:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return pycountry.countries.lookup(text).alpha_3
    except LookupError:
        aliases = {
            "bolivia (plurinational state of)": "BOL",
            "brunei darussalam": "BRN",
            "côte d'ivoire": "CIV",
            "cote d'ivoire": "CIV",
            "democratic republic of the congo": "COD",
            "iran (islamic republic of)": "IRN",
            "lao people's democratic republic": "LAO",
            "micronesia (federated states of)": "FSM",
            "republic of korea": "KOR",
            "republic of moldova": "MDA",
            "russian federation": "RUS",
            "state of palestine": "PSE",
            "syrian arab republic": "SYR",
            "taiwan province of china": "TWN",
            "united republic of tanzania": "TZA",
            "venezuela (bolivarian republic of)": "VEN",
            "viet nam": "VNM",
        }
        return aliases.get(text.lower())


def _canonicalize_city_sheet(frame: pd.DataFrame, target_year: int = 2025) -> pd.DataFrame:
    if frame.empty:
        return pd.DataFrame()

    city_id_col = _pick_column(frame, ["ID_UC_G0", "ID_UC", "ID_MTUC", "city_id"])
    city_name_col = _pick_column(
        frame,
        ["UC_NM_MN", "CityName", "CITY_NAME", "MainName", "Name", "UC_NM_LST"],
    )
    year_col = _pick_column(frame, ["Year", "Epoch", "reference_year"])
    country_m49_col = _pick_column(frame, ["Ctr_M49", "Country_M49", "M49", "UNLocCode"])
    country_name_col = _pick_column(frame, ["CtrName", "CountryName", "UNLocName", "Country"])
    iso3_col = _pick_column(frame, ["ISO3", "ISO_A3", "CountryISO3", "Ctr_ISO3"])
    population_col = _pick_column(frame, ["POP", "Population", "POP_2025"])
    area_col = _pick_column(frame, ["AREA_km2", "Area_km2", "LandArea_km2", "AREA"])
    built_col = _pick_column(frame, ["BU_km2", "BuiltUp_km2", "Built_km2"])
    lat_col = _pick_column(frame, ["Lat", "Latitude", "LAT"])
    lon_col = _pick_column(frame, ["Lon", "Longitude", "LON", "Lng"])
    capital_col = _pick_column(frame, ["CapitalFlag", "Capital_Flag", "Capital"])
    plausibility_col = _pick_column(frame, ["Plausibility", "PlausibilityLevel"])

    if year_col:
        year_values = pd.to_numeric(frame[year_col], errors="coerce")
        frame = frame.loc[year_values == int(target_year)].copy()
    else:
        population_col = population_col or _metric_year_column(frame, ["POP", "population"], target_year)
        area_col = area_col or _metric_year_column(frame, ["AREA_km2", "AREA", "landarea"], target_year)
        built_col = built_col or _metric_year_column(frame, ["BU_km2", "BU", "builtup"], target_year)

    required = [city_name_col, population_col, area_col, lat_col, lon_col]
    if any(column is None for column in required):
        return pd.DataFrame()

    out = pd.DataFrame(
        {
            "city_id": frame[city_id_col].astype(str) if city_id_col else frame.index.astype(str),
            "city_name": frame[city_name_col].astype(str),
            "population": pd.to_numeric(frame[population_col], errors="coerce"),
            "area_km2": pd.to_numeric(frame[area_col], errors="coerce"),
            "built_up_km2": pd.to_numeric(frame[built_col], errors="coerce") if built_col else np.nan,
            "lat": pd.to_numeric(frame[lat_col], errors="coerce"),
            "lon": pd.to_numeric(frame[lon_col], errors="coerce"),
            "capital_flag": frame[capital_col] if capital_col else None,
            "plausibility": pd.to_numeric(frame[plausibility_col], errors="coerce") if plausibility_col else np.nan,
        }
    )

    if iso3_col:
        out["iso3"] = frame[iso3_col].astype(str).str.upper().str.strip()
    elif country_m49_col:
        out["iso3"] = frame[country_m49_col].map(_m49_to_iso3)
    elif country_name_col:
        out["iso3"] = frame[country_name_col].map(_country_name_to_iso3)
    else:
        out["iso3"] = None

    if country_m49_col:
        out["country_m49"] = frame[country_m49_col]
    else:
        out["country_m49"] = np.nan
    out["country_name"] = frame[country_name_col].astype(str) if country_name_col else None
    out["reference_year"] = int(target_year)

    numeric_pop = out["population"].dropna()
    if not numeric_pop.empty and numeric_pop.median() < 10_000:
        out["population"] = out["population"] * 1000.0

    out = out.dropna(subset=["iso3", "city_name", "population", "area_km2", "lat", "lon"])
    out = out[(out["population"] >= 50_000) & (out["area_km2"] > 0)]
    out["city_name"] = out["city_name"].str.strip()
    out["city_id"] = out["city_id"].str.strip()
    out = out.drop_duplicates(subset=["city_id"], keep="first")
    return out.reset_index(drop=True)


def parse_jrc_city_statistics(zip_bytes: bytes, target_year: int = 2025) -> pd.DataFrame:
    """Parse the official GHS-WUP-MTUC statistics ZIP without relying on a sheet name."""
    candidates: List[pd.DataFrame] = []
    with ZipFile(BytesIO(zip_bytes)) as archive:
        workbook_names = [name for name in archive.namelist() if name.lower().endswith((".xlsx", ".xls"))]
        for workbook_name in workbook_names:
            data = archive.read(workbook_name)
            try:
                excel = pd.ExcelFile(BytesIO(data))
            except Exception:
                continue
            for sheet_name in excel.sheet_names:
                try:
                    frame = pd.read_excel(excel, sheet_name=sheet_name)
                    canonical = _canonicalize_city_sheet(frame, target_year=target_year)
                except Exception:
                    continue
                if not canonical.empty:
                    candidates.append(canonical)

    if not candidates:
        raise ValueError("No usable 2025 urban-centre table found in GHS-WUP-MTUC statistics ZIP")
    return max(candidates, key=len).reset_index(drop=True)


def fetch_city_universe(force_refresh: bool = False) -> Tuple[pd.DataFrame, str]:
    now = time.time()
    with _CACHE_LOCK:
        cached = _CITY_CACHE.get("frame")
        age = now - float(_CITY_CACHE.get("built_at") or 0.0)
        if isinstance(cached, pd.DataFrame) and not force_refresh and age <= CITY_DATA_CACHE_TTL_SECONDS:
            return cached.copy(), str(_CITY_CACHE.get("warning") or "")

    warning = ""
    try:
        response = requests.get(JRC_CITY_STATS_ZIP, timeout=120, headers={"User-Agent": "TravelValueStudio/1.0"})
        response.raise_for_status()
        frame = parse_jrc_city_statistics(response.content, target_year=2025)
    except Exception as exc:
        frame = pd.DataFrame(
            columns=[
                "city_id", "city_name", "iso3", "population", "area_km2", "built_up_km2",
                "lat", "lon", "capital_flag", "plausibility", "reference_year",
            ]
        )
        warning = f"jrc_city_universe_failed:{type(exc).__name__}"

    with _CACHE_LOCK:
        _CITY_CACHE["built_at"] = now
        _CITY_CACHE["frame"] = frame.copy()
        _CITY_CACHE["warning"] = warning
    return frame, warning


def city_bbox(lat: float, lon: float, area_km2: float) -> Tuple[float, float, float, float, float]:
    """Equivalent-area circle around the JRC population-weighted city centroid.

    The bounding box is used only for Parquet predicate pushdown. The Overture SQL
    applies a second approximate circular filter so counts are not taken from the
    entire rectangle and then divided by the smaller official city area.
    """
    equivalent_radius_km = math.sqrt(max(float(area_km2), 1.0) / math.pi)
    query_radius_km = float(np.clip(equivalent_radius_km, 2.5, 85.0))
    lat_delta = query_radius_km / 111.32
    lon_scale = max(0.15, math.cos(math.radians(float(lat))))
    lon_delta = query_radius_km / (111.32 * lon_scale)
    return (
        max(-180.0, float(lon) - lon_delta),
        max(-90.0, float(lat) - lat_delta),
        min(180.0, float(lon) + lon_delta),
        min(90.0, float(lat) + lat_delta),
        query_radius_km,
    )


def latest_overture_release() -> Tuple[str, str]:
    try:
        response = requests.get(OVERTURE_STAC, timeout=20, headers={"User-Agent": "TravelValueStudio/1.0"})
        response.raise_for_status()
        payload = response.json()
        latest = payload.get("latest")
        if isinstance(latest, str) and latest.strip():
            return latest.strip().rstrip("/"), "stac"
    except Exception:
        pass
    return OVERTURE_FALLBACK_RELEASE, "fallback"


def _group_case_sql(group: str, hierarchy_values: Sequence[str]) -> str:
    terms = " OR ".join(f"list_contains(taxonomy.hierarchy, '{value}')" for value in hierarchy_values)
    return f"SUM(CASE WHEN ({terms}) THEN 1 ELSE 0 END) AS {group}_count"


def _query_overture_counts(
    bbox: Tuple[float, float, float, float],
    release: str,
    confidence_min: float,
    centroid_lat: float,
    centroid_lon: float,
    radius_km: float,
) -> Dict[str, int]:
    try:
        import duckdb
    except ImportError as exc:
        raise RuntimeError("duckdb_not_installed") from exc

    xmin, ymin, xmax, ymax = bbox
    path = "s3://overturemaps-us-west-2/release/" f"{release}/theme=places/type=place/*"
    group_sql = ",\n            ".join(
        _group_case_sql(group, spec["hierarchy"])  # type: ignore[arg-type]
        for group, spec in AMENITY_GROUPS.items()
    )
    sql = f"""
        SELECT
            COUNT(*) AS amenity_total,
            {group_sql}
        FROM read_parquet('{path}', hive_partitioning=1)
        WHERE bbox.xmin BETWEEN ? AND ?
          AND bbox.ymin BETWEEN ? AND ?
          AND COALESCE(confidence, 0.0) >= ?
          AND COALESCE(operating_status, 'open') <> 'permanently_closed'
          AND (
              POWER((bbox.ymin - ?) * 111.32, 2)
              + POWER((bbox.xmin - ?) * 111.32 * COS(RADIANS(?)), 2)
          ) <= POWER(?, 2)
    """

    connection = duckdb.connect(database=":memory:")
    try:
        connection.execute("INSTALL httpfs")
        connection.execute("LOAD httpfs")
        connection.execute("SET s3_region='us-west-2'")
        row = connection.execute(
            sql,
            [
                float(xmin), float(xmax), float(ymin), float(ymax), float(confidence_min),
                float(centroid_lat), float(centroid_lon), float(centroid_lat), float(radius_km),
            ],
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        return {"amenity_total": 0, **{f"{group}_count": 0 for group in AMENITY_GROUPS}}
    keys = ["amenity_total", *[f"{group}_count" for group in AMENITY_GROUPS]]
    return {key: int(value or 0) for key, value in zip(keys, row)}


def _saturating_density(value: float, target: float) -> float:
    if target <= 0:
        return 0.0
    return float(np.clip(math.log1p(max(0.0, value)) / math.log1p(target), 0.0, 1.0))


def score_city_amenities(
    counts: Dict[str, int],
    population: float,
    area_km2: float,
) -> Dict[str, object]:
    population = max(float(population), 1.0)
    area_km2 = max(float(area_km2), 1.0)
    weighted_score = 0.0
    nonzero_groups = 0
    details: Dict[str, object] = {}

    for group, spec in AMENITY_GROUPS.items():
        count = int(counts.get(f"{group}_count", 0))
        per_10k = count / population * 10_000.0
        per_km2 = count / area_km2
        per_cap_score = _saturating_density(per_10k, float(spec["per_10k_target"]))
        spatial_score = _saturating_density(per_km2, float(spec["per_km2_target"]))
        group_score = math.sqrt(max(per_cap_score, 0.0) * max(spatial_score, 0.0))
        weighted_score += float(spec["weight"]) * group_score
        if count > 0:
            nonzero_groups += 1
        details[f"amenity_{group}_count"] = count
        details[f"amenity_{group}_per_10k"] = round(per_10k, 3)
        details[f"amenity_{group}_per_km2"] = round(per_km2, 3)
        details[f"amenity_{group}_score"] = round(group_score * 100.0, 2)

    diversity = nonzero_groups / max(len(AMENITY_GROUPS), 1)
    final = weighted_score * (0.75 + 0.25 * diversity)
    details["amenity_diversity"] = round(diversity, 4)
    details["amenity_depth"] = round(float(np.clip(final, 0.0, 1.0)) * 100.0, 2)
    details["amenity_total"] = int(counts.get("amenity_total", 0))
    details["amenity_total_per_10k"] = round(int(counts.get("amenity_total", 0)) / population * 10_000.0, 3)
    return details


def add_city_amenities(city: Dict[str, object], force_refresh: bool = False) -> Dict[str, object]:
    release, release_source = latest_overture_release()
    city_id = str(city.get("city_id") or "")
    cache_key = (city_id, release)
    now = time.time()
    with _CACHE_LOCK:
        cached = _AMENITY_CACHE.get(cache_key)
        if cached and not force_refresh and now - cached[0] <= OVERTURE_AMENITY_CACHE_TTL_SECONDS:
            return {**city, **cached[1]}

    lat = float(city["lat"])
    lon = float(city["lon"])
    area_km2 = float(city["area_km2"])
    population = float(city["population"])
    xmin, ymin, xmax, ymax, radius_km = city_bbox(lat, lon, area_km2)

    try:
        counts = _query_overture_counts(
            (xmin, ymin, xmax, ymax),
            release=release,
            confidence_min=OVERTURE_CONFIDENCE_MIN,
            centroid_lat=lat,
            centroid_lon=lon,
            radius_km=radius_km,
        )
        scored = score_city_amenities(counts, population=population, area_km2=area_km2)
        flags = ["proxy_city_footprint"]
        if int(scored.get("amenity_total", 0)) < 50:
            flags.append("thin_overture_sample")
        amenity = {
            **scored,
            "amenity_source": "overture_places",
            "amenity_release": release,
            "amenity_release_source": release_source,
            "amenity_confidence_min": OVERTURE_CONFIDENCE_MIN,
            "amenity_query_success": True,
            "amenity_footprint_method": "equivalent_area_circle_proxy",
            "amenity_query_radius_km": round(radius_km, 2),
            "amenity_flags": flags,
        }
    except Exception as exc:
        amenity = {
            "amenity_depth": None,
            "amenity_source": "unavailable",
            "amenity_release": release,
            "amenity_release_source": release_source,
            "amenity_confidence_min": OVERTURE_CONFIDENCE_MIN,
            "amenity_query_success": False,
            "amenity_footprint_method": "equivalent_area_circle_proxy",
            "amenity_query_radius_km": round(radius_km, 2),
            "amenity_flags": [f"overture_query_failed:{type(exc).__name__}", "proxy_city_footprint"],
        }

    with _CACHE_LOCK:
        _AMENITY_CACHE[cache_key] = (now, dict(amenity))
    return {**city, **amenity}


def get_country_cities(
    country_iso3: str,
    limit: int = 8,
    include_amenities: bool = True,
) -> Tuple[List[Dict[str, object]], Dict[str, object]]:
    iso3 = str(country_iso3).upper().strip()
    limit = max(1, min(int(limit), 20))
    universe, warning = fetch_city_universe()
    if universe.empty:
        return [], {
            "city_source": "JRC GHS-WUP-MTUC R2025A V1.1",
            "city_source_warning": warning or "city_universe_unavailable",
            "city_reference_year": 2025,
            "amenity_source": "Overture Maps Places",
        }

    country = universe[universe["iso3"] == iso3].copy()
    if country.empty:
        return [], {
            "city_source": "JRC GHS-WUP-MTUC R2025A V1.1",
            "city_source_warning": "country_not_in_city_universe",
            "city_reference_year": 2025,
            "amenity_source": "Overture Maps Places",
        }

    candidates = country.sort_values("population", ascending=False).head(max(limit, CITY_CANDIDATE_LIMIT))
    clean_records: List[Dict[str, object]] = []
    for row in candidates.to_dict(orient="records"):
        clean_records.append({key: (None if pd.isna(value) else value) for key, value in row.items()})

    if include_amenities:
        records: List[Optional[Dict[str, object]]] = [None] * len(clean_records)
        workers = min(max(1, CITY_AMENITY_MAX_WORKERS), len(clean_records))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {
                executor.submit(add_city_amenities, record): index
                for index, record in enumerate(clean_records)
            }
            for future in as_completed(futures):
                index = futures[future]
                try:
                    records[index] = future.result()
                except Exception as exc:
                    records[index] = {
                        **clean_records[index],
                        "amenity_depth": None,
                        "amenity_source": "unavailable",
                        "amenity_query_success": False,
                        "amenity_flags": [f"amenity_worker_failed:{type(exc).__name__}"],
                    }
        resolved = [record for record in records if record is not None]
    else:
        resolved = clean_records

    if include_amenities and any(record.get("amenity_depth") is not None for record in resolved):
        resolved.sort(
            key=lambda item: (
                item.get("amenity_depth") is not None,
                float(item.get("amenity_depth") or -1.0),
                float(item.get("population") or 0.0),
            ),
            reverse=True,
        )
        observed_rank = 0
        for record in resolved:
            if record.get("amenity_depth") is not None:
                observed_rank += 1
                record["amenity_rank_within_country"] = observed_rank
            else:
                record["amenity_rank_within_country"] = None
    else:
        resolved.sort(key=lambda item: float(item.get("population") or 0.0), reverse=True)
        for record in resolved:
            record["amenity_rank_within_country"] = None

    return resolved[:limit], {
        "city_source": "JRC GHS-WUP-MTUC R2025A V1.1 / UN WUP 2025 framework",
        "city_source_warning": warning,
        "city_reference_year": 2025,
        "city_count_in_country": int(len(country)),
        "candidate_count": int(len(candidates)),
        "amenity_source": "Overture Maps Places latest STAC release",
        "amenity_footprint_method": "equivalent_area_circle_proxy",
        "amenity_score_status": "city discovery signal; not yet part of country ranking",
    }
