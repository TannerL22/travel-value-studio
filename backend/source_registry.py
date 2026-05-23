from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, Iterable, List, Mapping, Optional

import pandas as pd


@dataclass(frozen=True)
class SourceField:
    field_name: str
    label: str
    source: str
    indicator: Optional[str]
    frequency: str
    geographic_level: str
    field_type: str
    measures: str
    caveat: str
    recommended_confidence: str

    def to_dict(self) -> Dict[str, Optional[str]]:
        return asdict(self)


SOURCE_REGISTRY: Dict[str, SourceField] = {
    "gdp_nom_pc_usd": SourceField(
        "gdp_nom_pc_usd",
        "Nominal GDP per capita",
        "IMF WEO/DataMapper preferred; World Bank WDI fallback",
        "IMF NGDPDPC; WDI NY.GDP.PCAP.CD",
        "Annual",
        "Country",
        "observed/fallback",
        "Nominal income level in current USD.",
        "Macro income is not a tourist price measure and can lag current conditions.",
        "medium",
    ),
    "gdp_ppp_pc_int": SourceField(
        "gdp_ppp_pc_int",
        "PPP GDP per capita",
        "IMF WEO/DataMapper preferred; World Bank WDI fallback",
        "IMF PPPPC; WDI NY.GDP.PCAP.PP.CD",
        "Annual",
        "Country",
        "observed/fallback",
        "Income adjusted for broad purchasing-power differences.",
        "GDP PPP is broad-economy data, not a traveler basket.",
        "medium",
    ),
    "ppp_private_lcu_per_int": SourceField(
        "ppp_private_lcu_per_int",
        "Private-consumption PPP conversion factor",
        "World Bank WDI",
        "PA.NUS.PRVT.PP",
        "Annual",
        "Country",
        "observed/nowcast",
        "Local-currency units per international dollar for private consumption.",
        "Better than GDP PPP for consumer prices, but still not a tourist basket.",
        "medium",
    ),
    "ppp_private_is_nowcast": SourceField(
        "ppp_private_is_nowcast",
        "PPP nowcast flag",
        "Derived from WDI PPP plus IMF/WDI inflation",
        "IMF PCPIPCH; WDI FP.CPI.TOTL.ZG",
        "Annual",
        "Country",
        "nowcast",
        "Whether private-consumption PPP was inflation-adjusted to the target year.",
        "Nowcasts assume inflation differentials approximate PPP changes.",
        "low",
    ),
    "fx_lcu_per_usd": SourceField(
        "fx_lcu_per_usd",
        "FX rate, local currency per USD",
        "Live FX feed preferred; World Bank WDI fallback",
        "exchangerate.host latest; WDI PA.NUS.FCRF",
        "Daily when live; annual when WDI fallback",
        "Country/currency",
        "observed/fallback",
        "How many local-currency units one USD buys.",
        "Live FX is currency-level, while WDI fallback is annual average country data.",
        "medium",
    ),
    "fx_lcu_per_usd_live": SourceField(
        "fx_lcu_per_usd_live",
        "Live FX rate",
        "Frankfurter preferred; legacy live FX fallback",
        "Frankfurter /v1/latest?base=USD; fallback latest?base=USD",
        "Daily",
        "Currency",
        "observed",
        "Current local-currency units per USD where a currency mapping is available.",
        "A live FX move does not guarantee hotels or tourist services got cheaper.",
        "medium",
    ),
    "fx_lcu_per_usd_frankfurter": SourceField(
        "fx_lcu_per_usd_frankfurter",
        "Frankfurter live FX rate",
        "Frankfurter",
        "/v1/latest?base=USD",
        "Daily working day",
        "Currency",
        "observed",
        "Latest available Frankfurter local-currency units per USD.",
        "Institutional reference rates can differ from card/network tourist execution rates.",
        "medium",
    ),
    "fx_lcu_per_usd_live_fallback": SourceField(
        "fx_lcu_per_usd_live_fallback",
        "Legacy live FX fallback",
        "Legacy live FX endpoint",
        "latest?base=USD",
        "Daily",
        "Currency",
        "fallback",
        "Backup live local-currency units per USD when Frankfurter does not cover a currency.",
        "Endpoint availability and source methodology are less central to the app's long-term plan.",
        "low",
    ),
    "fx_lcu_per_usd_1y_ago": SourceField(
        "fx_lcu_per_usd_1y_ago",
        "FX rate one year ago",
        "Frankfurter",
        "/v1/{date}?base=USD",
        "Daily working day",
        "Currency",
        "observed",
        "Historical local-currency units per USD near one year before the latest FX date.",
        "Weekend/holiday requests resolve to Frankfurter's available reference date.",
        "medium",
    ),
    "fx_lcu_per_usd_3y_ago": SourceField(
        "fx_lcu_per_usd_3y_ago",
        "FX rate three years ago",
        "Frankfurter",
        "/v1/{date}?base=USD",
        "Daily working day",
        "Currency",
        "observed",
        "Historical local-currency units per USD near three years before the latest FX date.",
        "A single historical point is not a full currency valuation model.",
        "medium",
    ),
    "fx_tailwind_1y": SourceField(
        "fx_tailwind_1y",
        "One-year FX tailwind ratio",
        "Derived from Frankfurter",
        "fx_lcu_per_usd_live / fx_lcu_per_usd_1y_ago",
        "Per dataset build",
        "Currency",
        "derived",
        "Whether USD buys more local currency now than about one year ago.",
        "Higher ratios can still be erased by tourist-specific inflation.",
        "medium",
    ),
    "fx_tailwind_3y": SourceField(
        "fx_tailwind_3y",
        "Three-year FX tailwind ratio",
        "Derived from Frankfurter",
        "fx_lcu_per_usd_live / fx_lcu_per_usd_3y_ago",
        "Per dataset build",
        "Currency",
        "derived",
        "Whether USD buys more local currency now than about three years ago.",
        "Does not adjust for bilateral inflation or real effective exchange rates.",
        "medium",
    ),
    "fx_tailwind_recent_ratio": SourceField(
        "fx_tailwind_recent_ratio",
        "Recent FX tailwind ratio",
        "Derived from Frankfurter",
        "Mean of fx_tailwind_1y and fx_tailwind_3y",
        "Per dataset build",
        "Currency",
        "derived",
        "Average current USD buying power versus one-year and three-year reference rates.",
        "A two-point average is still a simple diagnostic, not a valuation band.",
        "medium",
    ),
    "fx_tailwind_1y_pct": SourceField(
        "fx_tailwind_1y_pct",
        "One-year FX tailwind percent",
        "Derived from Frankfurter",
        "(fx_tailwind_1y - 1) * 100",
        "Per dataset build",
        "Currency",
        "derived",
        "Percent change in local-currency units per USD versus about one year ago.",
        "Positive values mean USD buys more currency, not necessarily a cheaper trip.",
        "medium",
    ),
    "fx_tailwind_3y_pct": SourceField(
        "fx_tailwind_3y_pct",
        "Three-year FX tailwind percent",
        "Derived from Frankfurter",
        "(fx_tailwind_3y - 1) * 100",
        "Per dataset build",
        "Currency",
        "derived",
        "Percent change in local-currency units per USD versus about three years ago.",
        "Positive values can be offset by inflation or tourist-facing price increases.",
        "medium",
    ),
    "fx_tailwind_signal": SourceField(
        "fx_tailwind_signal",
        "Historical FX tailwind signal",
        "Derived from Frankfurter",
        "Mean of one-year and three-year FX tailwind ratios, scaled to 0-1",
        "Per dataset build",
        "Currency",
        "derived",
        "Short-run currency cheapness versus recent USD history.",
        "Not a BIS NEER/REER valuation signal and not a tourist price basket.",
        "medium",
    ),
    "fx_tailwind_interpretation": SourceField(
        "fx_tailwind_interpretation",
        "FX tailwind interpretation",
        "Derived",
        "Threshold labels from fx_tailwind_recent_ratio",
        "Per dataset build",
        "Country/currency",
        "derived",
        "Plain-language diagnostic for the historical FX tailwind ratio.",
        "Labels explain the FX cross only and do not validate trip affordability.",
        "medium",
    ),
    "fx_tailwind_origin_currency": SourceField(
        "fx_tailwind_origin_currency",
        "Origin currency for FX tailwind",
        "Derived from selected origin country",
        None,
        "Per ranking request",
        "Currency",
        "derived",
        "Currency used as the base for origin-aware FX Tailwind diagnostics.",
        "Origin mapping still uses one primary country currency.",
        "medium",
    ),
    "fx_tailwind_origin_1y": SourceField(
        "fx_tailwind_origin_1y",
        "Origin-adjusted one-year FX tailwind ratio",
        "Derived from USD-base FX tables",
        "(destination_current/origin_current) / (destination_1y/origin_1y)",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Whether the destination currency is cheaper versus the selected origin currency than about one year ago.",
        "Still uses Frankfurter bilateral crosses, not real effective exchange-rate data.",
        "medium",
    ),
    "fx_tailwind_origin_3y": SourceField(
        "fx_tailwind_origin_3y",
        "Origin-adjusted three-year FX tailwind ratio",
        "Derived from USD-base FX tables",
        "(destination_current/origin_current) / (destination_3y/origin_3y)",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Whether the destination currency is cheaper versus the selected origin currency than about three years ago.",
        "A single reference date is not a full currency valuation band.",
        "medium",
    ),
    "fx_tailwind_origin_recent_ratio": SourceField(
        "fx_tailwind_origin_recent_ratio",
        "Origin-adjusted recent FX tailwind ratio",
        "Derived from USD-base FX tables",
        "Mean of fx_tailwind_origin_1y and fx_tailwind_origin_3y",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Average destination-vs-origin FX tailwind across one-year and three-year references.",
        "Additive diagnostic only; current ranking score does not yet use this field.",
        "medium",
    ),
    "fx_tailwind_origin_1y_pct": SourceField(
        "fx_tailwind_origin_1y_pct",
        "Origin-adjusted one-year FX tailwind percent",
        "Derived from USD-base FX tables",
        "(fx_tailwind_origin_1y - 1) * 100",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Percent destination-vs-origin FX move versus about one year ago.",
        "Positive values mean the selected origin currency buys more destination currency than the reference date.",
        "medium",
    ),
    "fx_tailwind_origin_3y_pct": SourceField(
        "fx_tailwind_origin_3y_pct",
        "Origin-adjusted three-year FX tailwind percent",
        "Derived from USD-base FX tables",
        "(fx_tailwind_origin_3y - 1) * 100",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Percent destination-vs-origin FX move versus about three years ago.",
        "Positive values can still be offset by tourist-facing price increases.",
        "medium",
    ),
    "fx_tailwind_origin_interpretation": SourceField(
        "fx_tailwind_origin_interpretation",
        "Origin-adjusted FX interpretation",
        "Derived",
        "Threshold labels from fx_tailwind_origin_recent_ratio",
        "Per ranking request",
        "Currency pair",
        "derived",
        "Plain-language diagnostic for destination-vs-origin historical FX tailwind.",
        "Explains FX only; it does not validate actual trip cost.",
        "medium",
    ),
    "fx_tailwind_origin_source": SourceField(
        "fx_tailwind_origin_source",
        "Origin-adjusted FX source",
        "Derived",
        None,
        "Per ranking request",
        "Currency pair",
        "derived/fallback",
        "Whether origin-aware historical FX diagnostics were available.",
        "Unavailable rows retain the existing USD-based component and proxy behavior.",
        "high",
    ),
    "fx_tailwind_source": SourceField(
        "fx_tailwind_source",
        "FX tailwind source",
        "Derived",
        None,
        "Per dataset build",
        "Country/currency",
        "derived",
        "Whether historical FX tailwind was available from Frankfurter.",
        "Unavailable currencies fall back to the older proxy component.",
        "high",
    ),
    "component_fx_tailwind_source": SourceField(
        "component_fx_tailwind_source",
        "FX component source",
        "Derived",
        None,
        "Per scoring run",
        "Country/currency",
        "derived/fallback",
        "Whether FX Tailwind used origin historical FX, USD historical FX, or the model proxy.",
        "Origin historical FX is preferred, but none of these sources prove tourist-basket affordability.",
        "high",
    ),
    "fx_reference_dates_available": SourceField(
        "fx_reference_dates_available",
        "FX reference dates available",
        "Derived from Frankfurter response dates",
        "fx_frankfurter_1y_date and fx_frankfurter_3y_date",
        "Per dataset build",
        "Dataset",
        "derived",
        "Whether both one-year and three-year FX reference dates are available.",
        "A true value does not imply full historical valuation coverage.",
        "high",
    ),
    "fx_enrichment_warnings": SourceField(
        "fx_enrichment_warnings",
        "FX enrichment warnings",
        "Derived",
        None,
        "Per dataset build",
        "Dataset",
        "derived",
        "Pipe-delimited warning flags for partial FX enrichment failures.",
        "Warnings are coarse source-health signals, not row-specific data audits.",
        "high",
    ),
    "fx_frankfurter_date": SourceField(
        "fx_frankfurter_date",
        "Frankfurter latest FX date",
        "Frankfurter",
        "date",
        "Daily working day",
        "Dataset",
        "observed",
        "Latest available Frankfurter reference date used for live FX.",
        "May be the prior working day rather than the calendar date of the request.",
        "medium",
    ),
    "fx_frankfurter_1y_date": SourceField(
        "fx_frankfurter_1y_date",
        "Frankfurter one-year reference date",
        "Frankfurter",
        "date",
        "Daily working day",
        "Dataset",
        "observed",
        "Actual Frankfurter date returned for the one-year historical request.",
        "May differ slightly from exactly 365 days earlier due to weekends or holidays.",
        "medium",
    ),
    "fx_frankfurter_3y_date": SourceField(
        "fx_frankfurter_3y_date",
        "Frankfurter three-year reference date",
        "Frankfurter",
        "date",
        "Daily working day",
        "Dataset",
        "observed",
        "Actual Frankfurter date returned for the three-year historical request.",
        "A single reference date is not a full historical valuation band.",
        "medium",
    ),
    "fx_source": SourceField(
        "fx_source",
        "FX source flag",
        "Derived",
        None,
        "Per dataset build",
        "Country",
        "derived",
        "Whether the selected FX value came from live FX or WDI fallback.",
        "Source availability varies by currency and API health.",
        "high",
    ),
    "fx_live_date": SourceField(
        "fx_live_date",
        "Live FX date",
        "Frankfurter preferred; legacy live FX fallback",
        "date",
        "Daily",
        "Dataset",
        "observed",
        "Date attached to the live FX response.",
        "Only meaningful when FX source is live.",
        "medium",
    ),
    "currency": SourceField(
        "currency",
        "Currency code",
        "RestCountries",
        "cca3,currencies",
        "Occasional",
        "Country",
        "observed/fallback",
        "Primary currency code used to map country rows to FX rates.",
        "Multi-currency countries and tourist pricing in foreign currency are simplified.",
        "medium",
    ),
    "tourism_pp_power": SourceField(
        "tourism_pp_power",
        "Broad purchasing-power multiplier",
        "Derived from FX and private-consumption PPP",
        "fx_lcu_per_usd / ppp_private_lcu_per_int",
        "Per dataset build",
        "Country",
        "derived",
        "Broad local purchasing power implied by FX versus PPP.",
        "This is not an observed tourist basket and can overstate trip affordability.",
        "medium",
    ),
    "intl_arrivals": SourceField(
        "intl_arrivals",
        "International tourist arrivals",
        "World Bank WDI",
        "ST.INT.ARVL",
        "Annual",
        "Country",
        "observed",
        "Visitor volume used as a rough tourism-depth and availability proxy.",
        "Arrivals can be stale, disrupted, or concentrated in a few cities.",
        "medium",
    ),
    "wgi_political_stability": SourceField(
        "wgi_political_stability",
        "Political stability",
        "World Bank WGI via WDI",
        "PV.EST",
        "Annual",
        "Country",
        "observed",
        "Country-level political stability and violence/terrorism risk estimate.",
        "Not a complete traveler safety metric and does not capture city-level risk.",
        "medium",
    ),
    "inf": SourceField(
        "inf",
        "Inflation",
        "IMF WEO/DataMapper preferred; World Bank WDI fallback",
        "IMF PCPIPCH; WDI FP.CPI.TOTL.ZG",
        "Annual",
        "Country",
        "observed/fallback",
        "Consumer inflation used to nowcast PPP where needed.",
        "National CPI may not track tourist-facing prices.",
        "medium",
    ),
    "touri_infra": SourceField(
        "touri_infra",
        "Tourism infrastructure",
        "Optional TTDI-style local template",
        "ttdi_template.csv",
        "Irregular",
        "Country",
        "observed/fallback",
        "Tourism infrastructure comfort/depth input when provided.",
        "Currently sample/template data unless replaced with a maintained source.",
        "low",
    ),
    "safety": SourceField(
        "safety",
        "Safety score",
        "Optional TTDI-style local template",
        "ttdi_template.csv",
        "Irregular",
        "Country",
        "observed/fallback",
        "Supplemental safety input when provided.",
        "Currently sample/template data unless replaced with a maintained source.",
        "low",
    ),
    "price_comp": SourceField(
        "price_comp",
        "Price competitiveness",
        "Optional TTDI-style local template",
        "ttdi_template.csv",
        "Irregular",
        "Country",
        "observed/fallback",
        "Supplemental price competitiveness input when provided.",
        "Not an observed daily trip-cost basket.",
        "low",
    ),
}


