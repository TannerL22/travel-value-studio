from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
import math
import os
import threading
import time
from typing import Dict, Iterable, Optional, Tuple

import numpy as np
import pandas as pd
import requests

FRANKFURTER_V2_RATES = "https://api.frankfurter.dev/v2/rates"
FX_CACHE_TTL_SECONDS = int(os.getenv("FX_OPPORTUNITY_CACHE_TTL_SECONDS", "3600"))
FX_MAX_RANKING_EFFECT = float(os.getenv("FX_OPPORTUNITY_MAX_EFFECT", "0.15"))


@dataclass(frozen=True)
class HorizonSpec:
    days: int
    weight: float
    log_scale: float


# Short horizons catch sudden travel opportunities; longer horizons keep the
# signal anchored to a more meaningful recent-history reference point.
HORIZONS: Dict[str, HorizonSpec] = {
    "1w": HorizonSpec(days=7, weight=0.15, log_scale=0.04),
    "1m": HorizonSpec(days=30, weight=0.25, log_scale=0.07),
    "3m": HorizonSpec(days=91, weight=0.25, log_scale=0.10),
    "1y": HorizonSpec(days=365, weight=0.20, log_scale=0.15),
    "3y": HorizonSpec(days=365 * 3, weight=0.15, log_scale=0.25),
}

_CACHE_LOCK = threading.Lock()
_CACHE: Dict[str, object] = {"built_at": 0.0, "history": None}


def _get_json(params: Optional[dict] = None, timeout: int = 30):
    response = requests.get(FRANKFURTER_V2_RATES, params=params or {}, timeout=timeout)
    response.raise_for_status()
    return response.json()


def _parse_v2_rows(payload: object) -> Tuple[Dict[str, float], Optional[str]]:
    """Parse Frankfurter v2 /rates rows into USD-base rates and an observed date."""
    rates: Dict[str, float] = {"USD": 1.0}
    dates = []
    if not isinstance(payload, list):
        return rates, None

    for row in payload:
        if not isinstance(row, dict):
            continue
        quote = str(row.get("quote") or "").upper()
        try:
            rate = float(row.get("rate"))
        except (TypeError, ValueError):
            continue
        if quote and np.isfinite(rate) and rate > 0:
            rates[quote] = rate
        observed_date = row.get("date")
        if isinstance(observed_date, str) and observed_date:
            dates.append(observed_date)

    return rates, max(dates) if dates else None


def fetch_frankfurter_v2_rates_usd(on_date: Optional[str] = None) -> Tuple[Dict[str, float], Optional[str]]:
    params = {"base": "usd"}
    if on_date:
        params["date"] = on_date
    return _parse_v2_rows(_get_json(params=params))


def _fetch_snapshot_on_or_before(target: date, max_lookback_days: int = 7) -> Tuple[Dict[str, float], Optional[str]]:
    """Resolve weekends/holidays by walking backward to an available reference date."""
    last_error: Optional[Exception] = None
    for offset in range(max_lookback_days + 1):
        candidate = target - timedelta(days=offset)
        try:
            rates, observed_date = fetch_frankfurter_v2_rates_usd(candidate.isoformat())
            if len(rates) > 1 and observed_date:
                return rates, observed_date
        except Exception as exc:  # network/source fallback is handled by caller
            last_error = exc
    if last_error:
        raise last_error
    return {"USD": 1.0}, None


def fetch_fx_opportunity_history(force_refresh: bool = False) -> Dict[str, object]:
    now = time.time()
    with _CACHE_LOCK:
        cached_history = _CACHE.get("history")
        age = now - float(_CACHE.get("built_at") or 0.0)
        if cached_history is not None and not force_refresh and age <= FX_CACHE_TTL_SECONDS:
            return dict(cached_history)  # shallow copy protects cache metadata

    latest_rates, latest_date = fetch_frankfurter_v2_rates_usd()
    if not latest_date or len(latest_rates) <= 1:
        raise RuntimeError("Frankfurter v2 latest FX data unavailable")

    latest_day = datetime.fromisoformat(latest_date).date()
    snapshots: Dict[str, Dict[str, float]] = {}
    reference_dates: Dict[str, Optional[str]] = {}
    warnings = []

    for horizon, spec in HORIZONS.items():
        try:
            rates, observed_date = _fetch_snapshot_on_or_before(latest_day - timedelta(days=spec.days))
        except Exception:
            rates, observed_date = {"USD": 1.0}, None
            warnings.append(f"frankfurter_v2_{horizon}_failed")
        snapshots[horizon] = rates
        reference_dates[horizon] = observed_date

    history: Dict[str, object] = {
        "latest_rates": latest_rates,
        "latest_date": latest_date,
        "snapshots": snapshots,
        "reference_dates": reference_dates,
        "warnings": warnings,
        "cache_built_at": now,
    }
    with _CACHE_LOCK:
        _CACHE["built_at"] = now
        _CACHE["history"] = history
    return dict(history)


