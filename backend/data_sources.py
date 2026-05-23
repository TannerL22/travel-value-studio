from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple, List
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import requests

from source_registry import compute_dataset_data_quality

IMF_API = "https://www.imf.org/external/datamapper/api/v1"
WDI_API = "https://api.worldbank.org/v2"

IMF_NGDPDPC = "NGDPDPC"
IMF_PPPPC = "PPPPC"
IMF_PCPIPCH = "PCPIPCH"

WDI_NOM_GDPPC_USD = "NY.GDP.PCAP.CD"
WDI_PPP_GDPPC_INTL = "NY.GDP.PCAP.PP.CD"
WDI_PPP_PRIV = "PA.NUS.PRVT.PP"
WDI_FX = "PA.NUS.FCRF"
WDI_ARRIVALS = "ST.INT.ARVL"
WDI_WGI_STABILITY = "PV.EST"
WDI_CPI = "FP.CPI.TOTL.ZG"

RESTCOUNTRIES_ALPHA = "https://restcountries.com/v3.1/alpha"
EXCHANGE_RATES = "https://api.exchangerate.host/latest"
FRANKFURTER_API = "https://api.frankfurter.dev/v1"


@dataclass
class SeriesVintage:
    source: str
    year_used: int
    note: str = ""


def _get_json(url: str, params: Optional[dict] = None, timeout: int = 60):
    r = requests.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    return r.json()


def fetch_imf_series(indicator: str) -> Dict[str, Dict[str, float]]:
    js = _get_json(f"{IMF_API}/{indicator}")
    return js.get("values", {}).get(indicator, {})


def fetch_wdi_indicator(indicator: str, start_year: int, end_year: int) -> pd.DataFrame:
    url = f"{WDI_API}/country/all/indicator/{indicator}"
    params = {"date": f"{start_year}:{end_year}", "format": "json", "per_page": 20000}
    js = _get_json(url, params=params)
    if not isinstance(js, list) or len(js) < 2:
        return pd.DataFrame(columns=["iso3", "country", "year", "value"])
    rows = []
    for row in js[1]:
        if not row:
            continue
        iso3 = row.get("countryiso3code")
        if not iso3:
            continue
        country = (row.get("country") or {}).get("value")
        year = row.get("date")
        val = row.get("value")
        if year is None:
            continue
        rows.append((iso3, country, int(year), val))
    return pd.DataFrame(rows, columns=["iso3", "country", "year", "value"])