COMPONENT_REGISTRY: Dict[str, Dict[str, str]] = {
    "component_fx_tailwind": {
        "label": "FX Tailwind",
        "current_definition": "Preferred: destination currency movement versus the selected origin currency using Frankfurter historical cross rates. Fallback: USD-based Frankfurter signal or current-model proxy.",
        "measures": "Whether the selected origin currency buys more destination currency now than recent history suggests.",
        "caveat": "FX Tailwind is not an observed tourist basket, does not adjust for tourist-facing inflation, and is not BIS NEER/REER.",
    },
    "component_ppp_advantage": {
        "label": "PPP Advantage",
        "current_definition": "Broad local price advantage from FX versus private-consumption PPP.",
        "measures": "How much broad local purchasing power a USD implies after PPP adjustment.",
        "caveat": "PPP is not a tourist basket and may miss hotels, transport, and attractions.",
    },
    "component_comfort_floor": {
        "label": "Comfort Floor",
        "current_definition": "PPP income floor penalty from the existing scoring model.",
        "measures": "Whether a country clears a rough development/comfort threshold.",
        "caveat": "Country-level macro comfort proxy, not city-level user experience.",
    },
    "component_tourism_depth": {
        "label": "Tourism Depth",
        "current_definition": "International arrivals plus optional tourism infrastructure input.",
        "measures": "Tourism market depth and likely logistics availability.",
        "caveat": "Arrivals can be stale and do not guarantee affordability or quality.",
    },
    "component_safety_stability": {
        "label": "Safety / Stability",
        "current_definition": "WGI political stability plus optional safety input.",
        "measures": "Country-level stability and safety proxy.",
        "caveat": "Does not replace traveler advisories or city/neighborhood-level risk.",
    },
    "component_overall_value": {
        "label": "Overall Value",
        "current_definition": "Normalized current model score on a 0-100 scale.",
        "measures": "Combined current-model value ranking.",
        "caveat": "Still model-derived; not an observed trip price.",
    },
}