def _positive(value: object) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(number) or number <= 0:
        return None
    return number


def cross_rate(rates_lcu_per_usd: Dict[str, float], destination_currency: str, origin_currency: str) -> Optional[float]:
    destination = _positive(rates_lcu_per_usd.get(destination_currency.upper()))
    origin = _positive(rates_lcu_per_usd.get(origin_currency.upper()))
    if destination is None or origin is None:
        return None
    return destination / origin


def cross_tailwind_ratio(
    current_rates_lcu_per_usd: Dict[str, float],
    historical_rates_lcu_per_usd: Dict[str, float],
    destination_currency: str,
    origin_currency: str,
) -> Optional[float]:
    current = cross_rate(current_rates_lcu_per_usd, destination_currency, origin_currency)
    historical = cross_rate(historical_rates_lcu_per_usd, destination_currency, origin_currency)
    if current is None or historical is None:
        return None
    return current / historical


def horizon_signal(ratio: Optional[float], log_scale: float) -> Optional[float]:
    """Map a bilateral FX move to [-1, 1] with symmetric log-return saturation."""
    if ratio is None or ratio <= 0:
        return None
    return float(math.tanh(math.log(ratio) / log_scale))


def combine_horizon_signals(ratios: Dict[str, Optional[float]]) -> Tuple[Optional[float], float]:
    weighted_sum = 0.0
    available_weight = 0.0
    for horizon, spec in HORIZONS.items():
        signal = horizon_signal(ratios.get(horizon), spec.log_scale)
        if signal is None:
            continue
        weighted_sum += spec.weight * signal
        available_weight += spec.weight
    if available_weight <= 0:
        return None, 0.0
    return weighted_sum / available_weight, available_weight


def _interpret(signal: Optional[float], origin_currency: Optional[str]) -> str:
    base = origin_currency or "Origin currency"
    if signal is None:
        return "FX opportunity unavailable"
    if signal >= 0.55:
        return f"Strong {base} tailwind versus recent FX history"
    if signal >= 0.15:
        return f"Modest {base} tailwind versus recent FX history"
    if signal > -0.15:
        return "Near recent bilateral FX history"
    if signal > -0.55:
        return f"Modest {base} headwind versus recent FX history"
    return f"Strong {base} headwind versus recent FX history"


def _legacy_fallback_signal(row: pd.Series) -> Optional[float]:
    source = str(row.get("component_fx_tailwind_source") or "").lower()
    if source not in {"origin_historical_fx", "usd_historical_fx"}:
        return None
    component = row.get("component_fx_tailwind")
    try:
        value = float(component)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(value):
        return None
    return float(np.clip((value - 50.0) / 50.0, -1.0, 1.0))


