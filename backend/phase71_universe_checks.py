from __future__ import annotations

import pandas as pd

from production_ranking import attach_legacy_score_audit_fields
from ranking_v7 import apply_phase7_country_ranking, wgi_stability_score


def _fixture() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "iso3": "AAA",
                "country": "Legacy-excluded but production-scoreable",
                "gdp_nom_pc_usd": None,
                "gdp_ppp_pc_int": None,
                "tourism_pp_power": 2.0,
                "intl_arrivals": 1_000_000,
                "wgi_political_stability": 0.0,
                "basic_comfort": 80.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 70.0,
                "service_depth_coverage": 1.0,
            },
            {
                "iso3": "BBB",
                "country": "Legacy-scoreable",
                "gdp_nom_pc_usd": 25_000.0,
                "gdp_ppp_pc_int": 40_000.0,
                "tourism_pp_power": 1.6,
                "intl_arrivals": 2_000_000,
                "wgi_political_stability": 0.5,
                "basic_comfort": 90.0,
                "basic_comfort_coverage": 1.0,
                "service_depth": 80.0,
                "service_depth_coverage": 1.0,
            },
        ]
    )


def test_legacy_audit_left_join_preserves_universe() -> None:
    frame = _fixture()
    out = attach_legacy_score_audit_fields(frame)
    assert len(out) == len(frame)
    assert set(out["iso3"]) == {"AAA", "BBB"}
    a = out[out["iso3"] == "AAA"].iloc[0]
    b = out[out["iso3"] == "BBB"].iloc[0]
    assert bool(a["legacy_score_available_pre_phase7"]) is False
    assert bool(b["legacy_score_available_pre_phase7"]) is True


def test_country_missing_legacy_score_can_still_rank() -> None:
    frame = attach_legacy_score_audit_fields(_fixture())
    out = apply_phase7_country_ranking(
        frame,
        origin_pp_multiplier=1.0,
        cheapness_priority=0.7,
        comfort_requirement=0.55,
        service_requirement=0.65,
        stability_priority=0.75,
    )
    assert set(out["iso3"]) == {"AAA", "BBB"}
    a = out[out["iso3"] == "AAA"].iloc[0]
    assert bool(a["legacy_score_available_pre_phase7"]) is False
    assert bool(a["phase71_scoreable"]) is True


def test_production_stability_is_direct_wgi_not_legacy_blend() -> None:
    frame = _fixture()
    frame["component_safety_stability"] = [99.0, 1.0]
    out = apply_phase7_country_ranking(frame, 1.0, 0.7, 0.55, 0.65, 0.75)
    a = out[out["iso3"] == "AAA"].iloc[0]
    b = out[out["iso3"] == "BBB"].iloc[0]
    assert abs(float(a["component_safety_stability"]) - 50.0) < 1e-12
    assert abs(float(b["component_safety_stability"]) - 60.0) < 1e-12
    assert a["stability_source"] == "world_bank_wgi_political_stability"


def test_wgi_mapping_bounds_and_missing() -> None:
    assert wgi_stability_score(-2.5) == 0.0
    assert wgi_stability_score(0.0) == 50.0
    assert wgi_stability_score(2.5) == 100.0
    assert wgi_stability_score(-99.0) == 0.0
    assert wgi_stability_score(99.0) == 100.0
    assert wgi_stability_score(None) is None


def main() -> None:
    test_legacy_audit_left_join_preserves_universe()
    test_country_missing_legacy_score_can_still_rank()
    test_production_stability_is_direct_wgi_not_legacy_blend()
    test_wgi_mapping_bounds_and_missing()
    print("Phase 7.1 universe integrity checks passed")


if __name__ == "__main__":
    main()
