from __future__ import annotations

from pathlib import Path

from validation_schema import (
    validate_basket_template,
    validate_japan_official_length_of_stay,
    validate_japan_official_visitor_spend,
    validate_japan_official_visitor_spend_per_day,
    validate_japan_official_visitor_spend_summary,
    validate_source_register,
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

    print(
        "Japan/Taiwan validation scaffold checks passed "
        f"({len(basket)} basket rows, {len(sources)} source rows"
        f"{spend_message}{length_message}{per_day_message}{summary_message})."
    )


if __name__ == "__main__":
    main()
