from __future__ import annotations

import math

import pandas as pd

from ranking_v7 import apply_phase7_country_ranking


def fixture() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "iso3": "CHE",
                "country": "Cheap but thin",
                "tourism_pp_power": 2.8,
                "basic_comfort": 42.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 30.0,
                "service_depth_coverage": 1.0,
                "wgi_political_stability": -0.8,
            },
            {
                "iso3": "BAL",
                "country": "Balanced",
                "tourism_pp_power": 1.7,
                "basic_comfort": 78.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 67.0,
                "service_depth_coverage": 1.0,
                "wgi_political_stability": 0.2,
            },
            {
                "iso3": "PRE",
                "country": "Pricier but strong",
                "tourism_pp_power": 0.85,
                "basic_comfort": 96.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 90.0,
                "service_depth_coverage": 1.0,
                "wgi_political_stability": 1.2,
            },
            {
                "iso3": "MIS",
                "country": "Missing stability",
                "tourism_pp_power": 1.4,
                "basic_comfort": 82.0,
                "basic_comfort_coverage": 0.8,
                "service_depth": 55.0,
                "service_depth_coverage": 0.45,
                "wgi_political_stability": None,
            },
        ]
    )


def run(*, value: float = 0.7, comfort: float = 0.55, services: float = 0.65, stability: float = 0.75) -> pd.DataFrame:
    return apply_phase7_country_ranking(
        fixture(),
        origin_pp_multiplier=1.0,
        cheapness_priority=value,
        comfort_requirement=comfort,
        service_requirement=services,
        stability_priority=stability,
    ).set_index("iso3")


def assert_same_universe(a: pd.DataFrame, b: pd.DataFrame) -> None:
    assert set(a.index) == set(b.index) == {"CHE", "BAL", "PRE", "MIS"}


def aligned_values(a: pd.DataFrame, b: pd.DataFrame, field: str) -> tuple[pd.Series, pd.Series]:
    index = sorted(set(a.index) & set(b.index))
    return a.loc[index, field], b.loc[index, field]


def test_all_control_extremes_preserve_universe() -> None:
    baseline = run()
    scenarios = [
        run(value=0.0), run(value=1.0),
        run(comfort=0.0), run(comfort=1.0),
        run(services=0.0), run(services=1.0),
        run(stability=0.0), run(stability=1.0),
    ]
    for scenario in scenarios:
        assert_same_universe(baseline, scenario)


def test_value_control_changes_only_structural_factor_before_normalization() -> None:
    low = run(value=0.0)
    high = run(value=1.0)
    assert_same_universe(low, high)
    for iso3 in low.index:
        assert math.isclose(float(low.loc[iso3, "basic_comfort_penalty"]), float(high.loc[iso3, "basic_comfort_penalty"]), rel_tol=0, abs_tol=1e-12)
        assert math.isclose(float(low.loc[iso3, "service_depth_penalty"]), float(high.loc[iso3, "service_depth_penalty"]), rel_tol=0, abs_tol=1e-12)
        assert math.isclose(float(low.loc[iso3, "stability_penalty"]), float(high.loc[iso3, "stability_penalty"]), rel_tol=0, abs_tol=1e-12)

    assert float(high.loc["CHE", "structural_value_factor"]) > float(low.loc["CHE", "structural_value_factor"])
    assert float(high.loc["BAL", "structural_value_factor"]) > float(low.loc["BAL", "structural_value_factor"])
    assert float(high.loc["PRE", "structural_value_factor"]) < float(low.loc["PRE", "structural_value_factor"])


def test_comfort_control_is_neutral_at_zero_and_only_tightens_comfort() -> None:
    low = run(comfort=0.0)
    high = run(comfort=1.0)
    assert_same_universe(low, high)
    assert (low["basic_comfort_penalty"] == 1.0).all()
    low_penalty, high_penalty = aligned_values(low, high, "basic_comfort_penalty")
    assert (high_penalty <= low_penalty + 1e-12).all()
    assert float(high.loc["CHE", "basic_comfort_penalty"]) < 1.0
    for field in ["structural_value_factor", "service_depth_penalty", "stability_penalty"]:
        assert all(math.isclose(float(low.loc[i, field]), float(high.loc[i, field]), rel_tol=0, abs_tol=1e-12) for i in low.index)


def test_service_control_is_neutral_at_zero_and_only_tightens_services() -> None:
    low = run(services=0.0)
    high = run(services=1.0)
    assert_same_universe(low, high)
    assert (low["service_depth_penalty"] == 1.0).all()
    low_penalty, high_penalty = aligned_values(low, high, "service_depth_penalty")
    assert (high_penalty <= low_penalty + 1e-12).all()
    assert float(high.loc["CHE", "service_depth_penalty"]) < 1.0
    for field in ["structural_value_factor", "basic_comfort_penalty", "stability_penalty"]:
        assert all(math.isclose(float(low.loc[i, field]), float(high.loc[i, field]), rel_tol=0, abs_tol=1e-12) for i in low.index)


def test_stability_control_is_neutral_at_zero_missing_remains_neutral() -> None:
    low = run(stability=0.0)
    high = run(stability=1.0)
    assert_same_universe(low, high)
    assert (low["stability_penalty"] == 1.0).all()
    low_penalty, high_penalty = aligned_values(low, high, "stability_penalty")
    assert (high_penalty <= low_penalty + 1e-12).all()
    assert float(high.loc["CHE", "stability_penalty"]) < 1.0
    assert float(high.loc["MIS", "stability_penalty"]) == 1.0
    assert float(high.loc["MIS", "stability_evidence_coverage"]) == 0.0
    for field in ["structural_value_factor", "basic_comfort_penalty", "service_depth_penalty"]:
        assert all(math.isclose(float(low.loc[i, field]), float(high.loc[i, field]), rel_tol=0, abs_tol=1e-12) for i in low.index)


def main() -> None:
    test_all_control_extremes_preserve_universe()
    test_value_control_changes_only_structural_factor_before_normalization()
    test_comfort_control_is_neutral_at_zero_and_only_tightens_comfort()
    test_service_control_is_neutral_at_zero_and_only_tightens_services()
    test_stability_control_is_neutral_at_zero_missing_remains_neutral()
    print("Phase 7.1 control sensitivity checks passed")


if __name__ == "__main__":
    main()
