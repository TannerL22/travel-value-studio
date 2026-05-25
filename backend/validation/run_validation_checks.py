from __future__ import annotations

import os
from pathlib import Path

from validation_schema import (
    validate_basket_template,
    validate_japan_official_length_of_stay,
    validate_japan_official_visitor_spend,
    validate_japan_official_visitor_spend_per_day,
    validate_japan_official_visitor_spend_summary,
    validate_japan_taiwan_model_driver_delta,
    validate_japan_taiwan_model_driver_diagnostics,
    validate_japan_taiwan_model_validation_template,
    validate_japan_taiwan_official_comparison_fx_normalized,
    validate_japan_taiwan_official_comparison_summary,
    validate_japan_taiwan_official_comparison_usd,
    validate_japan_taiwan_sensitivity_results,
    validate_japan_taiwan_sensitivity_scenarios,
    validate_japan_taiwan_sensitivity_summary,
    validate_source_register,
    validate_taiwan_official_length_of_stay,
    validate_taiwan_official_visitor_spend,
    validate_taiwan_official_visitor_spend_per_day,
    validate_taiwan_official_visitor_spend_summary,
    validate_validation_fx_rates,
)


VALIDATION_DIR = Path(__file__).resolve().parent
BASKET_TEMPLATE = VALIDATION_DIR / "japan_taiwan_basket_template.csv"
SOURCE_REGISTER = VALIDATION_DIR / "japan_taiwan_source_register.csv"
JAPAN_OFFICIAL_VISITOR_SPEND = VALIDATION_DIR / "japan_official_visitor_spend.csv"
JAPAN_OFFICIAL_LENGTH_OF_STAY = VALIDATION_DIR / "japan_official_length_of_stay.csv"
JAPAN_OFFICIAL_VISITOR_SPEND_PER_DAY = (
    VALIDATION_DIR / "japan_official_visitor_spend_per_day.csv"
)
JAPAN_OFFICIAL_VISITOR_SPEND_SUMMARY = (
    VALIDATION_DIR / "japan_official_visitor_spend_summary.csv"
)
TAIWAN_OFFICIAL_VISITOR_SPEND = VALIDATION_DIR / "taiwan_official_visitor_spend.csv"
TAIWAN_OFFICIAL_LENGTH_OF_STAY = VALIDATION_DIR / "taiwan_official_length_of_stay.csv"
TAIWAN_OFFICIAL_VISITOR_SPEND_PER_DAY = (
    VALIDATION_DIR / "taiwan_official_visitor_spend_per_day.csv"
)
TAIWAN_OFFICIAL_VISITOR_SPEND_SUMMARY = (
    VALIDATION_DIR / "taiwan_official_visitor_spend_summary.csv"
)
JAPAN_TAIWAN_OFFICIAL_COMPARISON_SUMMARY = (
    VALIDATION_DIR / "japan_taiwan_official_comparison_summary.csv"
)
JAPAN_TAIWAN_OFFICIAL_COMPARISON_USD = (
    VALIDATION_DIR / "japan_taiwan_official_comparison_usd.csv"
)
VALIDATION_FX_RATES = VALIDATION_DIR / "validation_fx_rates.csv"
JAPAN_TAIWAN_OFFICIAL_COMPARISON_FX_NORMALIZED = (
    VALIDATION_DIR / "japan_taiwan_official_comparison_fx_normalized.csv"
)
JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE = (
    VALIDATION_DIR / "japan_taiwan_model_validation_template.csv"
)
JAPAN_TAIWAN_MODEL_DRIVER_DIAGNOSTICS = (
    VALIDATION_DIR / "japan_taiwan_model_driver_diagnostics.csv"
)
JAPAN_TAIWAN_MODEL_DRIVER_DELTA = (
    VALIDATION_DIR / "japan_taiwan_model_driver_delta.csv"
)
JAPAN_TAIWAN_SENSITIVITY_SCENARIOS = (
    VALIDATION_DIR / "japan_taiwan_sensitivity_scenarios.csv"
)
JAPAN_TAIWAN_SENSITIVITY_RESULTS = (
    VALIDATION_DIR / "japan_taiwan_sensitivity_results.csv"
)
JAPAN_TAIWAN_SENSITIVITY_SUMMARY = (
    VALIDATION_DIR / "japan_taiwan_sensitivity_summary.csv"
)


