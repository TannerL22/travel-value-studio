from __future__ import annotations

import pandas as pd

from basic_comfort import (
    PILLAR_WEIGHTS,
    _combine_access_quality,
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
    # Legacy helper remains stable for compatibility; production WASH scoring now
    # uses _combine_access_quality instead.
    score, reliability, source = _select_service(None, 100.0, 50.0, 95.0)
    assert score == 0.88
    assert reliability == 0.75
    assert source == "basic_fallback"


def test_basic_access_is_not_erased_by_stricter_safely_managed_measure() -> None:
    # Near-universal basic access with a weaker safely-managed result should retain a
    # strong basic-living-standards score while still reflecting the quality shortfall.
    score, reliability, source = _combine_access_quality(100.0, 27.0, 45.0, 90.0)
    assert score is not None
    assert 0.60 < score < 0.70
    assert reliability == 1.0
    assert source == "basic_plus_safely_managed"


def test_basic_only_access_is_high_score_with_reduced_evidence_reliability() -> None:
    score, reliability, source = _combine_access_quality(100.0, None, 50.0, 95.0)
    assert score == 1.0
    assert reliability == 0.90
    assert source == "basic_only"


def test_safe_only_access_remains_usable_but_lower_confidence() -> None:
    score, reliability, source = _combine_access_quality(None, 95.0, 50.0, 95.0)
    assert score == 1.0
    assert reliability == 0.80
    assert source == "safely_managed_only"


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
    # The smoother Phase 7.1 curve is still severe enough to reverse the order, but
    # no longer requires the old sub-0.20 cliff at a comfort score of 35.
    assert ranked.iloc[1]["basic_comfort_penalty"] < 0.30


def main() -> None:
    test_saturating_thresholds()
    test_basic_water_fallback_is_explicitly_weaker()
    test_basic_access_is_not_erased_by_stricter_safely_managed_measure()
    test_basic_only_access_is_high_score_with_reduced_evidence_reliability()
    test_safe_only_access_remains_usable_but_lower_confidence()
    test_weighted_geometric_is_coverage_aware()
    test_legacy_fallback_is_objective_and_saturating()
    test_zero_comfort_requirement_removes_comfort_penalty()
    test_high_comfort_requirement_can_change_order()
    print("Phase 3 basic comfort checks passed")


if __name__ == "__main__":
    main()
