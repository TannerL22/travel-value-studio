from __future__ import annotations

from typing import Dict, Optional

from source_registry import get_source_registry


def _field(
    field_name: str,
    label: str,
    measures: str,
    caveat: str,
    indicator: Optional[str] = None,
    field_type: str = "derived",
) -> Dict[str, Optional[str]]:
    return {
        "field_name": field_name,
        "label": label,
        "source": "Frankfurter v2 /rates (blended official/reference providers)" if "fx_opportunity" in field_name else "Derived",
        "indicator": indicator,
        "frequency": "Daily working day / per ranking request",
        "geographic_level": "Currency pair",
        "field_type": field_type,
        "measures": measures,
        "caveat": caveat,
        "recommended_confidence": "medium",
    }


def get_phase2_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_source_registry()
    registry.update(
        {
            "fx_opportunity": _field(
                "fx_opportunity",
                "FX Opportunity",
                "0-100 bilateral timing score combining 1W, 1M, 3M, 1Y and 3Y destination-vs-origin FX moves.",
                "Historical timing signal only; not a forecast, real exchange-rate valuation model, or local-price basket.",
                "Weighted tanh-normalized bilateral log returns",
            ),
            "fx_opportunity_signal": _field(
                "fx_opportunity_signal",
                "FX Opportunity signal",
                "Underlying -1 to +1 weighted bilateral FX timing signal.",
                "Sensitivity scales and horizon weights are model parameters rather than observed economic facts.",
                "1W/1M/3M/1Y/3Y weighted signal",
            ),
            "fx_opportunity_multiplier": _field(
                "fx_opportunity_multiplier",
                "FX ranking multiplier",
                "Bounded multiplier applied to the structural production score after the base ranking is calculated.",
                "Capped at a maximum +/-15% effect by default so FX timing cannot dominate structural value.",
                "1 + max_effect * signal * coverage confidence",
            ),
            "fx_opportunity_coverage": _field(
                "fx_opportunity_coverage",
                "FX history coverage",
                "Share of configured horizon weight supported by usable bilateral historical data.",
                "Coverage is about the configured horizons, not a general statement about data quality for the currency.",
                "Sum of available horizon weights",
            ),
            "fx_opportunity_source": _field(
                "fx_opportunity_source",
                "FX Opportunity source",
                "Whether the row uses Frankfurter v2 bilateral history, the legacy historical fallback, or no timing signal.",
                "Provider coverage differs by currency and historical period.",
                field_type="derived/fallback",
            ),
            "fx_opportunity_latest_date": _field(
                "fx_opportunity_latest_date",
                "Latest FX reference date",
                "Latest Frankfurter v2 reference date used by the Phase 2 timing engine.",
                "Reference rates are generally daily working-day rates, not executable intraday quotes.",
                "Frankfurter v2 row date",
                field_type="observed",
            ),
        }
    )

    for horizon, label in [("1w", "1-week"), ("1m", "1-month"), ("3m", "3-month"), ("1y", "1-year"), ("3y", "3-year")]:
        registry[f"fx_opportunity_{horizon}_pct"] = _field(
            f"fx_opportunity_{horizon}_pct",
            f"FX move vs {label} reference",
            f"Percent change in how much destination currency one unit of the selected origin currency buys versus the {label} reference date.",
            "Positive FX movement can be partly or fully offset by local inflation and destination-specific price changes.",
            f"(current bilateral cross / {horizon} bilateral cross - 1) * 100",
        )
        registry[f"fx_opportunity_{horizon}_date"] = _field(
            f"fx_opportunity_{horizon}_date",
            f"{label.title()} FX reference date",
            f"Actual historical reference date used for the {label} comparison.",
            "Weekend/holiday targets may resolve to an earlier available working day.",
            "Frankfurter v2 date",
            field_type="observed",
        )

    return registry
