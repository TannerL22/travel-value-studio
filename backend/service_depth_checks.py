from __future__ import annotations

from io import BytesIO

import pandas as pd

import service_depth as sd


def test_ttdi_scale() -> None:
    assert sd.ttdi_pillar_to_score(1.0) == 0.0
    assert sd.ttdi_pillar_to_score(4.0) == 50.0
    assert sd.ttdi_pillar_to_score(7.0) == 100.0
    assert sd.ttdi_pillar_to_score(8.0) == 100.0


def test_arrivals_fallback_is_capped() -> None:
    assert sd.arrivals_maturity_fallback_score(0.0) == 0.0
    assert sd.arrivals_maturity_fallback_score(10.0) is not None
    assert sd.arrivals_maturity_fallback_score(1000.0) == 70.0


def test_official_workbook_parser_shape() -> None:
    buffer = BytesIO()
    frame = pd.DataFrame(
        {
            "ISO Code": ["JPN", "GBR"],
            sd.TTDI_SERVICE_COLUMN: [5.5, 4.8],
            sd.TTDI_SERVICE_RANK_COLUMN: [10, 25],
        }
    )
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        frame.to_excel(writer, sheet_name="Data", index=False)
    parsed = sd._parse_ttdi_service_frame(buffer.getvalue())
    assert list(parsed["iso3"]) == ["JPN", "GBR"]
    assert list(parsed["service_depth_ttdi_2024_value"]) == [5.5, 4.8]


def test_direct_supply_preferred_and_arrivals_only_fallback() -> None:
    original_ttdi = sd.fetch_ttdi_service_frame
    original_population = sd.fetch_population_frame
    try:
        sd.fetch_ttdi_service_frame = lambda force_refresh=False: (
            pd.DataFrame(
                [
                    {
                        "iso3": "AAA",
                        "service_depth_ttdi_2024_value": 5.2,
                        "service_depth_ttdi_2024_rank": 20,
                    }
                ]
            ),
            "",
        )
        sd.fetch_population_frame = lambda target_year, force_refresh=False: (
            pd.DataFrame(
                [
                    {"iso3": "AAA", "service_depth_population": 1_000_000, "service_depth_population_year": 2025},
                    {"iso3": "BBB", "service_depth_population": 1_000_000, "service_depth_population_year": 2025},
                ]
            ),
            "",
        )
        frame = pd.DataFrame(
            [
                {"iso3": "AAA", "intl_arrivals": 2_000_000, "arrivals_year": 2024, "component_tourism_depth": 80.0},
                {"iso3": "BBB", "intl_arrivals": 2_000_000, "arrivals_year": 2024, "component_tourism_depth": 80.0},
                {"iso3": "CCC", "intl_arrivals": None, "arrivals_year": None, "component_tourism_depth": 80.0},
            ]
        )
        out = sd.add_service_depth_v4(frame, target_year=2025).set_index("iso3")
        assert out.loc["AAA", "service_depth_source"] == "wef_ttdi_2024_tourist_services"
        assert out.loc["AAA", "service_depth_coverage"] == 1.0
        assert out.loc["BBB", "service_depth_source"] == "arrivals_per_capita_fallback"
        assert out.loc["BBB", "service_depth_coverage"] == 0.45
        assert out.loc["CCC", "service_depth_source"] == "unavailable"
        assert out.loc["CCC", "service_depth_coverage"] == 0.0
        assert out.loc["AAA", "legacy_service_depth"] == 80.0
    finally:
        sd.fetch_ttdi_service_frame = original_ttdi
        sd.fetch_population_frame = original_population


def test_zero_service_requirement_removes_penalty() -> None:
    frame = pd.DataFrame(
        [
            {"country": "Thin", "score": 1.0, "service_depth": 10.0, "service_depth_coverage": 1.0},
            {"country": "Deep", "score": 0.9, "service_depth": 90.0, "service_depth_coverage": 1.0},
        ]
    )
    out = sd.apply_service_depth_to_ranking(frame, service_requirement=0.0)
    assert all(abs(value - 1.0) < 1e-12 for value in out["service_depth_penalty"])
    thin = out[out["country"] == "Thin"].iloc[0]
    assert abs(thin["score"] - 1.0) < 1e-12