METHODOLOGY_SUMMARY: Dict[str, Any] = {
    "thesis": "Separate cheap currencies from cheap trips.",
    "current_model_status": "Component scores expose the current model's internal signals without changing the core ranking model.",
    "known_limitations": [
        "Daily cost is currently a model estimate, not an observed tourist basket.",
        "FX Tailwind uses short historical origin-currency crosses where available, with USD and proxy fallbacks; it is not yet NEER or REER.",
        "PPP and GDP inputs are annual country-level macro series.",
        "Tourism depth and safety are country-level proxies and can miss city-level differences.",
    ],
    "component_fields": list(COMPONENT_REGISTRY.keys()),
    "data_quality_fields": [
        "data_quality_score",
        "data_quality_grade",
        "data_quality_flags",
    ],
}


def get_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    return {field: metadata.to_dict() for field, metadata in SOURCE_REGISTRY.items()}


def get_field_metadata(field_name: str) -> Optional[Dict[str, Optional[str]]]:
    metadata = SOURCE_REGISTRY.get(field_name)
    return metadata.to_dict() if metadata else None


def get_registry_for_fields(fields: Iterable[str]) -> Dict[str, Dict[str, Optional[str]]]:
    return {
        field: SOURCE_REGISTRY[field].to_dict()
        for field in fields
        if field in SOURCE_REGISTRY
    }


