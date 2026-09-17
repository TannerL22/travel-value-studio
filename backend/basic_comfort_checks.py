from __future__ import annotations

import pandas as pd

from basic_comfort import (
    PILLAR_WEIGHTS,
    _legacy_gdp_comfort,
    _select_service,
    _weighted_geometric,
    apply_basic_comfort_to_ranking,
    saturating_service_score,
)


def test_saturating_thresholds() -> None:
    assert saturating_service_score(40, 50, 95) == 0.0
    assert saturating_service_score(95, 50, 95) == 1.0
    assert saturating_service_score(100, 50, 95) == 1.0
    middle = saturating_service_score(72.5, 50, 95)
    assert middle is not None
    assert abs(middle - 0.5) < 1e-12


def test_basic_water_fallback_is_explicitly_weaker() -> None:
    score, reliability, source = _select_service(None, 100.0, 50.0, 95.0)
    assert score == 0.88
    assert reliability == 0.75
    assert source == "basic_fallback"


def test_weighted_geometric_is_coverage_aware() -> None:
    values = {
        "water": 1.0,
        "sanitation": 1.0,
        "electricity": 1.0,
        "internet": None,
        "health": 1.0,
    }
    reliability = {key: (0.0 if key == "internet" else 1.0) for key in PILLAR_WEIGHTS}
    direct, coverage = _weighted_geometric(values, reliability)
    assert direct == 1.0
    assert abs(coverage - 0.85) < 1e-12


def test_legacy_fallback_is_objective_and_saturating() -> None:
    assert _legacy_gdp_comfort(12_000.0) == 1.0
    assert _legacy_gdp_comfort(24_000.0) == 1.0
    assert abs(_legacy_gdp_comfort(6_000.0) - 0.25) < 1e-12


def test_zero_comfort_requirement_removes_comfort_penalty() -> None:
    frame = pd.DataFrame(
        [
            {
                "country": "Low comfort",
                "score": 0.01,
                "score_floor_penalty": 0.01,
                "score_base": 1.0,
                "score_tourism_cost": 0.8,
                "score_infra": 0.9,
                "score_safety": 0.9,
                "basic_comfort": 10.0,
            }
        ]
    )
    ranked = apply_basic_comfort_to_ranking(frame, comfort_requirement=0.0)
    assert abs(ranked.iloc[0]["basic_comfort_penalty"] - 1.0) < 1e-12
    assert abs(ranked.iloc[0]["score"] - (1.0 * 0.8 * 0.9 * 0.9)) < 1e-12


def test_high_comfort_requirement_can_change_order() -> None:
    frame = pd.DataFrame(
        [
            {
                "country": "Cheap but weak services",
                "score": 1.0,
                "score_floor_penalty": 1.0,
                "score_base": 1.0,
                "score_tourism_cost": 1.0,
                "score_infra": 1.0,
                "score_safety": 1.0,
                "basic_comfort": 35.0,
            },
            {
                "country": "Slightly pricier strong services",
                "score": 0.9,
                "score_floor_penalty": 1.0,
                "score_base": 0.9,
                "score_tourism_cost": 1.0,
                "score_infra": 1.0,
                "score_safety": 1.0,
                "basic_comfort": 95.0,
            },
        ]
    )
    ranked = apply_basic_comfort_to_ranking(frame, comfort_requirement=1.0)
    assert ranked.iloc[0]["country"] == "Slightly pricier strong services"
    assert ranked.iloc[0]["basic_comfort_penalty"] == 1.0
    assert ranked.iloc[1]["basic_comfort_penalty"] < 0.2


def main() -> None:
    test_saturating_thresholds()
    test_basic_water_fallback_is_explicitly_weaker()
    test_weighted_geometric_is_coverage_aware()
    test_legacy_fallback_is_objective_and_saturating()
    test_zero_comfort_requirement_removes_comfort_penalty()
    test_high_comfort_requirement_can_change_order()
    print("Phase 3 basic comfort checks passed")


if __name__ == "__main__":
    main()
