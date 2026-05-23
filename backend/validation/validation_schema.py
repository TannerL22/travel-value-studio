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
    "notes",
]

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


def validate_basket_template(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(df, BASKET_REQUIRED_COLUMNS, "Basket template")
    return df


def validate_source_register(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(df, SOURCE_REGISTER_REQUIRED_COLUMNS, "Source register")
    return df
