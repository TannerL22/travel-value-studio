from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from data_sources import (  # noqa: E402
    add_origin_fx_tailwind_diagnostics,
    build_dataset,
    compute_scores,
    promote_origin_fx_tailwind_component,
    resolve_origin_context,
)


VALIDATION_DIR = Path(__file__).resolve().parent
SCENARIOS_PATH = VALIDATION_DIR / "japan_taiwan_sensitivity_scenarios.csv"
FX_NORMALIZED_PATH = (
    VALIDATION_DIR / "japan_taiwan_official_comparison_fx_normalized.csv"
)
RESULTS_PATH = VALIDATION_DIR / "japan_taiwan_sensitivity_results.csv"
SUMMARY_PATH = VALIDATION_DIR / "japan_taiwan_sensitivity_summary.csv"

ORIGIN_ISO3 = "GBR"
TARGET_ISO3 = ["JPN", "TWN"]
DEFAULT_YEAR = 2025


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes"}


def _round(value: Any, digits: int = 4) -> Any:
    try:
        if pd.isna(value):
            return ""
        return round(float(value), digits)
    except (TypeError, ValueError):
        return value


def load_scenarios(path: Path = SCENARIOS_PATH) -> pd.DataFrame:
    return pd.read_csv(path, keep_default_na=False)


def get_official_spend_day_gbp(path: Path = FX_NORMALIZED_PATH) -> Dict[str, float]:
    df = pd.read_csv(path, keep_default_na=False)
    row = df[df["metric"] == "total_spend_per_day"].iloc[0]
    return {
        "JPN": float(row["japan_value_gbp"]),
        "TWN": float(row["taiwan_value_gbp"]),
    }


def apply_diagnostic_adjustments(row: pd.Series, scenario: pd.Series) -> Dict[str, Any]:
    ppp_weight = _as_float(scenario.get("ppp_advantage_adjustment"), 1.0)
    fx_weight = _as_float(scenario.get("fx_component_adjustment"), 0.0)
    tourism_weight = _as_float(scenario.get("tourism_depth_adjustment"), 1.0)

    score_tourism_cost = _as_float(row.get("score_tourism_cost"), 1.0)
    score_infra = _as_float(row.get("score_infra"), 1.0)
    component_fx = _as_float(row.get("component_fx_tailwind"), 50.0)

    ppp_adjusted = 1.0 + ppp_weight * (score_tourism_cost - 1.0)
    tourism_adjusted = 1.0 + tourism_weight * (score_infra - 1.0)

    ppp_factor = ppp_adjusted / score_tourism_cost if score_tourism_cost > 0 else 1.0
    tourism_factor = tourism_adjusted / score_infra if score_infra > 0 else 1.0
    fx_factor = max(0.05, 1.0 + fx_weight * ((component_fx - 50.0) / 100.0))

    proxy_factor = 1.0
    proxy_cost_factor = 1.0
    proxy_flags = []
    is_proxy_row = (
        _as_bool(row.get("supplemental_model_row"))
        or _as_bool(row.get("ppp_private_is_gdp_proxy"))
        or str(row.get("component_fx_tailwind_source", "")).strip() == "model_proxy"
    )
    if scenario.get("scenario_id") == "conservative_taiwan_proxy_penalty" and is_proxy_row:
        proxy_factor = 0.75
        proxy_cost_factor = 1.20
        proxy_flags.append("supplemental/proxy penalty")

    total_score_factor = ppp_factor * tourism_factor * fx_factor * proxy_factor
    adjusted_score = _as_float(row.get("Score")) * total_score_factor
    adjusted_cost = (
        _as_float(row.get("est_daily_cost"))
        / max(ppp_factor * tourism_factor * fx_factor, 0.05)
        * proxy_cost_factor
    )

    notes = [
        f"ppp_factor={ppp_factor:.4f}",
        f"fx_factor={fx_factor:.4f}",
        f"tourism_factor={tourism_factor:.4f}",
    ]
    if proxy_flags:
        notes.extend(proxy_flags)

    return {
        "diagnostic_adjusted_score": adjusted_score,
        "diagnostic_adjusted_est_daily_cost": adjusted_cost,
        "diagnostic_adjustment_notes": "; ".join(notes),
    }


