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
    "survey_headline_spend",
    "survey_category_spend",
    "average_length_of_stay",
    "derived_per_day_spend",
    "summary",
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

JAPAN_OFFICIAL_LENGTH_OF_STAY_REQUIRED_COLUMNS: List[str] = [
    "country",
    "source_name",
    "source_url",
    "source_file",
    "period",
    "visitor_origin_market",
    "length_of_stay_days",
    "stay_basis",
    "data_granularity",
    "observation_date",
    "source_confidence",
    "notes",
]

JAPAN_OFFICIAL_VISITOR_SPEND_PER_DAY_REQUIRED_COLUMNS: List[str] = [
    "country",
    "period",
    "visitor_origin_market",
    "spend_category",
    "spend_value_local_per_trip",
    "length_of_stay_days",
    "spend_value_local_per_day",
    "local_currency",
    "spend_basis",
    "data_granularity",
    "source_name",
    "source_url",
    "source_file",
    "source_confidence",
    "notes",
]

JAPAN_OFFICIAL_VISITOR_SPEND_SUMMARY_REQUIRED_COLUMNS: List[str] = [
    "visitor_origin_market",
    "total_spend_per_trip_jpy",
    "length_of_stay_days",
    "total_spend_per_day_jpy",
    "accommodation_per_day_jpy",
    "food_drink_per_day_jpy",
    "local_transport_per_day_jpy",
    "shopping_per_day_jpy",
    "notes",
]

TAIWAN_OFFICIAL_VISITOR_SPEND_REQUIRED_COLUMNS: List[str] = [
    "country",
    "source_name",
    "source_url",
    "source_file",
    "period",
    "visitor_origin_market",
    "spend_category",
    "spend_value_local",
    "local_currency",
    "spend_value_usd",
    "spend_basis",
    "data_granularity",
    "observation_date",
    "source_confidence",
    "notes",
]

TAIWAN_OFFICIAL_LENGTH_OF_STAY_REQUIRED_COLUMNS: List[str] = [
    "country",
    "source_name",
    "source_url",
    "source_file",
    "period",
    "visitor_origin_market",
    "length_of_stay_days",
    "stay_basis",
    "data_granularity",
    "observation_date",
    "source_confidence",
    "notes",
]

TAIWAN_OFFICIAL_VISITOR_SPEND_PER_DAY_REQUIRED_COLUMNS: List[str] = [
    "country",
    "period",
    "visitor_origin_market",
    "spend_category",
    "spend_value_local_per_trip",
    "length_of_stay_days",
    "spend_value_local_per_day",
    "local_currency",
    "spend_value_usd_per_trip",
    "spend_value_usd_per_day",
    "spend_basis",
    "data_granularity",
    "source_name",
    "source_url",
    "source_file",
    "source_confidence",
    "notes",
]

TAIWAN_OFFICIAL_VISITOR_SPEND_SUMMARY_REQUIRED_COLUMNS: List[str] = [
    "visitor_origin_market",
    "total_spend_per_trip_twd",
    "length_of_stay_days",
    "total_spend_per_day_twd",
    "total_spend_per_trip_usd",
    "total_spend_per_day_usd",
    "accommodation_per_day_twd",
    "food_drink_per_day_twd",
    "local_transport_per_day_twd",
    "shopping_per_day_twd",
    "notes",
]

JAPAN_TAIWAN_OFFICIAL_COMPARISON_SUMMARY_REQUIRED_COLUMNS: List[str] = [
    "metric",
    "japan_value",
    "japan_currency",
    "japan_basis",
    "taiwan_value",
    "taiwan_currency",
    "taiwan_basis",
    "comparison_direction",
    "comparability",
    "notes",
]

JAPAN_TAIWAN_OFFICIAL_COMPARISON_USD_REQUIRED_COLUMNS: List[str] = [
    "metric",
    "japan_value_usd",
    "taiwan_value_usd",
    "japan_source_basis",
    "taiwan_source_basis",
    "taiwan_minus_japan_usd",
    "taiwan_vs_japan_pct",
    "comparability",
    "notes",
]

VALIDATION_FX_RATES_REQUIRED_COLUMNS: List[str] = [
    "fx_rate_id",
    "source_name",
    "source_url",
    "period",
    "base_currency",
    "quote_currency",
    "rate",
    "rate_direction",
    "frequency",
    "source_confidence",
    "notes",
]

JAPAN_TAIWAN_OFFICIAL_COMPARISON_FX_NORMALIZED_REQUIRED_COLUMNS: List[str] = [
    "metric",
    "japan_value_local",
    "japan_currency",
    "japan_period",
    "japan_fx_rate_to_usd",
    "japan_fx_rate_source",
    "japan_value_usd",
    "japan_value_gbp",
    "taiwan_value_local",
    "taiwan_currency",
    "taiwan_period",
    "taiwan_fx_rate_to_usd",
    "taiwan_fx_rate_source",
    "taiwan_value_usd",
    "taiwan_value_gbp",
    "taiwan_minus_japan_usd",
    "taiwan_vs_japan_pct_usd",
    "taiwan_minus_japan_gbp",
    "comparability",
    "notes",
]

JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE_REQUIRED_COLUMNS: List[str] = [
    "origin_iso3",
    "origin_currency",
    "destination_iso3",
    "destination_country",
    "model_score",
    "model_est_daily_cost_origin_currency",
    "model_value_multiplier_relative",
    "component_fx_tailwind",
    "component_fx_tailwind_source",
    "component_ppp_advantage",
    "component_comfort_floor",
    "component_tourism_depth",
    "component_safety_stability",
    "official_spend_per_day_local",
    "official_spend_per_day_usd",
    "official_spend_basis",
    "validation_signal",
    "notes",
]

MODEL_VALIDATION_REQUIRED_MODEL_COLUMNS: List[str] = [
    "model_score",
    "model_est_daily_cost_origin_currency",
    "model_value_multiplier_relative",
    "component_fx_tailwind",
    "component_fx_tailwind_source",
    "component_ppp_advantage",
    "component_comfort_floor",
    "component_tourism_depth",
    "component_safety_stability",
]

MODEL_VALIDATION_ALLOW_BLANK_SIGNALS = {
    "model_output_pending",
    "model_output_missing",
    "official_data_pending",
    "not_comparable",
}


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


def _validate_non_negative_numeric(df: pd.DataFrame, columns: List[str], label: str) -> None:
    for column in columns:
        values = pd.to_numeric(df[column], errors="coerce")
        populated = df[column].astype(str).str.strip() != ""
        invalid = populated & values.isna()
        if invalid.any():
            rows = ", ".join(str(i + 2) for i in df.index[invalid])
            raise ValueError(f"{label} has non-numeric {column} values (CSV rows: {rows})")
        negative = populated & (values < 0)
        if negative.any():
            rows = ", ".join(str(i + 2) for i in df.index[negative])
            raise ValueError(f"{label} has negative {column} values (CSV rows: {rows})")


def _validate_numeric(df: pd.DataFrame, columns: List[str], label: str) -> None:
    for column in columns:
        values = pd.to_numeric(df[column], errors="coerce")
        populated = df[column].astype(str).str.strip() != ""
        invalid = populated & values.isna()
        if invalid.any():
            rows = ", ".join(str(i + 2) for i in df.index[invalid])
            raise ValueError(f"{label} has non-numeric {column} values (CSV rows: {rows})")


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


def validate_japan_official_length_of_stay(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_OFFICIAL_LENGTH_OF_STAY_REQUIRED_COLUMNS,
        "Japan official length of stay",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Japan official length of stay",
    )
    _validate_non_negative_numeric(
        df, ["length_of_stay_days"], "Japan official length of stay"
    )
    return df


def validate_japan_official_visitor_spend_per_day(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_OFFICIAL_VISITOR_SPEND_PER_DAY_REQUIRED_COLUMNS,
        "Japan official visitor spend per day",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Japan official visitor spend per day",
    )
    _validate_non_negative_numeric(
        df,
        [
            "spend_value_local_per_trip",
            "length_of_stay_days",
            "spend_value_local_per_day",
        ],
        "Japan official visitor spend per day",
    )
    return df


def validate_japan_official_visitor_spend_summary(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_OFFICIAL_VISITOR_SPEND_SUMMARY_REQUIRED_COLUMNS,
        "Japan official visitor spend summary",
    )
    _validate_non_negative_numeric(
        df,
        [
            "total_spend_per_trip_jpy",
            "length_of_stay_days",
            "total_spend_per_day_jpy",
            "accommodation_per_day_jpy",
            "food_drink_per_day_jpy",
            "local_transport_per_day_jpy",
            "shopping_per_day_jpy",
        ],
        "Japan official visitor spend summary",
    )
    return df


def validate_taiwan_official_visitor_spend(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        TAIWAN_OFFICIAL_VISITOR_SPEND_REQUIRED_COLUMNS,
        "Taiwan official visitor spend",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Taiwan official visitor spend",
    )
    _validate_non_negative_numeric(
        df,
        ["spend_value_local", "spend_value_usd"],
        "Taiwan official visitor spend",
    )
    return df


def validate_taiwan_official_length_of_stay(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        TAIWAN_OFFICIAL_LENGTH_OF_STAY_REQUIRED_COLUMNS,
        "Taiwan official length of stay",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Taiwan official length of stay",
    )
    _validate_non_negative_numeric(
        df, ["length_of_stay_days"], "Taiwan official length of stay"
    )
    return df


