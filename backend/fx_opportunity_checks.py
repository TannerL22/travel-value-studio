from __future__ import annotations

import pandas as pd

from fx_opportunity import (
    HORIZONS,
    _parse_v2_rows,
    apply_fx_opportunity_to_ranking,
    combine_horizon_signals,
    cross_tailwind_ratio,
    horizon_signal,
)


def test_v2_parser() -> None:
    rates, observed_date = _parse_v2_rows(
        [
            {"date": "2026-09-16", "base": "USD", "quote": "GBP", "rate": 0.74},
            {"date": "2026-09-16", "base": "USD", "quote": "JPY", "rate": 147.0},
        ]
    )
    assert rates["USD"] == 1.0
    assert rates["GBP"] == 0.74
    assert rates["JPY"] == 147.0
    assert observed_date == "2026-09-16"


def test_bilateral_cross_tailwind() -> None:
    current = {"USD": 1.0, "GBP": 0.74, "JPY": 155.0}
    historical = {"USD": 1.0, "GBP": 0.78, "JPY": 145.0}
    ratio = cross_tailwind_ratio(current, historical, "JPY", "GBP")
    expected = (155.0 / 0.74) / (145.0 / 0.78)
    assert ratio is not None
    assert abs(ratio - expected) < 1e-12
    assert ratio > 1.0


def test_horizon_signal_is_symmetric_in_log_space() -> None:
    scale = HORIZONS["1m"].log_scale
    positive = horizon_signal(1.10, scale)
    negative = horizon_signal(1.0 / 1.10, scale)
    assert positive is not None and negative is not None
    assert abs(positive + negative) < 1e-12


def test_combined_signal_uses_all_horizons() -> None:
    ratios = {horizon: 1.05 for horizon in HORIZONS}
    signal, coverage = combine_horizon_signals(ratios)
    assert signal is not None
    assert signal > 0
    assert abs(coverage - 1.0) < 1e-12


def test_ranking_overlay_can_change_order_but_stays_bounded() -> None:
    frame = pd.DataFrame(
        [
            {"country": "A", "score": 1.0, "fx_opportunity_multiplier": 0.90},
            {"country": "B", "score": 0.95, "fx_opportunity_multiplier": 1.10},
        ]
    )
    ranked = apply_fx_opportunity_to_ranking(frame)
    assert ranked.iloc[0]["country"] == "B"
    assert ranked.iloc[0]["component_overall_value"] == 100.0
    assert abs(ranked.loc[ranked["country"] == "A", "score_pre_fx_opportunity"].iloc[0] - 1.0) < 1e-12


def main() -> None:
    test_v2_parser()
    test_bilateral_cross_tailwind()
    test_horizon_signal_is_symmetric_in_log_space()
    test_combined_signal_uses_all_horizons()
    test_ranking_overlay_can_change_order_but_stays_bounded()
    print("Phase 2 FX opportunity checks passed")


if __name__ == "__main__":
    main()
