from __future__ import annotations

from pathlib import Path

from validation_schema import (
    validate_basket_template,
    validate_japan_official_visitor_spend,
    validate_source_register,
)


VALIDATION_DIR = Path(__file__).resolve().parent
BASKET_TEMPLATE = VALIDATION_DIR / "japan_taiwan_basket_template.csv"
SOURCE_REGISTER = VALIDATION_DIR / "japan_taiwan_source_register.csv"
JAPAN_OFFICIAL_VISITOR_SPEND = VALIDATION_DIR / "japan_official_visitor_spend.csv"


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

    print(
        "Japan/Taiwan validation scaffold checks passed "
        f"({len(basket)} basket rows, {len(sources)} source rows"
        f"{spend_message})."
    )


if __name__ == "__main__":
    main()