def main() -> None:
    basket = validate_basket_template(BASKET_TEMPLATE)
    sources = validate_source_register(SOURCE_REGISTER)

    if JAPAN_OFFICIAL_VISITOR_SPEND.exists():
        japan_spend = validate_japan_official_visitor_spend(
            JAPAN_OFFICIAL_VISITOR_SPEND
        )
        spend_message = f", {len(japan_spend)} Japan official spend rows"
    else:
        spend_message = ", Japan official spend dataset not yet populated"

    if JAPAN_OFFICIAL_LENGTH_OF_STAY.exists():
        length_of_stay = validate_japan_official_length_of_stay(
            JAPAN_OFFICIAL_LENGTH_OF_STAY
        )
        length_message = f", {len(length_of_stay)} Japan length-of-stay rows"
    else:
        length_message = ", Japan length-of-stay dataset not yet populated"

    if JAPAN_OFFICIAL_VISITOR_SPEND_PER_DAY.exists():
        per_day = validate_japan_official_visitor_spend_per_day(
            JAPAN_OFFICIAL_VISITOR_SPEND_PER_DAY
        )
        per_day_message = f", {len(per_day)} Japan per-day spend rows"
    else:
        per_day_message = ", Japan per-day spend dataset not yet populated"

    if JAPAN_OFFICIAL_VISITOR_SPEND_SUMMARY.exists():
        summary = validate_japan_official_visitor_spend_summary(
            JAPAN_OFFICIAL_VISITOR_SPEND_SUMMARY
        )
        summary_message = f", {len(summary)} Japan spend summary rows"
    else:
        summary_message = ", Japan spend summary not yet populated"

    if TAIWAN_OFFICIAL_VISITOR_SPEND.exists():
        taiwan_spend = validate_taiwan_official_visitor_spend(
            TAIWAN_OFFICIAL_VISITOR_SPEND
        )
        taiwan_spend_message = f", {len(taiwan_spend)} Taiwan official spend rows"
    else:
        taiwan_spend_message = ", Taiwan official spend dataset not yet populated"

    if TAIWAN_OFFICIAL_LENGTH_OF_STAY.exists():
        taiwan_length = validate_taiwan_official_length_of_stay(
            TAIWAN_OFFICIAL_LENGTH_OF_STAY
        )
        taiwan_length_message = f", {len(taiwan_length)} Taiwan length-of-stay rows"
    else:
        taiwan_length_message = ", Taiwan length-of-stay dataset not yet populated"

    if TAIWAN_OFFICIAL_VISITOR_SPEND_PER_DAY.exists():
        taiwan_per_day = validate_taiwan_official_visitor_spend_per_day(
            TAIWAN_OFFICIAL_VISITOR_SPEND_PER_DAY
        )
        taiwan_per_day_message = f", {len(taiwan_per_day)} Taiwan per-day spend rows"
    else:
        taiwan_per_day_message = ", Taiwan per-day spend dataset not yet populated"

    if TAIWAN_OFFICIAL_VISITOR_SPEND_SUMMARY.exists():
        taiwan_summary = validate_taiwan_official_visitor_spend_summary(
            TAIWAN_OFFICIAL_VISITOR_SPEND_SUMMARY
        )
        taiwan_summary_message = f", {len(taiwan_summary)} Taiwan spend summary rows"
    else:
        taiwan_summary_message = ", Taiwan spend summary not yet populated"

    if JAPAN_TAIWAN_OFFICIAL_COMPARISON_SUMMARY.exists():
        comparison_summary = validate_japan_taiwan_official_comparison_summary(
            JAPAN_TAIWAN_OFFICIAL_COMPARISON_SUMMARY
        )
        comparison_summary_message = (
            f", {len(comparison_summary)} official comparison rows"
        )
    else:
        comparison_summary_message = ", official comparison summary not yet populated"

    if JAPAN_TAIWAN_OFFICIAL_COMPARISON_USD.exists():
        comparison_usd = validate_japan_taiwan_official_comparison_usd(
            JAPAN_TAIWAN_OFFICIAL_COMPARISON_USD
        )
        comparison_usd_message = f", {len(comparison_usd)} USD comparison rows"
    else:
        comparison_usd_message = ", USD comparison not yet populated"

    if VALIDATION_FX_RATES.exists():
        fx_rates = validate_validation_fx_rates(VALIDATION_FX_RATES)
        fx_rates_message = f", {len(fx_rates)} validation FX rows"
    else:
        fx_rates_message = ", validation FX rates not yet populated"

    if JAPAN_TAIWAN_OFFICIAL_COMPARISON_FX_NORMALIZED.exists():
        fx_normalized = validate_japan_taiwan_official_comparison_fx_normalized(
            JAPAN_TAIWAN_OFFICIAL_COMPARISON_FX_NORMALIZED
        )
        fx_normalized_message = f", {len(fx_normalized)} FX-normalized comparison rows"
    else:
        fx_normalized_message = ", FX-normalized comparison not yet populated"

    if JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE.exists():
        model_template = validate_japan_taiwan_model_validation_template(
            JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE,
            require_populated_model=(
                os.getenv("MODEL_VALIDATION_REQUIRE_POPULATED", "").strip() == "1"
            ),
        )
        model_template_message = f", {len(model_template)} model validation rows"
    else:
        model_template_message = ", model validation template not yet populated"

    if JAPAN_TAIWAN_MODEL_DRIVER_DIAGNOSTICS.exists():
        model_drivers = validate_japan_taiwan_model_driver_diagnostics(
            JAPAN_TAIWAN_MODEL_DRIVER_DIAGNOSTICS
        )
        model_drivers_message = f", {len(model_drivers)} model driver diagnostic rows"
    else:
        model_drivers_message = ", model driver diagnostics not yet populated"

    if JAPAN_TAIWAN_MODEL_DRIVER_DELTA.exists():
        model_delta = validate_japan_taiwan_model_driver_delta(
            JAPAN_TAIWAN_MODEL_DRIVER_DELTA
        )
        model_delta_message = f", {len(model_delta)} model driver delta rows"
    else:
        model_delta_message = ", model driver delta not yet populated"

    if JAPAN_TAIWAN_SENSITIVITY_SCENARIOS.exists():
        sensitivity_scenarios = validate_japan_taiwan_sensitivity_scenarios(
            JAPAN_TAIWAN_SENSITIVITY_SCENARIOS
        )
        sensitivity_scenarios_message = (
            f", {len(sensitivity_scenarios)} sensitivity scenarios"
        )
    else:
        sensitivity_scenarios_message = ", sensitivity scenarios not yet populated"

    if JAPAN_TAIWAN_SENSITIVITY_RESULTS.exists():
        sensitivity_results = validate_japan_taiwan_sensitivity_results(
            JAPAN_TAIWAN_SENSITIVITY_RESULTS
        )
        sensitivity_results_message = (
            f", {len(sensitivity_results)} sensitivity result rows"
        )
    else:
        sensitivity_results_message = ", sensitivity results not yet populated"

    if JAPAN_TAIWAN_SENSITIVITY_SUMMARY.exists():
        sensitivity_summary = validate_japan_taiwan_sensitivity_summary(
            JAPAN_TAIWAN_SENSITIVITY_SUMMARY
        )
        sensitivity_summary_message = (
            f", {len(sensitivity_summary)} sensitivity summary rows"
        )
    else:
        sensitivity_summary_message = ", sensitivity summary not yet populated"

    print(
        "Japan/Taiwan validation scaffold checks passed "
        f"({len(basket)} basket rows, {len(sources)} source rows"
        f"{spend_message}{length_message}{per_day_message}{summary_message}"
        f"{taiwan_spend_message}{taiwan_length_message}{taiwan_per_day_message}"
        f"{taiwan_summary_message}{comparison_summary_message}"
        f"{comparison_usd_message}{fx_rates_message}{fx_normalized_message}"
        f"{model_template_message}{model_drivers_message}{model_delta_message}"
        f"{sensitivity_scenarios_message}{sensitivity_results_message}"
        f"{sensitivity_summary_message})."
    )


if __name__ == "__main__":
    main()
