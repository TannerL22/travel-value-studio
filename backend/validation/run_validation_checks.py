from __future__ import annotations

from pathlib import Path

from validation_schema import validate_basket_template, validate_source_register


VALIDATION_DIR = Path(__file__).resolve().parent
BASKET_TEMPLATE = VALIDATION_DIR / "japan_taiwan_basket_template.csv"
SOURCE_REGISTER = VALIDATION_DIR / "japan_taiwan_source_register.csv"


def main() -> None:
    basket = validate_basket_template(BASKET_TEMPLATE)
    sources = validate_source_register(SOURCE_REGISTER)
    print(
        "Japan/Taiwan validation scaffold checks passed "
        f"({len(basket)} basket rows, {len(sources)} source rows)."
    )


if __name__ == "__main__":
    main()
