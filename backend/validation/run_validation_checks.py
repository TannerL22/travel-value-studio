from __future__ import annotations

from pathlib import Path

from validation_schema import (
    validate_basket_template,
    validate_japan_official_length_of_stay,
    validate_japan_official_visitor_spend,
    validate_japan_official_visitor_spend_per_day,
    validate_japan_official_visitor_spend_summary,
    validate_japan_taiwan_model_validation_template,
    validate_japan_taiwan_official_comparison_summary,
    validate_japan_taiwan_official_comparison_usd,
    validate_source_register,
    validate_taiwan_official_length_of_stay,
    validate_taiwan_official_visitor_spend,
    validate_taiwan_official_visitor_spend_per_day,
    validate_taiwan_official_visitor_spend_summary,
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
JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE = (
    VALIDATION_DIR / "japan_taiwan_model_validation_template.csv"
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

    if JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE.exists():
        model_template = validate_japan_taiwan_model_validation_template(
            JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE
        )
        model_template_message = f", {len(model_template)} model validation rows"
    else:
        model_template_message = ", model validation template not yet populated"

    print(
        "Japan/Taiwan validation scaffold checks passed "
        f"({len(basket)} basket rows, {len(sources)} source rows"
        f"{spend_message}{length_message}{per_day_message}{summary_message}"
        f"{taiwan_spend_message}{taiwan_length_message}{taiwan_per_day_message}"
        f"{taiwan_summary_message}{comparison_summary_message}"
        f"{comparison_usd_message}{model_template_message})."
    )


if __name__ == "__main__":
    main()