def run_scenario(df_raw: pd.DataFrame, scenario: pd.Series) -> pd.DataFrame:
    origin_context = resolve_origin_context(df_raw, ORIGIN_ISO3)
    budget_sens = _as_float(scenario["budget_sens"])
    comfort = _as_float(scenario["comfort"])
    supply_need = _as_float(scenario["supply_need"])
    risk_pri = _as_float(scenario["risk_pri"])
    scarcity_k = _as_float(scenario["scarcity_k"])

    alpha = 1.0 + 2.2 * budget_sens
    ppp_floor = 3000 + 17000 * comfort
    floor_strength = 1.0 + 2.0 * comfort
    tourism_infra_weight = 0.1 + 1.2 * supply_need
    arrivals_weight = 0.2 + 0.6 * supply_need
    safety_weight = 0.1 + 1.3 * risk_pri
    tourism_cost_weight = float(
        np.clip(0.2 + 0.9 * budget_sens + 0.2 * comfort, 0.0, 1.5)
    )

    scored = compute_scores(
        df_raw,
        nominal_penalty_exp=float(alpha),
        ppp_quality_floor=float(ppp_floor),
        floor_strength=float(floor_strength),
        tourism_cost_weight=float(tourism_cost_weight),
        tourism_infra_weight=float(tourism_infra_weight),
        safety_weight=float(safety_weight),
        arrivals_weight=float(arrivals_weight),
        min_stability=None,
    )
    origin_currency = origin_context["origin_currency"]
    origin_pp = float(origin_context["origin_pp_multiplier"])
    scored = add_origin_fx_tailwind_diagnostics(scored, origin_currency)
    scored = promote_origin_fx_tailwind_component(scored)
    scored["value_multiplier_relative"] = scored["tourism_pp_power"] / origin_pp

    arr_scaled = np.log1p(scored["intl_arrivals"].fillna(0).clip(lower=0))
    arr_scaled = (arr_scaled - arr_scaled.min()) / (
        arr_scaled.max() - arr_scaled.min() + 1e-9
    )
    availability = arr_scaled.clip(0, 1)
    scored["scarcity_mult"] = 1.0 + scarcity_k * (1.0 - availability) * supply_need
    scored["est_daily_cost"] = (
        180.0
        / scored["value_multiplier_relative"].replace([np.inf, -np.inf], np.nan)
    ) * scored["scarcity_mult"]
    scored["rank"] = np.arange(1, len(scored) + 1)
    scored["Score"] = scored["component_overall_value"]

    official_gbp = get_official_spend_day_gbp()
    rows: List[Dict[str, Any]] = []
    for iso3 in TARGET_ISO3:
        row = scored[scored["iso3"] == iso3].iloc[0]
        adjustments = apply_diagnostic_adjustments(row, scenario)
        rows.append(
            {
                "scenario_id": scenario["scenario_id"],
                "scenario_label": scenario["scenario_label"],
                "origin_iso3": origin_context["origin_used"],
                "origin_currency": origin_currency,
                "destination_iso3": row["iso3"],
                "destination_country": row["country"],
                "model_rank": int(row["rank"]),
                "model_score": _round(row["Score"], 4),
                "model_est_daily_cost_origin_currency": _round(row["est_daily_cost"], 4),
                "model_value_multiplier_relative": _round(
                    row["value_multiplier_relative"], 4
                ),
                "component_fx_tailwind": _round(row["component_fx_tailwind"], 4),
                "component_fx_tailwind_source": row["component_fx_tailwind_source"],
                "component_ppp_advantage": _round(row["component_ppp_advantage"], 4),
                "component_comfort_floor": _round(row["component_comfort_floor"], 4),
                "component_tourism_depth": _round(row["component_tourism_depth"], 4),
                "component_safety_stability": _round(
                    row["component_safety_stability"], 4
                ),
                "tourism_pp_power": _round(row["tourism_pp_power"], 4),
                "score_tourism_cost": _round(row["score_tourism_cost"], 4),
                "score_infra": _round(row["score_infra"], 4),
                "score_safety": _round(row["score_safety"], 4),
                "data_quality_score": _round(row.get("data_quality_score"), 4),
                "data_quality_grade": row.get("data_quality_grade", ""),
                "data_quality_flags": row.get("data_quality_flags", ""),
                "diagnostic_adjusted_score": _round(
                    adjustments["diagnostic_adjusted_score"], 4
                ),
                "diagnostic_adjusted_est_daily_cost": _round(
                    adjustments["diagnostic_adjusted_est_daily_cost"], 4
                ),
                "diagnostic_adjustment_notes": adjustments[
                    "diagnostic_adjustment_notes"
                ],
                "notes": scenario.get("notes", ""),
            }
        )
    return pd.DataFrame(rows)