def get_component_registry() -> Dict[str, Dict[str, str]]:
    return dict(COMPONENT_REGISTRY)


def get_methodology_summary() -> Dict[str, Any]:
    return {
        **METHODOLOGY_SUMMARY,
        "components": get_component_registry(),
    }


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    try:
        return bool(pd.isna(value))
    except (TypeError, ValueError):
        return False


def compute_row_data_quality(row: Mapping[str, Any]) -> Dict[str, Any]:
    flags: List[str] = []

    if _is_missing(row.get("ppp_private_lcu_per_int")):
        flags.append("missing_ppp_private")
    if _is_missing(row.get("fx_lcu_per_usd")):
        flags.append("missing_fx")
    if str(row.get("fx_source", "")).upper() == "WDI":
        flags.append("fx_fallback_wdi")
    if bool(row.get("ppp_private_is_nowcast", False)):
        flags.append("ppp_nowcast")
    if _is_missing(row.get("intl_arrivals")):
        flags.append("missing_arrivals")
    if _is_missing(row.get("wgi_political_stability")):
        flags.append("missing_stability")
    if _is_missing(row.get("currency")):
        flags.append("missing_currency")
    component_fx_source = str(row.get("component_fx_tailwind_source", "")).lower()
    has_origin_historical_fx = (
        component_fx_source == "origin_historical_fx"
        or str(row.get("fx_tailwind_origin_source", "")).upper() == "HISTORICAL_CROSS"
        or not _is_missing(row.get("fx_tailwind_origin_recent_ratio"))
    )
    has_usd_historical_fx = (
        component_fx_source == "usd_historical_fx"
        or not _is_missing(row.get("fx_tailwind_signal"))
    )
    has_any_historical_fx = has_origin_historical_fx or has_usd_historical_fx

    if not has_any_historical_fx:
        flags.append("missing_historical_fx")
    if (
        component_fx_source == "model_proxy"
        or (
            not component_fx_source
            and str(row.get("fx_tailwind_source", "")).upper() == "UNAVAILABLE"
            and not has_origin_historical_fx
        )
    ):
        flags.append("fx_tailwind_proxy")

    has_reference_dates = (
        not _is_missing(row.get("fx_frankfurter_1y_date"))
        and not _is_missing(row.get("fx_frankfurter_3y_date"))
    )
    reference_dates_available = row.get("fx_reference_dates_available")
    if _is_missing(reference_dates_available):
        reference_dates_available = has_reference_dates
    if not bool(reference_dates_available) and not has_reference_dates:
        flags.append("missing_fx_reference_dates")

    penalties = {
        "missing_ppp_private": 25,
        "missing_fx": 25,
        "fx_fallback_wdi": 8,
        "ppp_nowcast": 8,
        "missing_arrivals": 10,
        "missing_stability": 15,
        "missing_currency": 8,
        "missing_historical_fx": 6,
        "fx_tailwind_proxy": 4,
        "missing_fx_reference_dates": 4,
    }
    score = max(0, 100 - sum(penalties[flag] for flag in flags))

    if score >= 85:
        grade = "A"
    elif score >= 70:
        grade = "B"
    elif score >= 50:
        grade = "C"
    else:
        grade = "D"

    return {
        "data_quality_score": int(score),
        "data_quality_grade": grade,
        "data_quality_flags": flags,
    }


def compute_dataset_data_quality(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    quality = out.apply(lambda row: compute_row_data_quality(row), axis=1)
    out["data_quality_score"] = quality.map(lambda item: item["data_quality_score"])
    out["data_quality_grade"] = quality.map(lambda item: item["data_quality_grade"])
    out["data_quality_flags"] = quality.map(lambda item: item["data_quality_flags"])
    return out
