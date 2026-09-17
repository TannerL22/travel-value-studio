from __future__ import annotations

from io import BytesIO

import pandas as pd

import mobility_digital as md


def test_ttdi_parser_and_scale() -> None:
    workbook = BytesIO()
    frame = pd.DataFrame(
        {
            "ISO Code": ["GBR", "JPN"],
            md.WEF_GROUND_COLUMN: [5.8, 6.1],
            md.WEF_ICT_COLUMN: [6.2, 6.0],
        }
    )
    with pd.ExcelWriter(workbook, engine="openpyxl") as writer:
        frame.to_excel(writer, sheet_name="Data", index=False)
    parsed = md._parse_ttdi_phase6(workbook.getvalue())
    assert list(parsed["iso3"]) == ["GBR", "JPN"]
    assert md._ttdi_to_100(1.0) == 0.0
    assert md._ttdi_to_100(7.0) == 100.0


def test_findex_parser_prefers_2024() -> None:
    csv_data = (
        "Economy Code,Year,g20_t\n"
        "GBR,2021,90\n"
        "GBR,2024,97\n"
        "JPN,2024,93\n"
    ).encode("utf-8")
    parsed = md._parse_findex_csv(csv_data).set_index("iso3")
    assert parsed.loc["GBR", "digital_payments_pct"] == 97
    assert parsed.loc["JPN", "digital_payments_year"] == 2024


def test_mobility_catalog_and_positive_gtfs_evidence() -> None:
    raw = pd.DataFrame(
        {
            "id": ["mdb-1", "mdb-2"],
            "data_type": ["gtfs", "gtfs"],
            "status": ["active", "inactive"],
            "is_official": [True, True],
            "location.country_code": ["GB", "GB"],
            "location.municipality": ["London", "Elsewhere"],
            "provider": ["Transport A", "Transport B"],
            "location.bounding_box.minimum_latitude": [51.0, 40.0],
            "location.bounding_box.maximum_latitude": [52.0, 41.0],
            "location.bounding_box.minimum_longitude": [-1.0, -1.0],
            "location.bounding_box.maximum_longitude": [1.0, 1.0],
        }
    )
    catalog = md._canonicalize_mobility_catalog(raw)
    city = {"city_name": "London", "lat": 51.5, "lon": -0.1}
    evidence = md.city_gtfs_evidence(city, catalog, "GBR")
    assert evidence["mobility_gtfs_evidence"] == "positive_catalog_evidence"
    assert evidence["mobility_gtfs_feed_count"] == 1
    assert evidence["mobility_gtfs_official_feed_count"] == 1


def test_absent_gtfs_is_unknown_not_zero_mobility() -> None:
    raw = pd.DataFrame(
        {
            "id": ["mdb-1"],
            "data_type": ["gtfs"],
            "status": ["active"],
            "is_official": [True],
            "location.country_code": ["GB"],
            "location.municipality": ["London"],
            "provider": ["Transport A"],
            "location.bounding_box.minimum_latitude": [51.0],
            "location.bounding_box.maximum_latitude": [52.0],
            "location.bounding_box.minimum_longitude": [-1.0],
            "location.bounding_box.maximum_longitude": [1.0],
        }
    )
    catalog = md._canonicalize_mobility_catalog(raw)
    city = {"city_name": "Manchester", "lat": 53.48, "lon": -2.24}
    evidence = md.city_gtfs_evidence(city, catalog, "GBR")
    assert evidence["mobility_gtfs_feed_count"] == 0
    assert evidence["mobility_gtfs_evidence"] == "no_catalog_match_unknown_not_zero"


def test_digital_composite_is_coverage_aware() -> None:
    original_ttdi = md._fetch_ttdi_phase6
    original_wdi = md._fetch_wdi_latest
    original_findex = md._fetch_findex
    try:
        md._fetch_ttdi_phase6 = lambda: (
            pd.DataFrame([{"iso3": "AAA", "mobility_ttdi_2024_value": 5.2, "digital_ttdi_ict_2024_value": 5.5}]),
            "",
        )

        def fake_wdi(indicator: str, target_year: int, field_name: str):
            value = 90.0 if field_name == "digital_internet_users_pct" else 25.0
            return pd.DataFrame([{"iso3": "AAA", field_name: value, f"{field_name}_year": 2025}]), ""

        md._fetch_wdi_latest = fake_wdi
        md._fetch_findex = lambda: (
            pd.DataFrame([{"iso3": "AAA", "digital_payments_pct": 85.0, "digital_payments_year": 2024}]),
            "",
        )
        md._COUNTRY_CACHE.clear()
        frame, warning = md.fetch_phase6_country_frame(2025, force_refresh=True)
        row = frame.iloc[0]
        assert warning == ""
        assert row["mobility"] is not None
        assert 0 < row["digital_convenience"] <= 100
        assert row["digital_convenience_coverage"] == 1.0
    finally:
        md._fetch_ttdi_phase6 = original_ttdi
        md._fetch_wdi_latest = original_wdi
        md._fetch_findex = original_findex
        md._COUNTRY_CACHE.clear()


def test_city_enrichment_does_not_create_ranking_fields() -> None:
    original_country = md.fetch_phase6_country_frame
    original_catalog = md.fetch_mobility_catalog
    try:
        md.fetch_phase6_country_frame = lambda target_year=2025, force_refresh=False: (
            pd.DataFrame([{"iso3": "GBR", "mobility": 80.0, "mobility_source": "test", "mobility_coverage": 1.0, "digital_convenience": 90.0, "digital_convenience_coverage": 1.0, "digital_convenience_source": "test"}]),
            "",
        )
        md.fetch_mobility_catalog = lambda force_refresh=False: (pd.DataFrame(), "test unavailable")
        cities, meta = md.enrich_cities_phase6([{"city_name": "London", "lat": 51.5, "lon": -0.1}], "GBR")
        assert cities[0]["mobility"] == 80.0
        assert cities[0]["digital_convenience"] == 90.0
        assert "score" not in cities[0]
        assert meta["phase6_scores_affect_country_ranking"] is False
        assert meta["phase6_scores_affect_city_amenity_rank"] is False
    finally:
        md.fetch_phase6_country_frame = original_country
        md.fetch_mobility_catalog = original_catalog


def main() -> None:
    test_ttdi_parser_and_scale()
    test_findex_parser_prefers_2024()
    test_mobility_catalog_and_positive_gtfs_evidence()
    test_absent_gtfs_is_unknown_not_zero_mobility()
    test_digital_composite_is_coverage_aware()
    test_city_enrichment_does_not_create_ranking_fields()
    print("Phase 6 mobility/digital checks passed")


if __name__ == "__main__":
    main()