def summarize_results(results: pd.DataFrame) -> pd.DataFrame:
    official_pref = "official_spend_day_favours_japan"
    rows = []
    for scenario_id, group in results.groupby("scenario_id", sort=False):
        japan = group[group["destination_iso3"] == "JPN"].iloc[0]
        taiwan = group[group["destination_iso3"] == "TWN"].iloc[0]
        japan_cost = float(japan["model_est_daily_cost_origin_currency"])
        taiwan_cost = float(taiwan["model_est_daily_cost_origin_currency"])
        japan_adjusted_cost = float(japan["diagnostic_adjusted_est_daily_cost"])
        taiwan_adjusted_cost = float(taiwan["diagnostic_adjusted_est_daily_cost"])
        japan_score = float(japan["diagnostic_adjusted_score"])
        taiwan_score = float(taiwan["diagnostic_adjusted_score"])

        if taiwan_score > japan_score:
            model_preference = "favours_taiwan"
        elif japan_score > taiwan_score:
            model_preference = "favours_japan"
        else:
            model_preference = "tie"

        cost_gap = taiwan_cost - japan_cost
        mismatch_persists = model_preference == "favours_taiwan"
        if mismatch_persists:
            interpretation = (
                "Model diagnostic preference still conflicts with official spend/day."
            )
        else:
            interpretation = (
                "Diagnostic adjustment reverses or neutralizes the model preference."
            )

        rows.append(
            {
                "scenario_id": scenario_id,
                "scenario_label": japan["scenario_label"],
                "japan_model_est_daily_cost_gbp": _round(japan_cost, 4),
                "taiwan_model_est_daily_cost_gbp": _round(taiwan_cost, 4),
                "taiwan_minus_japan_model_cost_gbp": _round(cost_gap, 4),
                "japan_diagnostic_adjusted_cost_gbp": _round(japan_adjusted_cost, 4),
                "taiwan_diagnostic_adjusted_cost_gbp": _round(taiwan_adjusted_cost, 4),
                "taiwan_minus_japan_adjusted_cost_gbp": _round(
                    taiwan_adjusted_cost - japan_adjusted_cost, 4
                ),
                "japan_diagnostic_adjusted_score": _round(japan_score, 4),
                "taiwan_diagnostic_adjusted_score": _round(taiwan_score, 4),
                "model_preference": model_preference,
                "official_spend_day_preference": official_pref,
                "mismatch_persists": str(mismatch_persists),
                "interpretation": interpretation,
            }
        )
    return pd.DataFrame(rows)


def run_sensitivity() -> tuple[pd.DataFrame, pd.DataFrame]:
    scenarios = load_scenarios()
    df_raw, _ = build_dataset(target_year=DEFAULT_YEAR, use_live_fx=True)
    results = pd.concat(
        [run_scenario(df_raw, scenario) for _, scenario in scenarios.iterrows()],
        ignore_index=True,
    )
    summary = summarize_results(results)
    results.to_csv(RESULTS_PATH, index=False)
    summary.to_csv(SUMMARY_PATH, index=False)
    return results, summary


def main() -> None:
    results, summary = run_sensitivity()
    print(
        "Japan/Taiwan sensitivity complete "
        f"({len(results)} result rows, {len(summary)} summary rows)."
    )


if __name__ == "__main__":
    main()