def _latest_value_by_country(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    d = df[df["year"] <= target_year].copy()
    d = d.dropna(subset=["value"])
    if d.empty:
        return pd.DataFrame(columns=["iso3", "country", "value", "year_used"])
    d = d.sort_values(["iso3", "year"], ascending=[True, False])
    out = d.groupby("iso3", as_index=False).head(1).rename(columns={"year": "year_used"})
    return out[["iso3", "country", "value", "year_used"]]


def _minmax(s: pd.Series, q=(0.01, 0.99)) -> pd.Series:
    s = pd.to_numeric(s, errors="coerce").replace([np.inf, -np.inf], np.nan)
    if s.dropna().empty:
        return pd.Series(np.nan, index=s.index)
    lo = s.quantile(q[0])
    hi = s.quantile(q[1])
    s = s.clip(lo, hi)
    mn, mx = s.min(), s.max()
    if pd.isna(mn) or pd.isna(mx) or mx == mn:
        return pd.Series(np.nan, index=s.index)
    return (s - mn) / (mx - mn)


def _component_score(s: pd.Series) -> pd.Series:
    return (100.0 * s.clip(0, 1)).round(2)


def _fx_tailwind_interpretation(ratio: object, base_label: str = "USD") -> str:
    if pd.isna(ratio):
        return "Proxy only"
    value = float(ratio)
    if value >= 1.1:
        return f"{base_label} materially stronger than recent history"
    if value >= 1.03:
        return f"{base_label} modestly stronger than recent history"
    if value >= 0.97:
        return "Near recent FX history"
    return f"{base_label} weaker than recent history"


def _as_positive_float(value: object) -> Optional[float]:
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(out) or out <= 0:
        return None
    return out


def compute_cross_rate_from_usd_rates(
    rates_lcu_per_usd: Dict[str, float],
    destination_currency: str,
    origin_currency: str,
) -> Optional[float]:
    """Return destination currency per origin currency from USD-base rate tables."""
    destination_lcu_per_usd = _as_positive_float(rates_lcu_per_usd.get(destination_currency))
    origin_lcu_per_usd = _as_positive_float(rates_lcu_per_usd.get(origin_currency))
    if destination_lcu_per_usd is None or origin_lcu_per_usd is None:
        return None
    return destination_lcu_per_usd / origin_lcu_per_usd


def compute_fx_tailwind_ratio_from_usd_rates(
    current_rates_lcu_per_usd: Dict[str, float],
    historical_rates_lcu_per_usd: Dict[str, float],
    destination_currency: str,
    origin_currency: str,
) -> Optional[float]:
    """Compare the current destination/origin cross rate with a historical cross rate."""
    current_cross = compute_cross_rate_from_usd_rates(
        current_rates_lcu_per_usd,
        destination_currency,
        origin_currency,
    )
    historical_cross = compute_cross_rate_from_usd_rates(
        historical_rates_lcu_per_usd,
        destination_currency,
        origin_currency,
    )
    if current_cross is None or historical_cross is None:
        return None
    return current_cross / historical_cross


def compute_fx_tailwind_from_usd_tables(
    destination_currency: str,
    origin_currency: str,
    current_rates_lcu_per_usd: Dict[str, float],
    one_year_rates_lcu_per_usd: Dict[str, float],
    three_year_rates_lcu_per_usd: Dict[str, float],
) -> Dict[str, Optional[float]]:
    one_year_ratio = compute_fx_tailwind_ratio_from_usd_rates(
        current_rates_lcu_per_usd,
        one_year_rates_lcu_per_usd,
        destination_currency,
        origin_currency,
    )
    three_year_ratio = compute_fx_tailwind_ratio_from_usd_rates(
        current_rates_lcu_per_usd,
        three_year_rates_lcu_per_usd,
        destination_currency,
        origin_currency,
    )
    ratios = [ratio for ratio in [one_year_ratio, three_year_ratio] if ratio is not None]
    recent_ratio = sum(ratios) / len(ratios) if ratios else None
    return {
        "fx_tailwind_1y_origin_ratio": one_year_ratio,
        "fx_tailwind_3y_origin_ratio": three_year_ratio,
        "fx_tailwind_origin_recent_ratio": recent_ratio,
    }


def _currency_rate_map(df: pd.DataFrame, column: str) -> Dict[str, float]:
    rates: Dict[str, float] = {"USD": 1.0}
    if column not in df.columns or "currency" not in df.columns:
        return rates
    for _, row in df[["currency", column]].dropna().iterrows():
        currency = str(row["currency"])
        value = _as_positive_float(row[column])
        if currency and value is not None and currency not in rates:
            rates[currency] = value
    return rates


def add_origin_fx_tailwind_diagnostics(
    df: pd.DataFrame,
    origin_currency: Optional[str],
) -> pd.DataFrame:
    out = df.copy()
    out["fx_tailwind_origin_currency"] = origin_currency
    out["fx_tailwind_origin_1y"] = np.nan
    out["fx_tailwind_origin_3y"] = np.nan
    out["fx_tailwind_origin_recent_ratio"] = np.nan
    out["fx_tailwind_origin_1y_pct"] = np.nan
    out["fx_tailwind_origin_3y_pct"] = np.nan
    out["fx_tailwind_origin_interpretation"] = "Origin FX unavailable"
    out["fx_tailwind_origin_source"] = "UNAVAILABLE"

    if not origin_currency or "currency" not in out.columns:
        return out

    current_rates = _currency_rate_map(out, "fx_lcu_per_usd_live")
    selected_fx_rates = _currency_rate_map(out, "fx_lcu_per_usd")
    current_rates = {**selected_fx_rates, **current_rates}
    one_year_rates = _currency_rate_map(out, "fx_lcu_per_usd_1y_ago")
    three_year_rates = _currency_rate_map(out, "fx_lcu_per_usd_3y_ago")

    if origin_currency not in current_rates:
        return out

    for idx, row in out.iterrows():
        destination_currency = row.get("currency")
        if pd.isna(destination_currency):
            continue
        diagnostics = compute_fx_tailwind_from_usd_tables(
            str(destination_currency),
            str(origin_currency),
            current_rates,
            one_year_rates,
            three_year_rates,
        )
        one_year_ratio = diagnostics["fx_tailwind_1y_origin_ratio"]
        three_year_ratio = diagnostics["fx_tailwind_3y_origin_ratio"]
        recent_ratio = diagnostics["fx_tailwind_origin_recent_ratio"]

        if one_year_ratio is not None:
            out.at[idx, "fx_tailwind_origin_1y"] = one_year_ratio
            out.at[idx, "fx_tailwind_origin_1y_pct"] = (one_year_ratio - 1.0) * 100.0
        if three_year_ratio is not None:
            out.at[idx, "fx_tailwind_origin_3y"] = three_year_ratio
            out.at[idx, "fx_tailwind_origin_3y_pct"] = (three_year_ratio - 1.0) * 100.0
        if recent_ratio is not None:
            out.at[idx, "fx_tailwind_origin_recent_ratio"] = recent_ratio
            out.at[idx, "fx_tailwind_origin_interpretation"] = _fx_tailwind_interpretation(
                recent_ratio,
                str(origin_currency),
            )
            out.at[idx, "fx_tailwind_origin_source"] = "HISTORICAL_CROSS"

    return out


def _get_inf(inf_imf: pd.DataFrame, inf_wdi: pd.DataFrame, iso3: str, year: int) -> Optional[float]:
    v = inf_imf[(inf_imf.iso3 == iso3) & (inf_imf.year == year)]
    if not v.empty and pd.notna(v.iloc[0].inf):
        return float(v.iloc[0].inf)
    v2 = inf_wdi[(inf_wdi.iso3 == iso3) & (inf_wdi.year == year)]
    if not v2.empty and pd.notna(v2.iloc[0].inf):
        return float(v2.iloc[0].inf)
    return None


def _nowcast_ppp_private(df: pd.DataFrame, target_year: int, inf_imf: pd.DataFrame, inf_wdi: pd.DataFrame) -> pd.DataFrame:
    if "ppp_private_lcu_per_int" not in df.columns or "ppp_private_year" not in df.columns:
        return df
    us = "USA"
    out = df.copy()
    out["ppp_private_is_nowcast"] = False

    base = out.set_index("iso3")["ppp_private_lcu_per_int"]
    base_year = out.set_index("iso3")["ppp_private_year"].fillna(target_year).astype(int)

    now_vals = {}
    now_flags = {}
    for iso3 in out["iso3"].tolist():
        if iso3 not in base.index or pd.isna(base.loc[iso3]) or pd.isna(base_year.loc[iso3]):
            continue
        by = int(base_year.loc[iso3])
        val = float(base.loc[iso3])
        if by >= target_year:
            now_vals[iso3] = val
            now_flags[iso3] = False
            continue
        factor = 1.0
        ok = True
        for y in range(by + 1, target_year + 1):
            c = _get_inf(inf_imf, inf_wdi, iso3, y)
            u = _get_inf(inf_imf, inf_wdi, us, y)
            if c is None or u is None:
                ok = False
                break
            factor *= (1.0 + c / 100.0) / (1.0 + u / 100.0)
        if ok and np.isfinite(factor) and factor > 0:
            now_vals[iso3] = val * factor
            now_flags[iso3] = True
        else:
            now_vals[iso3] = val
            now_flags[iso3] = False

    out["ppp_private_lcu_per_int"] = out["iso3"].map(now_vals).combine_first(out["ppp_private_lcu_per_int"])
    out["ppp_private_is_nowcast"] = out["iso3"].map(now_flags).fillna(False)
    return out


def fetch_country_currency_map(iso3_list: List[str]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    batch = 50
    for i in range(0, len(iso3_list), batch):
        codes = ",".join(iso3_list[i:i+batch])
        js = _get_json(f"{RESTCOUNTRIES_ALPHA}?codes={codes}", params={"fields": "cca3,currencies"}, timeout=60)
        if not isinstance(js, list):
            continue
        for item in js:
            cca3 = item.get("cca3")
            currencies = item.get("currencies") or {}
            if cca3 and isinstance(currencies, dict) and len(currencies) > 0:
                mapping[cca3] = list(currencies.keys())[0]
    return mapping


def fetch_live_fx_usd() -> Tuple[Dict[str, float], Optional[str]]:
    js = _get_json(EXCHANGE_RATES, params={"base": "USD"}, timeout=60)
    rates = js.get("rates", {}) if isinstance(js, dict) else {}
    date = js.get("date") if isinstance(js, dict) else None
    out = {}
    for k, v in rates.items():
        try:
            out[k] = float(v)
        except Exception:
            pass
    return out, date


def fetch_frankfurter_rates_usd(date: Optional[str] = None) -> Tuple[Dict[str, float], Optional[str]]:
    endpoint = f"{FRANKFURTER_API}/{date}" if date else f"{FRANKFURTER_API}/latest"
    js = _get_json(endpoint, params={"base": "USD"}, timeout=60)
    rates = js.get("rates", {}) if isinstance(js, dict) else {}
    rate_date = js.get("date") if isinstance(js, dict) else None
    out = {"USD": 1.0}
    for k, v in rates.items():
        try:
            out[k] = float(v)
        except Exception:
            pass
    return out, rate_date


def fetch_frankfurter_fx_history_usd() -> Dict[str, object]:
    warnings = []
    try:
        latest_rates, latest_date = fetch_frankfurter_rates_usd()
    except Exception:
        return {
            "latest_rates": {},
            "latest_date": None,
            "one_year_rates": {},
            "one_year_date": None,
            "three_year_rates": {},
            "three_year_date": None,
            "warnings": ["frankfurter_latest_failed"],
        }

    if not latest_date:
        return {
            "latest_rates": latest_rates,
            "latest_date": None,
            "one_year_rates": {},
            "one_year_date": None,
            "three_year_rates": {},
            "three_year_date": None,
            "warnings": ["frankfurter_latest_date_missing"],
        }

    latest_dt = datetime.fromisoformat(latest_date).replace(tzinfo=timezone.utc)
    one_year_target = (latest_dt - timedelta(days=365)).date().isoformat()
    three_year_target = (latest_dt - timedelta(days=365 * 3)).date().isoformat()

    try:
        one_year_rates, one_year_date = fetch_frankfurter_rates_usd(one_year_target)
    except Exception:
        one_year_rates, one_year_date = {}, None
        warnings.append("frankfurter_1y_failed")

    try:
        three_year_rates, three_year_date = fetch_frankfurter_rates_usd(three_year_target)
    except Exception:
        three_year_rates, three_year_date = {}, None
        warnings.append("frankfurter_3y_failed")

    return {
        "latest_rates": latest_rates,
        "latest_date": latest_date,
        "one_year_rates": one_year_rates,
        "one_year_date": one_year_date,
        "three_year_rates": three_year_rates,
        "three_year_date": three_year_date,
        "warnings": warnings,
    }


def build_dataset(
    target_year: int,
    use_imf_for_gdp: bool = True,
    use_nowcast_for_2025plus: bool = True,
    use_live_fx: bool = False,
    ttdi_df: Optional[pd.DataFrame] = None,
    start_year: int = 2019
) -> Tuple[pd.DataFrame, Dict[str, SeriesVintage]]:
    vintages: Dict[str, SeriesVintage] = {}
    end_year = target_year

    nom = _latest_value_by_country(fetch_wdi_indicator(WDI_NOM_GDPPC_USD, start_year, end_year), target_year)\
        .rename(columns={"value": "gdp_nom_pc_usd", "year_used": "gdp_nom_year"})
    ppp = _latest_value_by_country(fetch_wdi_indicator(WDI_PPP_GDPPC_INTL, start_year, end_year), target_year)\
        .rename(columns={"value": "gdp_ppp_pc_int", "year_used": "gdp_ppp_year"})
    ppp_priv = _latest_value_by_country(fetch_wdi_indicator(WDI_PPP_PRIV, start_year, end_year), target_year)\
        .rename(columns={"value": "ppp_private_lcu_per_int", "year_used": "ppp_private_year"})
    fx = _latest_value_by_country(fetch_wdi_indicator(WDI_FX, start_year, end_year), target_year)\
        .rename(columns={"value": "fx_lcu_per_usd", "year_used": "fx_year"})
    arr = _latest_value_by_country(fetch_wdi_indicator(WDI_ARRIVALS, start_year, end_year), target_year)\
        .rename(columns={"value": "intl_arrivals", "year_used": "arrivals_year"})
    wgi = _latest_value_by_country(fetch_wdi_indicator(WDI_WGI_STABILITY, start_year, end_year), target_year)\
        .rename(columns={"value": "wgi_political_stability", "year_used": "wgi_year"})
    cpi = fetch_wdi_indicator(WDI_CPI, start_year, end_year).rename(columns={"value": "inf"})[["iso3", "year", "inf"]]

    df = nom[["iso3", "country", "gdp_nom_pc_usd", "gdp_nom_year"]].copy()
    for other in [ppp, ppp_priv, fx, arr, wgi]:
        df = df.merge(other, on="iso3", how="outer", suffixes=("", "_x"))
        if "country_x" in df.columns:
            df["country"] = df["country"].fillna(df["country_x"])
            df = df.drop(columns=["country_x"])

    imf_inf_rows = []
    if use_imf_for_gdp:
        try:
            imf_nom = fetch_imf_series(IMF_NGDPDPC)
            imf_ppp = fetch_imf_series(IMF_PPPPC)
            df["imf_gdp_nom_pc_usd"] = df["iso3"].map(lambda k: imf_nom.get(k, {}).get(str(target_year)))
            df["imf_gdp_ppp_pc_int"] = df["iso3"].map(lambda k: imf_ppp.get(k, {}).get(str(target_year)))
            df["gdp_nom_pc_usd"] = df["imf_gdp_nom_pc_usd"].combine_first(df["gdp_nom_pc_usd"])
            df["gdp_ppp_pc_int"] = df["imf_gdp_ppp_pc_int"].combine_first(df["gdp_ppp_pc_int"])
            vintages["gdp_nom_pc_usd"] = SeriesVintage("IMF WEO (DataMapper)", target_year)
            vintages["gdp_ppp_pc_int"] = SeriesVintage("IMF WEO (DataMapper)", target_year)
        except Exception:
            pass

    try:
        imf_inf = fetch_imf_series(IMF_PCPIPCH)
        for iso3, series in imf_inf.items():
            for y_str, val in series.items():
                y = int(y_str)
                if start_year <= y <= target_year:
                    imf_inf_rows.append((iso3, y, float(val)))
    except Exception:
        pass
    inf_imf = pd.DataFrame(imf_inf_rows, columns=["iso3", "year", "inf"])

    if use_nowcast_for_2025plus and target_year >= 2025:
        df = _nowcast_ppp_private(df, target_year, inf_imf, cpi)
        vintages["ppp_private_lcu_per_int"] = SeriesVintage(
            "WDI (latest) + inflation-differential nowcast (IMF PCPIPCH; WDI CPI fallback)",
            target_year,
            "PPP private consumption nowcasted from latest available year using inflation differentials vs USA."
        )

    df["fx_source"] = "WDI"
    df["fx_live_date"] = np.nan
    df["currency"] = np.nan
    df["fx_lcu_per_usd_frankfurter"] = np.nan
    df["fx_lcu_per_usd_live_fallback"] = np.nan
    df["fx_lcu_per_usd_live"] = np.nan
    df["fx_lcu_per_usd_1y_ago"] = np.nan
    df["fx_lcu_per_usd_3y_ago"] = np.nan
    df["fx_tailwind_1y"] = np.nan
    df["fx_tailwind_3y"] = np.nan
    df["fx_tailwind_recent_ratio"] = np.nan
    df["fx_tailwind_1y_pct"] = np.nan
    df["fx_tailwind_3y_pct"] = np.nan
    df["fx_tailwind_signal"] = np.nan
    df["fx_tailwind_source"] = "UNAVAILABLE"
    df["fx_tailwind_interpretation"] = "Proxy only"
    df["fx_frankfurter_date"] = np.nan
    df["fx_frankfurter_1y_date"] = np.nan
    df["fx_frankfurter_3y_date"] = np.nan
    df["fx_reference_dates_available"] = False
    df["fx_enrichment_warnings"] = ""

    if use_live_fx:
        fx_warnings: List[str] = []
        iso3s = sorted(df["iso3"].dropna().unique().tolist())

        try:
            cur_map = fetch_country_currency_map(iso3s)
        except Exception:
            cur_map = {}
            fx_warnings.append("currency_mapping_failed")
        df["currency"] = df["iso3"].map(cur_map)

        fx_history = fetch_frankfurter_fx_history_usd()
        fx_warnings.extend(fx_history.get("warnings", []))
        frankfurter_rates = fx_history.get("latest_rates", {})

        fallback_rates: Dict[str, float] = {}
        fallback_rate_date: Optional[str] = None
        try:
            fallback_rates, fallback_rate_date = fetch_live_fx_usd()
        except Exception:
            fx_warnings.append("legacy_live_fx_failed")

        df["fx_lcu_per_usd_frankfurter"] = df["currency"].map(frankfurter_rates)
        df["fx_lcu_per_usd_live_fallback"] = df["currency"].map(fallback_rates)
        df["fx_lcu_per_usd_live"] = df["fx_lcu_per_usd_frankfurter"].combine_first(
            df["fx_lcu_per_usd_live_fallback"]
        )
        df["fx_lcu_per_usd_1y_ago"] = df["currency"].map(fx_history.get("one_year_rates", {}))
        df["fx_lcu_per_usd_3y_ago"] = df["currency"].map(fx_history.get("three_year_rates", {}))
        df["fx_tailwind_1y"] = np.where(
            df["fx_lcu_per_usd_live"].notna()
            & df["fx_lcu_per_usd_1y_ago"].notna()
            & (df["fx_lcu_per_usd_1y_ago"] > 0),
            df["fx_lcu_per_usd_live"] / df["fx_lcu_per_usd_1y_ago"],
            np.nan,
        )
        df["fx_tailwind_3y"] = np.where(
            df["fx_lcu_per_usd_live"].notna()
            & df["fx_lcu_per_usd_3y_ago"].notna()
            & (df["fx_lcu_per_usd_3y_ago"] > 0),
            df["fx_lcu_per_usd_live"] / df["fx_lcu_per_usd_3y_ago"],
            np.nan,
        )
        fx_tailwind_ratio = pd.concat(
            [df["fx_tailwind_1y"], df["fx_tailwind_3y"]],
            axis=1,
        ).mean(axis=1, skipna=True)
        df["fx_tailwind_recent_ratio"] = fx_tailwind_ratio
        df["fx_tailwind_1y_pct"] = (df["fx_tailwind_1y"] - 1.0) * 100.0
        df["fx_tailwind_3y_pct"] = (df["fx_tailwind_3y"] - 1.0) * 100.0
        # Ratio > 1 means USD currently buys more destination currency than the historical reference.
        # The 0.80..1.20 band maps weaker-than-history to 0, neutral to 0.5, and strong tailwind to 1.
        df["fx_tailwind_signal"] = ((fx_tailwind_ratio - 0.8) / 0.4).clip(0, 1)
        df["fx_tailwind_source"] = np.where(
            df["fx_tailwind_signal"].notna(),
            "FRANKFURTER",
            "UNAVAILABLE",
        )
        df["fx_tailwind_interpretation"] = df["fx_tailwind_recent_ratio"].map(_fx_tailwind_interpretation)
        df["fx_lcu_per_usd"] = df["fx_lcu_per_usd_live"].combine_first(df["fx_lcu_per_usd"])
        df["fx_source"] = np.select(
            [
                df["fx_lcu_per_usd_frankfurter"].notna(),
                df["fx_lcu_per_usd_live_fallback"].notna(),
            ],
            ["FRANKFURTER", "LIVE_FX"],
            default="WDI",
        )
        df["fx_frankfurter_date"] = fx_history.get("latest_date")
        df["fx_frankfurter_1y_date"] = fx_history.get("one_year_date")
        df["fx_frankfurter_3y_date"] = fx_history.get("three_year_date")
        df["fx_reference_dates_available"] = (
            df["fx_frankfurter_1y_date"].notna()
            & df["fx_frankfurter_3y_date"].notna()
        )
        df["fx_live_date"] = np.where(
            df["fx_lcu_per_usd_frankfurter"].notna(),
            fx_history.get("latest_date"),
            np.where(df["fx_lcu_per_usd_live_fallback"].notna(), fallback_rate_date, np.nan),
        )
        df["fx_enrichment_warnings"] = "|".join(fx_warnings)
        vintages["fx_lcu_per_usd"] = SeriesVintage(
            "Frankfurter latest FX (USD base) + RestCountries currency mapping; fallback legacy live FX then WDI",
            target_year,
            f"Frankfurter date: {fx_history.get('latest_date')}; fallback live FX date: {fallback_rate_date}; warnings: {df['fx_enrichment_warnings'].iloc[0]}"
        )
        vintages["fx_tailwind_signal"] = SeriesVintage(
            "Frankfurter historical FX, latest versus 1y and 3y references",
            target_year,
            f"Reference dates: {fx_history.get('one_year_date')}, {fx_history.get('three_year_date')}"
        )

    df["tourism_pp_power"] = np.where(
        df["fx_lcu_per_usd"].notna() & df["ppp_private_lcu_per_int"].notna() & (df["ppp_private_lcu_per_int"] != 0),
        df["fx_lcu_per_usd"].astype(float) / df["ppp_private_lcu_per_int"].astype(float),
        np.nan
    )

    if ttdi_df is not None and not ttdi_df.empty and "iso3" in ttdi_df.columns:
        cols = ["iso3"] + [c for c in ["touri_infra", "safety", "price_comp"] if c in ttdi_df.columns]
        df = df.merge(ttdi_df[cols], on="iso3", how="left")

    for c in ["gdp_nom_pc_usd","gdp_ppp_pc_int","ppp_private_lcu_per_int","fx_lcu_per_usd",
              "tourism_pp_power","intl_arrivals","wgi_political_stability",
              "touri_infra","safety","price_comp","fx_lcu_per_usd_live",
              "fx_lcu_per_usd_frankfurter","fx_lcu_per_usd_live_fallback",
              "fx_lcu_per_usd_1y_ago","fx_lcu_per_usd_3y_ago",
              "fx_tailwind_1y","fx_tailwind_3y","fx_tailwind_recent_ratio",
              "fx_tailwind_1y_pct","fx_tailwind_3y_pct","fx_tailwind_signal"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    df = df[df["iso3"].notna() & (df["iso3"] != "")]
    df["country"] = df["country"].fillna(df["iso3"])
    df = compute_dataset_data_quality(df)
    return df, vintages


def compute_scores(
    df: pd.DataFrame,
    nominal_penalty_exp: float = 2.0,
    ppp_quality_floor: float = 8000.0,
    floor_strength: float = 2.0,
    tourism_cost_weight: float = 0.6,
    tourism_infra_weight: float = 0.6,
    safety_weight: float = 0.7,
    arrivals_weight: float = 0.4,
    min_stability: Optional[float] = None,
) -> pd.DataFrame:
    d = df.copy()

    d["score_base"] = np.where(
        d["gdp_nom_pc_usd"].notna() & (d["gdp_nom_pc_usd"] > 0) & d["gdp_ppp_pc_int"].notna() & (d["gdp_ppp_pc_int"] > 0),
        d["gdp_ppp_pc_int"] / (d["gdp_nom_pc_usd"] ** nominal_penalty_exp),
        np.nan
    )

    r = d["gdp_ppp_pc_int"] / ppp_quality_floor
    d["score_floor_penalty"] = np.minimum(1.0, r.clip(lower=0)).pow(floor_strength)

    tpp_log = np.log1p(d["tourism_pp_power"].clip(lower=0))
    tpp_scaled = _minmax(tpp_log)

    if "price_comp" in d.columns and d["price_comp"].notna().any():
        pc_scaled = _minmax(d["price_comp"])
        cost_component = (tpp_scaled.fillna(0) * (0.6 + 0.4 * pc_scaled.fillna(0)))
        cost_component = _minmax(cost_component)
    else:
        cost_component = tpp_scaled

    eps = 1e-6
    d["score_tourism_cost"] = (eps + cost_component).pow(tourism_cost_weight)
    d["component_ppp_advantage"] = _component_score(cost_component)

    fx_live_available = d.get("fx_lcu_per_usd_live", pd.Series(np.nan, index=d.index)).notna()
    fx_source_live = d.get("fx_source", pd.Series("", index=d.index)).astype(str).str.upper().isin(["FRANKFURTER", "LIVE_FX"])
    fx_availability = (fx_live_available | fx_source_live).astype(float)
    fx_tailwind_proxy = (0.7 * tpp_scaled.fillna(0) + 0.3 * fx_availability).clip(0, 1)
    fx_tailwind_signal = d.get("fx_tailwind_signal", pd.Series(np.nan, index=d.index))
    has_historical_fx_tailwind = fx_tailwind_signal.notna()
    d["component_fx_tailwind"] = _component_score(fx_tailwind_signal.combine_first(fx_tailwind_proxy))
    d["component_fx_tailwind_source"] = np.where(
        has_historical_fx_tailwind,
        "historical_fx",
        "model_proxy",
    )
    if "fx_tailwind_interpretation" not in d.columns:
        d["fx_tailwind_interpretation"] = "Proxy only"
    else:
        d["fx_tailwind_interpretation"] = d["fx_tailwind_interpretation"].fillna("Proxy only")

    arr_scaled = _minmax(np.log1p(d["intl_arrivals"].clip(lower=0)))
    if "touri_infra" in d.columns and d["touri_infra"].notna().any():
        ti_scaled = _minmax(d["touri_infra"])
        infra_component = (1.0 - arrivals_weight) * ti_scaled.fillna(0) + arrivals_weight * arr_scaled.fillna(0)
        infra_component = _minmax(infra_component)
    else:
        infra_component = arr_scaled
    d["score_infra"] = (eps + infra_component).pow(tourism_infra_weight)
    d["component_tourism_depth"] = _component_score(infra_component)

    wgi_scaled = ((d["wgi_political_stability"] + 2.5) / 5.0).clip(0, 1)
    if "safety" in d.columns and d["safety"].notna().any():
        saf_scaled = _minmax(d["safety"])
        safety_component = (0.6 * wgi_scaled.fillna(0) + 0.4 * saf_scaled.fillna(0)).clip(0, 1)
    else:
        safety_component = wgi_scaled
    d["score_safety"] = (eps + safety_component).pow(safety_weight)
    d["component_safety_stability"] = _component_score(safety_component)

    d["component_comfort_floor"] = _component_score(d["score_floor_penalty"])

    if min_stability is not None:
        d = d[wgi_scaled >= float(min_stability)].copy()

    d["score"] = d["score_base"] * d["score_floor_penalty"] * d["score_tourism_cost"] * d["score_infra"] * d["score_safety"]
    d = d.dropna(subset=["score"]).sort_values("score", ascending=False).reset_index(drop=True)
    mx = d["score"].max()
    d["component_overall_value"] = (100.0 * d["score"] / (mx if mx and mx > 0 else 1.0)).round(2)
    return d
