from __future__ import annotations

from io import BytesIO
import math
from zipfile import ZipFile

import pandas as pd

import city_intelligence as ci


def _build_stats_zip() -> bytes:
    workbook = BytesIO()
    frame = pd.DataFrame(
        {
            "ID_UC_G0": [1001, 1002, 2001],
            "UC_NM_MN": ["Alpha City", "Beta City", "Gamma City"],
            "Year": [2025, 2025, 2025],
            "Ctr_M49": [826, 826, 392],
            "POP": [2_000_000, 600_000, 5_000_000],
            "AREA_km2": [500.0, 150.0, 900.0],
            "BU_km2": [220.0, 70.0, 480.0],
            "Lat": [51.50, 53.48, 35.68],
            "Lon": [-0.12, -2.24, 139.76],
            "CapitalFlag": [1, 0, 1],
            "Plausibility": [3, 2, 3],
        }
    )
    with pd.ExcelWriter(workbook, engine="openpyxl") as writer:
        frame.to_excel(writer, sheet_name="MTUC", index=False)

    zipped = BytesIO()
    with ZipFile(zipped, "w") as archive:
        archive.writestr("GHS_WUP_MTUC_MT_GLOBE_R2025A_V1_1.xlsx", workbook.getvalue())
    return zipped.getvalue()


def test_jrc_parser() -> None:
    parsed = ci.parse_jrc_city_statistics(_build_stats_zip(), target_year=2025)
    assert len(parsed) == 3
    uk = parsed[parsed["iso3"] == "GBR"].sort_values("population", ascending=False)
    assert list(uk["city_name"]) == ["Alpha City", "Beta City"]
    assert float(uk.iloc[0]["built_up_km2"]) == 220.0
    assert int(uk.iloc[0]["reference_year"]) == 2025


def test_bbox_scales_with_area_and_preserves_equivalent_area() -> None:
    small = ci.city_bbox(51.5, -0.1, 100.0)
    large = ci.city_bbox(51.5, -0.1, 1_000.0)
    assert large[4] > small[4]
    assert small[0] < -0.1 < small[2]
    assert small[1] < 51.5 < small[3]

    target_area = math.pi * 100.0
    equivalent = ci.city_bbox(51.5, -0.1, target_area)
    assert abs(equivalent[4] - 10.0) < 1e-9


def test_amenity_score_saturates_and_includes_lifestyle_services() -> None:
    low = ci.score_city_amenities(
        {
            "amenity_total": 60,
            "food_drink_count": 20,
            "shopping_count": 10,
            "health_care_count": 5,
            "recreation_culture_count": 5,
            "lifestyle_services_count": 8,
            "lodging_count": 2,
        },
        population=500_000,
        area_km2=250,
    )
    high = ci.score_city_amenities(
        {
            "amenity_total": 60_000,
            "food_drink_count": 20_000,
            "shopping_count": 12_000,
            "health_care_count": 5_000,
            "recreation_culture_count": 8_000,
            "lifestyle_services_count": 6_000,
            "lodging_count": 5_000,
        },
        population=500_000,
        area_km2=250,
    )
    assert float(high["amenity_depth"]) > float(low["amenity_depth"])
    assert float(high["amenity_depth"]) <= 100.0
    assert "amenity_lifestyle_services_score" in high


def test_country_city_selection_without_amenity_network() -> None:
    original_fetch = ci.fetch_city_universe
    try:
        ci.fetch_city_universe = lambda force_refresh=False: (
            pd.DataFrame(
                [
                    {"city_id": "1", "city_name": "Big", "iso3": "GBR", "population": 2_000_000, "area_km2": 500, "built_up_km2": 200, "lat": 51.5, "lon": -0.1, "reference_year": 2025},
                    {"city_id": "2", "city_name": "Small", "iso3": "GBR", "population": 500_000, "area_km2": 150, "built_up_km2": 80, "lat": 53.4, "lon": -2.2, "reference_year": 2025},
                    {"city_id": "3", "city_name": "Elsewhere", "iso3": "JPN", "population": 3_000_000, "area_km2": 600, "built_up_km2": 300, "lat": 35.7, "lon": 139.7, "reference_year": 2025},
                ]
            ),
            "",
        )
        cities, meta = ci.get_country_cities("GBR", limit=2, include_amenities=False)
        assert [city["city_name"] for city in cities] == ["Big", "Small"]
        assert int(meta["city_count_in_country"]) == 2
    finally:
        ci.fetch_city_universe = original_fetch


def test_amenity_sorting_prefers_depth_and_assigns_rank() -> None:
    original_fetch = ci.fetch_city_universe
    original_add = ci.add_city_amenities
    try:
        ci.fetch_city_universe = lambda force_refresh=False: (
            pd.DataFrame(
                [
                    {"city_id": "1", "city_name": "Big", "iso3": "AAA", "population": 2_000_000, "area_km2": 500, "lat": 10.0, "lon": 10.0},
                    {"city_id": "2", "city_name": "Dense", "iso3": "AAA", "population": 600_000, "area_km2": 100, "lat": 11.0, "lon": 11.0},
                ]
            ),
            "",
        )
        ci.add_city_amenities = lambda city, force_refresh=False: {
            **city,
            "amenity_depth": 90.0 if city["city_name"] == "Dense" else 60.0,
            "amenity_source": "test",
        }
        cities, _ = ci.get_country_cities("AAA", limit=2, include_amenities=True)
        assert [city["city_name"] for city in cities] == ["Dense", "Big"]
        assert [city["amenity_rank_within_country"] for city in cities] == [1, 2]
    finally:
        ci.fetch_city_universe = original_fetch
        ci.add_city_amenities = original_add


def test_missing_amenity_evidence_is_unranked_not_zero() -> None:
    original_fetch = ci.fetch_city_universe
    original_add = ci.add_city_amenities
    try:
        ci.fetch_city_universe = lambda force_refresh=False: (
            pd.DataFrame(
                [
                    {"city_id": "1", "city_name": "Observed", "iso3": "AAA", "population": 800_000, "area_km2": 200, "lat": 10.0, "lon": 10.0},
                    {"city_id": "2", "city_name": "Unknown", "iso3": "AAA", "population": 700_000, "area_km2": 180, "lat": 11.0, "lon": 11.0},
                ]
            ),
            "",
        )
        ci.add_city_amenities = lambda city, force_refresh=False: {
            **city,
            "amenity_depth": 75.0 if city["city_name"] == "Observed" else None,
            "amenity_source": "test" if city["city_name"] == "Observed" else "unavailable",
        }
        cities, _ = ci.get_country_cities("AAA", limit=2, include_amenities=True)
        assert cities[0]["city_name"] == "Observed"
        assert cities[0]["amenity_rank_within_country"] == 1
        unknown = next(city for city in cities if city["city_name"] == "Unknown")
        assert unknown["amenity_depth"] is None
        assert unknown["amenity_rank_within_country"] is None
    finally:
        ci.fetch_city_universe = original_fetch
        ci.add_city_amenities = original_add


def main() -> None:
    test_jrc_parser()
    test_bbox_scales_with_area_and_preserves_equivalent_area()
    test_amenity_score_saturates_and_includes_lifestyle_services()
    test_country_city_selection_without_amenity_network()
    test_amenity_sorting_prefers_depth_and_assigns_rank()
    test_missing_amenity_evidence_is_unranked_not_zero()
    print("Phase 5 city intelligence checks passed")


if __name__ == "__main__":
    main()