def validate_taiwan_official_visitor_spend_per_day(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        TAIWAN_OFFICIAL_VISITOR_SPEND_PER_DAY_REQUIRED_COLUMNS,
        "Taiwan official visitor spend per day",
    )
    _validate_allowed_values(
        df,
        "data_granularity",
        DATA_GRANULARITY_VALUES,
        "Taiwan official visitor spend per day",
    )
    _validate_non_negative_numeric(
        df,
        [
            "spend_value_local_per_trip",
            "length_of_stay_days",
            "spend_value_local_per_day",
            "spend_value_usd_per_trip",
            "spend_value_usd_per_day",
        ],
        "Taiwan official visitor spend per day",
    )
    return df


def validate_taiwan_official_visitor_spend_summary(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        TAIWAN_OFFICIAL_VISITOR_SPEND_SUMMARY_REQUIRED_COLUMNS,
        "Taiwan official visitor spend summary",
    )
    _validate_non_negative_numeric(
        df,
        [
            "total_spend_per_trip_twd",
            "length_of_stay_days",
            "total_spend_per_day_twd",
            "total_spend_per_trip_usd",
            "total_spend_per_day_usd",
            "accommodation_per_day_twd",
            "food_drink_per_day_twd",
            "local_transport_per_day_twd",
            "shopping_per_day_twd",
        ],
        "Taiwan official visitor spend summary",
    )
    return df


def validate_japan_taiwan_official_comparison_summary(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_TAIWAN_OFFICIAL_COMPARISON_SUMMARY_REQUIRED_COLUMNS,
        "Japan/Taiwan official comparison summary",
    )
    _validate_non_negative_numeric(
        df,
        ["japan_value", "taiwan_value"],
        "Japan/Taiwan official comparison summary",
    )
    return df


def validate_japan_taiwan_official_comparison_usd(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_TAIWAN_OFFICIAL_COMPARISON_USD_REQUIRED_COLUMNS,
        "Japan/Taiwan official comparison USD",
    )
    _validate_non_negative_numeric(
        df,
        [
            "japan_value_usd",
            "taiwan_value_usd",
        ],
        "Japan/Taiwan official comparison USD",
    )
    _validate_numeric(
        df,
        [
            "taiwan_minus_japan_usd",
            "taiwan_vs_japan_pct",
        ],
        "Japan/Taiwan official comparison USD",
    )
    return df


def validate_validation_fx_rates(path: str | Path) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        VALIDATION_FX_RATES_REQUIRED_COLUMNS,
        "Validation FX rates",
    )
    _validate_non_negative_numeric(df, ["period", "rate"], "Validation FX rates")
    return df


def validate_japan_taiwan_official_comparison_fx_normalized(
    path: str | Path,
) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_TAIWAN_OFFICIAL_COMPARISON_FX_NORMALIZED_REQUIRED_COLUMNS,
        "Japan/Taiwan official comparison FX-normalized",
    )
    _validate_non_negative_numeric(
        df,
        [
            "japan_value_local",
            "japan_fx_rate_to_usd",
            "japan_value_usd",
            "japan_value_gbp",
            "taiwan_value_local",
            "taiwan_fx_rate_to_usd",
            "taiwan_value_usd",
            "taiwan_value_gbp",
        ],
        "Japan/Taiwan official comparison FX-normalized",
    )
    _validate_numeric(
        df,
        [
            "taiwan_minus_japan_usd",
            "taiwan_vs_japan_pct_usd",
            "taiwan_minus_japan_gbp",
        ],
        "Japan/Taiwan official comparison FX-normalized",
    )
    return df


def validate_japan_taiwan_model_validation_template(
    path: str | Path,
    require_populated_model: bool = False,
) -> pd.DataFrame:
    df = _read_csv(path)
    _validate_required_columns(
        df,
        JAPAN_TAIWAN_MODEL_VALIDATION_TEMPLATE_REQUIRED_COLUMNS,
        "Japan/Taiwan model validation template",
    )
    _validate_non_negative_numeric(
        df,
        [
            "model_score",
            "model_est_daily_cost_origin_currency",
            "model_value_multiplier_relative",
            "component_fx_tailwind",
            "component_ppp_advantage",
            "component_comfort_floor",
            "component_tourism_depth",
            "component_safety_stability",
            "official_spend_per_day_local",
            "official_spend_per_day_usd",
        ],
        "Japan/Taiwan model validation template",
    )
    if require_populated_model:
        pending = df["validation_signal"].isin(MODEL_VALIDATION_ALLOW_BLANK_SIGNALS)
        check_rows = ~pending
        for column in MODEL_VALIDATION_REQUIRED_MODEL_COLUMNS:
            missing = check_rows & (df[column].astype(str).str.strip() == "")
            if missing.any():
                rows = ", ".join(str(i + 2) for i in df.index[missing])
                raise ValueError(
                    "Japan/Taiwan model validation template has populated "
                    f"validation_signal rows missing {column} (CSV rows: {rows})"
                )
    return df
