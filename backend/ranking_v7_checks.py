from __future__ import annotations

import pandas as pd

import ranking_v7 as r7


def test_structural_pp_is_monotonic_and_saturates() -> None:
    low = r7.structural_purchasing_power_factor(0.5, 1.0)
    neutral = r7.structural_purchasing_power_factor(1.0, 1.0)
    high = r7.structural_purchasing_power_factor(2.0, 1.0)
    capped = r7.structural_purchasing_power_factor(10.0, 1.0)
    cap_reference = r7.structural_purchasing_power_factor(r7.STRUCTURAL_PP_MAX, 1.0)
    assert low is not None and neutral is not None and high is not None
    assert low < neutral < high
    assert abs(neutral - 1.0) < 1e-12
    assert abs(capped - cap_reference) < 1e-12


def test_stability_priority_zero_is_exactly_neutral() -> None:
    assert r7.stability_penalty(5.0, 0.0, 1.0) == 1.0
    assert r7.stability_penalty(95.0, 0.0, 1.0) == 1.0


def test_missing_stability_is_not_penalized() -> None:
    assert r7.stability_penalty(10.0, 1.0, 0.0) == 1.0


def test_partial_proxy_penalties_have_explicit_floors() -> None:
    assert abs(r7.service_depth_penalty(0.0, 1.0, 1.0) - (1.0 - r7.SERVICE_MAX_HAIRCUT)) < 1e-12
    assert abs(r7.stability_penalty(0.0, 1.0, 1.0) - (1.0 - r7.STABILITY_MAX_HAIRCUT)) < 1e-12
    assert r7.service_depth_penalty(100.0, 1.0, 1.0) == 1.0
    assert r7.stability_penalty(100.0, 1.0, 1.0) == 1.0


def test_service_and_stability_are_meaningful_but_not_single_factor_vetoes() -> None:
    weak_service = r7.service_depth_penalty(20.0, 0.65, 0.9)
    weak_stability = r7.stability_penalty(36.0, 0.75, 1.0)
    assert 0.75 < weak_service < 1.0
    assert 0.75 < weak_stability < 1.0


def test_comfort_and_service_can_change_order() -> None:
    frame = pd.DataFrame(
        [
            {
                "country": "Cheap thin",
                "tourism_pp_power": 3.0,
                "basic_comfort": 35.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 30.0,
                "service_depth_coverage": 1.0,
                "component_safety_stability": 70.0,
                "wgi_political_stability": 0.5,
                "score": 999.0,
                "component_overall_value": 99.0,
            },
            {
                "country": "Slightly pricier usable",
                "tourism_pp_power": 2.2,
                "basic_comfort": 95.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 90.0,
                "service_depth_coverage": 1.0,
                "component_safety_stability": 70.0,
                "wgi_political_stability": 0.5,
                "score": 1.0,
                "component_overall_value": 1.0,
            },
        ]
    )
    out = r7.apply_phase7_country_ranking(
        frame,
        origin_pp_multiplier=1.0,
        cheapness_priority=0.8,
        comfort_requirement=1.0,
        service_requirement=1.0,
        stability_priority=0.0,
    )
    assert out.iloc[0]["country"] == "Slightly pricier usable"


def test_legacy_gdp_or_score_cannot_drive_phase7_order() -> None:
    # Identical Phase 7 evidence must produce identical production score even if the old score differs wildly.
    frame = pd.DataFrame(
        [
            {
                "country": "A",
                "tourism_pp_power": 2.0,
                "basic_comfort": 85.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 75.0,
                "service_depth_coverage": 1.0,
                "component_safety_stability": 70.0,
                "wgi_political_stability": 0.4,
                "score": 0.00001,
                "component_overall_value": 1.0,
                "gdp_nom_pc_usd": 2_000.0,
                "gdp_ppp_pc_int": 8_000.0,
            },
            {
                "country": "B",
                "tourism_pp_power": 2.0,
                "basic_comfort": 85.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 75.0,
                "service_depth_coverage": 1.0,
                "component_safety_stability": 70.0,
                "wgi_political_stability": 0.4,
                "score": 999999.0,
                "component_overall_value": 100.0,
                "gdp_nom_pc_usd": 100_000.0,
                "gdp_ppp_pc_int": 100_000.0,
            },
        ]
    )
    out = r7.apply_phase7_country_ranking(frame, 1.0, 0.7, 0.6, 0.6, 0.6)
    assert abs(float(out.iloc[0]["score"]) - float(out.iloc[1]["score"])) < 1e-12
    assert "legacy_score_pre_phase7" in out.columns


def test_cheapness_priority_changes_elasticity_not_direction() -> None:
    low_priority = r7.structural_purchasing_power_factor(2.0, 0.0)
    high_priority = r7.structural_purchasing_power_factor(2.0, 1.0)
    assert low_priority is not None and high_priority is not None
    assert 1.0 < low_priority < high_priority


def test_city_usability_requires_city_amenity_anchor() -> None:
    score, coverage = r7.city_usability_score({"amenity_depth": None, "mobility": 90, "digital_convenience": 90})
    assert score is None
    assert coverage == 0.0


def test_missing_mobility_digital_reduce_coverage_not_score_to_zero() -> None:
    score, coverage = r7.city_usability_score({"amenity_depth": 80.0, "mobility": None, "digital_convenience": None})
    assert score == 80.0
    assert abs(coverage - 0.60) < 1e-12


def test_city_usability_combines_all_three_and_ranks() -> None:
    rows = r7.add_city_usability_v7(
        [
            {"city_id": "1", "city_name": "A", "amenity_depth": 80.0, "mobility": 90.0, "digital_convenience": 90.0},
            {"city_id": "2", "city_name": "B", "amenity_depth": 70.0, "mobility": 50.0, "digital_convenience": 60.0},
            {"city_id": "3", "city_name": "C", "amenity_depth": None, "mobility": 95.0, "digital_convenience": 95.0},
        ]
    )
    a = next(row for row in rows if row["city_name"] == "A")
    b = next(row for row in rows if row["city_name"] == "B")
    c = next(row for row in rows if row["city_name"] == "C")
    assert float(a["city_usability"]) > float(b["city_usability"])
    assert a["city_usability_rank_within_country"] == 1
    assert b["city_usability_rank_within_country"] == 2
    assert c["city_usability"] is None
    assert c["city_usability_rank_within_country"] is None


def main() -> None:
    test_structural_pp_is_monotonic_and_saturates()
    test_stability_priority_zero_is_exactly_neutral()
    test_missing_stability_is_not_penalized()
    test_partial_proxy_penalties_have_explicit_floors()
    test_service_and_stability_are_meaningful_but_not_single_factor_vetoes()
    test_comfort_and_service_can_change_order()
    test_legacy_gdp_or_score_cannot_drive_phase7_order()
    test_cheapness_priority_changes_elasticity_not_direction()
    test_city_usability_requires_city_amenity_anchor()
    test_missing_mobility_digital_reduce_coverage_not_score_to_zero()
    test_city_usability_combines_all_three_and_ranks()
    print("Phase 7 ranking rebuild checks passed")


if __name__ == "__main__":
    main()
