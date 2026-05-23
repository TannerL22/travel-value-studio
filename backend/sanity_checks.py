from __future__ import annotations

import pandas as pd

from data_sources import add_origin_fx_tailwind_diagnostics, compute_fx_tailwind_ratio_from_usd_rates
from source_registry import compute_row_data_quality


def test_good_row_quality() -> None:
    quality = compute_row_data_quality(
        {
            "ppp_private_lcu_per_int": 1.2,
            "fx_lcu_per_usd": 30.0,
            "fx_source": "FRANKFURTER",
            "ppp_private_is_nowcast": False,
            "intl_arrivals": 1_000_000,
            "wgi_political_stability": 0.5,
            "currency": "TWD",
            "fx_tailwind_signal": 0.7,
            "fx_tailwind_source": "FRANKFURTER",
            "fx_frankfurter_1y_date": "2025-05-23",
            "fx_frankfurter_3y_date": "2023-05-23",
            "fx_reference_dates_available": True,
        }
    )
    assert quality["data_quality_score"] == 100
    assert quality["data_quality_grade"] == "A"
    assert quality["data_quality_flags"] == []


def test_missing_ppp_fx_quality() -> None:
    quality = compute_row_data_quality(
        {
            "ppp_private_lcu_per_int": None,
            "fx_lcu_per_usd": None,
            "fx_source": "WDI",
            "ppp_private_is_nowcast": False,
            "intl_arrivals": 1_000_000,
            "wgi_political_stability": 0.5,
            "currency": "TWD",
            "fx_tailwind_source": "UNAVAILABLE",
        }
    )
    flags = set(quality["data_quality_flags"])
    assert "missing_ppp_private" in flags
    assert "missing_fx" in flags
    assert "missing_historical_fx" in flags
    assert "fx_tailwind_proxy" in flags
    assert quality["data_quality_grade"] in {"C", "D"}


def test_cross_rate_tailwind_math() -> None:
    current = {"USD": 1.0, "TWD": 30.0, "JPY": 150.0}
    historical = {"USD": 1.0, "TWD": 31.0, "JPY": 130.0}
    ratio = compute_fx_tailwind_ratio_from_usd_rates(
        current,
        historical,
        destination_currency="JPY",
        origin_currency="TWD",
    )
    expected = (150.0 / 30.0) / (130.0 / 31.0)
    assert ratio is not None
    assert abs(ratio - expected) < 1e-9


def test_origin_fx_tailwind_diagnostics() -> None:
    df = pd.DataFrame(
        [
            {
                "currency": "TWD",
                "fx_lcu_per_usd_live": 30.0,
                "fx_lcu_per_usd": 30.0,
                "fx_lcu_per_usd_1y_ago": 31.0,
                "fx_lcu_per_usd_3y_ago": 32.0,
            },
            {
                "currency": "JPY",
                "fx_lcu_per_usd_live": 150.0,
                "fx_lcu_per_usd": 150.0,
                "fx_lcu_per_usd_1y_ago": 130.0,
                "fx_lcu_per_usd_3y_ago": 120.0,
            },
        ]
    )
    out = add_origin_fx_tailwind_diagnostics(df, "TWD")
    jpy = out[out["currency"] == "JPY"].iloc[0]
    expected_one_year = (150.0 / 30.0) / (130.0 / 31.0)
    assert abs(jpy["fx_tailwind_origin_1y"] - expected_one_year) < 1e-9
    assert jpy["fx_tailwind_origin_source"] == "HISTORICAL_CROSS"


def main() -> None:
    test_good_row_quality()
    test_missing_ppp_fx_quality()
    test_cross_rate_tailwind_math()
    test_origin_fx_tailwind_diagnostics()
    print("Backend sanity checks passed.")


if __name__ == "__main__":
    main()