def add_fx_opportunity_v2(df: pd.DataFrame, origin_currency: Optional[str]) -> pd.DataFrame:
    """Add five-horizon bilateral FX opportunity diagnostics and ranking multiplier."""
    out = df.copy()
    for horizon in HORIZONS:
        out[f"fx_opportunity_{horizon}_ratio"] = np.nan
        out[f"fx_opportunity_{horizon}_pct"] = np.nan
        out[f"fx_opportunity_{horizon}_date"] = None

    out["fx_opportunity_signal"] = np.nan  # -1..1 timing signal
    out["fx_opportunity"] = np.nan  # 0..100 user-facing component
    out["fx_opportunity_multiplier"] = 1.0
    out["fx_opportunity_coverage"] = 0.0
    out["fx_opportunity_source"] = "unavailable"
    out["fx_opportunity_interpretation"] = "FX opportunity unavailable"
    out["fx_opportunity_latest_date"] = None
    out["fx_opportunity_warnings"] = ""

    history: Optional[Dict[str, object]] = None
    source_error = ""
    if origin_currency:
        try:
            history = fetch_fx_opportunity_history()
        except Exception as exc:
            source_error = type(exc).__name__

    latest_rates = history.get("latest_rates", {}) if history else {}
    snapshots = history.get("snapshots", {}) if history else {}
    reference_dates = history.get("reference_dates", {}) if history else {}

    for idx, row in out.iterrows():
        destination_currency = row.get("currency")
        ratios: Dict[str, Optional[float]] = {h: None for h in HORIZONS}
        signal: Optional[float] = None
        coverage = 0.0
        source = "unavailable"

        if origin_currency and pd.notna(destination_currency) and history:
            for horizon in HORIZONS:
                ratio = cross_tailwind_ratio(
                    latest_rates,
                    snapshots.get(horizon, {}),
                    str(destination_currency),
                    str(origin_currency),
                )
                ratios[horizon] = ratio
                if ratio is not None:
                    out.at[idx, f"fx_opportunity_{horizon}_ratio"] = ratio
                    out.at[idx, f"fx_opportunity_{horizon}_pct"] = (ratio - 1.0) * 100.0
                out.at[idx, f"fx_opportunity_{horizon}_date"] = reference_dates.get(horizon)

            signal, coverage = combine_horizon_signals(ratios)
            if signal is not None:
                source = "frankfurter_v2_origin_cross"

        if signal is None:
            signal = _legacy_fallback_signal(row)
            if signal is not None:
                coverage = 0.40
                source = "legacy_historical_fx"

        if signal is not None:
            # Incomplete history still moves ranking, but with reduced amplitude.
            confidence_scale = 0.5 + 0.5 * float(np.clip(coverage, 0.0, 1.0))
            multiplier = 1.0 + FX_MAX_RANKING_EFFECT * signal * confidence_scale
            out.at[idx, "fx_opportunity_signal"] = signal
            out.at[idx, "fx_opportunity"] = round(50.0 + 50.0 * signal, 2)
            out.at[idx, "fx_opportunity_multiplier"] = float(multiplier)
            out.at[idx, "fx_opportunity_coverage"] = float(coverage)
            out.at[idx, "fx_opportunity_source"] = source
            out.at[idx, "fx_opportunity_interpretation"] = _interpret(signal, origin_currency)

    if history:
        out["fx_opportunity_latest_date"] = history.get("latest_date")
        warnings = history.get("warnings", [])
        out["fx_opportunity_warnings"] = "|".join(str(w) for w in warnings)
    elif source_error:
        out["fx_opportunity_warnings"] = f"frankfurter_v2_failed:{source_error}"

    # Preserve the familiar component field, but make its provenance explicit.
    has_v2 = out["fx_opportunity"].notna()
    out["component_fx_tailwind"] = out["fx_opportunity"].combine_first(
        out.get("component_fx_tailwind", pd.Series(np.nan, index=out.index))
    )
    out["component_fx_tailwind_source"] = np.where(
        has_v2,
        out["fx_opportunity_source"],
        out.get("component_fx_tailwind_source", pd.Series("model_proxy", index=out.index)),
    )
    return out


def apply_fx_opportunity_to_ranking(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the bounded timing signal to production ranking and re-normalize score."""
    out = df.copy()
    if "score" not in out.columns:
        return out

    out["score_pre_fx_opportunity"] = out["score"]
    multiplier = pd.to_numeric(
        out.get("fx_opportunity_multiplier", pd.Series(1.0, index=out.index)),
        errors="coerce",
    ).fillna(1.0).clip(1.0 - FX_MAX_RANKING_EFFECT, 1.0 + FX_MAX_RANKING_EFFECT)
    out["score"] = out["score_pre_fx_opportunity"] * multiplier
    out = out.sort_values("score", ascending=False).reset_index(drop=True)
    maximum = out["score"].max()
    out["component_overall_value"] = (
        100.0 * out["score"] / (maximum if pd.notna(maximum) and maximum > 0 else 1.0)
    ).round(2)
    return out
