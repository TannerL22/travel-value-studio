from __future__ import annotations

from pathlib import Path
from typing import Iterable, List

import pandas as pd


BASKET_REQUIRED_COLUMNS: List[str] = [
    "country",
    "city_or_area",
    "basket_category",
    "basket_item",
    "local_price",
    "local_currency",
    "converted_price_usd",
    "converted_price_gbp",
    "source_name",
    "source_url",
    "source_type",
    "source_confidence",
    "observation_date",
    "price_status",
    "data_granularity",
    "trip_profile",
    "unit",
    "quantity",
    "basket_weight",
    "notes",
]

PRICE_STATUS_VALUES = {
    "placeholder",
    "candidate_source",
    "observed",
    "estimated",
    "excluded",
}

DATA_GRANULARITY_VALUES = {
    "survey_category_spend",
    "item_price",
    "fare_table",
    "provider_quote",
    "placeholder",
}

SOURCE_REGISTER_REQUIRED_COLUMNS: List[str] = [
    "country",
    "source_name",
    "source_url",
    "data_category",
    "expected_fields",
    "source_type",
    "confidence",
    "automation_difficulty",
    "notes",
]

JAPAN_OFFICIAL_VISITOR_SPEND_REQUIRED_COLUMNS: List[str] = [
    "country",
    "source_name",
    "source_url",
    "source_file",
    "period",
    "visitor_origin_market",
    "spend_category",
    "spend_value_local",
    "local_currency",
    "spend_basis",
    "data_granularity",
    "observation_date",
    "source_confidence",
    "notes",
]


def _read_csv(path: str | Path) -> pd.DataFrame:
    resolved = Path(path)
    if not resolved.exists():
        raise FileNotFoundError(f"Missing validation file: {resolved}")
    return pd.read_csv(resolved, keep_default_na=False)


def _missing_columns(columns: Iterable[str], required: Iterable[str]) -> List[str]:
    present = set(columns)
    return [column for column in required if column not in present]


def _validate_required_columns(df: pd.DataFrame, required: List[str], label: str) -> None:
    missing = _missing_columns(df.columns, required)
    if missing:
        raise ValueError(f"{label} is missing required columns: {', '.join(missing)}")
    if df.empty:
        raise ValueError(f"{label} must contain at least one row")


def _validate_allowed_values(
    df: pd.DataFrame, column: str, allowed_values: set[str], label: str
) -> None:
    invalid = sorted(set(df[column]) - allowed_values - {""})
    if invalid:
        raise ValueError(
            f"{label} has invalid {column} values: {', '.join(invalid)}"
        )


def validate_basket_template(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(df, BASKET_REQUIRED_COLUMNS, "Basket template")
    _validate_allowed_values(
        df, "price_status", PRICE_STATUS_VALUES, "Basket template"
    )
    _validate_allowed_values(
        df, "data_granularity", DATA_GRANULARITY_VALUES, "Basket template"
    )

    observed = df["price_status"] == "observed"
    missing_source = observed & (
        (df["source_name"].str.strip() == "") | (df["source_url"].str.strip() == "")
    )
    if missing_source.any():
        rows = ", ".join(str(i + 2) for i in df.index[missing_source])
        raise ValueError(
            "Basket template observed rows must include source_name and source_url "
            f"(CSV rows: {rows})"
        )

    missing_price = observed & (
        (df["local_price"].astype(str).str.strip() == "")
        | (df["local_currency"].str.strip() == "")
    )
    if missing_price.any():
        rows = ", ".join(str(i + 2) for i in df.index[missing_price])
        raise ValueError(
            "Basket template observed rows must include local_price and "
            f"local_currency (CSV rows: {rows})"
        )
    return df


def validate_source_register(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(df, SOURCE_REGISTER_REQUIRED_COLUMNS, "Source register")
    return df


def validate_japan_official_visitor_spend(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_OFFICIAL_VISITOR_SPEND_REQUIRED_COLUMNS,
        "Japan official visitor spend",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Japan official visitor spend",
    )
    return df