def test_high_service_requirement_can_change_order() -> None:
    frame = pd.DataFrame(
        [
            {"country": "Cheap but thin", "score": 1.0, "service_depth": 25.0, "service_depth_coverage": 1.0},
            {"country": "Slightly pricier deep", "score": 0.9, "service_depth": 90.0, "service_depth_coverage": 1.0},
        ]
    )
    out = sd.apply_service_depth_to_ranking(frame, service_requirement=1.0)
    assert out.iloc[0]["country"] == "Slightly pricier deep"
    assert out.iloc[0]["service_depth_penalty"] == 1.0
    assert out.iloc[1]["service_depth_penalty"] < 0.2


def test_missing_evidence_does_not_create_penalty() -> None:
    frame = pd.DataFrame(
        [{"country": "Unknown", "score": 1.0, "service_depth": None, "service_depth_coverage": 0.0}]
    )
    out = sd.apply_service_depth_to_ranking(frame, service_requirement=1.0)
    assert abs(out.iloc[0]["service_depth_penalty"] - 1.0) < 1e-12
    assert abs(out.iloc[0]["score"] - 1.0) < 1e-12


def test_service_depth_is_preference_independent() -> None:
    frame = pd.DataFrame(
        [{"country": "A", "score": 1.0, "service_depth": 42.0, "service_depth_coverage": 1.0}]
    )
    low = sd.apply_service_depth_to_ranking(frame, service_requirement=0.1)
    high = sd.apply_service_depth_to_ranking(frame, service_requirement=0.9)
    assert low.iloc[0]["service_depth"] == 42.0
    assert high.iloc[0]["service_depth"] == 42.0
    assert high.iloc[0]["service_depth_penalty"] < low.iloc[0]["service_depth_penalty"]


def test_data_quality_uses_phase4_evidence_not_arrivals_presence() -> None:
    frame = pd.DataFrame(
        [
            {
                "iso3": "AAA",
                "data_quality_score": 75,
                "data_quality_grade": "B",
                "data_quality_flags": ["missing_arrivals", "missing_stability"],
                "service_depth_source": "wef_ttdi_2024_tourist_services",
                "service_depth_flags": [],
            },
            {
                "iso3": "BBB",
                "data_quality_score": 90,
                "data_quality_grade": "A",
                "data_quality_flags": [],
                "service_depth_source": "arrivals_per_capita_fallback",
                "service_depth_flags": ["service_depth_arrivals_fallback"],
            },
            {
                "iso3": "CCC",
                "data_quality_score": 90,
                "data_quality_grade": "A",
                "data_quality_flags": [],
                "service_depth_source": "unavailable",
                "service_depth_flags": ["missing_service_depth"],
            },
        ]
    )
    out = sd.align_data_quality_with_service_depth(frame).set_index("iso3")
    assert out.loc["AAA", "data_quality_score"] == 85
    assert "missing_arrivals" not in out.loc["AAA", "data_quality_flags"]
    assert out.loc["AAA", "data_quality_grade"] == "A"
    assert out.loc["BBB", "data_quality_score"] == 85
    assert "service_depth_arrivals_fallback" in out.loc["BBB", "data_quality_flags"]
    assert out.loc["CCC", "data_quality_score"] == 80
    assert "missing_service_depth" in out.loc["CCC", "data_quality_flags"]


def main() -> None:
    test_ttdi_scale()
    test_arrivals_fallback_is_capped()
    test_official_workbook_parser_shape()
    test_direct_supply_preferred_and_arrivals_only_fallback()
    test_zero_service_requirement_removes_penalty()
    test_high_service_requirement_can_change_order()
    test_missing_evidence_does_not_create_penalty()
    test_service_depth_is_preference_independent()
    test_data_quality_uses_phase4_evidence_not_arrivals_presence()
    print("Phase 4 service depth checks passed")


if __name__ == "__main__":
    main()
