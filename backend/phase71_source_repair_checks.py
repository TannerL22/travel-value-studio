from __future__ import annotations

from io import BytesIO

import pandas as pd

from country_universe import filter_production_country_universe, is_production_country_iso3
from production_ranking import _babel_currency_map
import service_depth as sd


def test_world_bank_aggregates_are_not_destinations() -> None:
    frame = pd.DataFrame(
        [
            {"iso3": "GBR", "country": "United Kingdom"},
            {"iso3": "ASM", "country": "American Samoa"},
            {"iso3": "WLD", "country": "World"},
            {"iso3": "ECS", "country": "Europe & Central Asia"},
            {"iso3": "XKX", "country": "Kosovo"},
        ]
    )
    out = filter_production_country_universe(frame)
    assert set(out["iso3"]) == {"GBR", "ASM", "XKX"}
    assert is_production_country_iso3("TWN")
    assert not is_production_country_iso3("WLD")


def test_local_currency_mapping_covers_core_origins() -> None:
    mapping = _babel_currency_map(["GBR", "USA", "DEU", "JPN", "TWN", "XKX"])
    assert mapping["GBR"] == "GBP"
    assert mapping["USA"] == "USD"
    assert mapping["DEU"] == "EUR"
    assert mapping["JPN"] == "JPY"
    assert mapping["TWN"] == "TWD"
    assert mapping["XKX"] == "EUR"


def test_ttdi_parser_detects_metadata_rows_before_header() -> None:
    buffer = BytesIO()
    rows = [
        ["Travel & Tourism Development Index 2024", None, None],
        ["World Economic Forum", None, None],
        ["ISO Code", sd.TTDI_SERVICE_COLUMN, sd.TTDI_SERVICE_RANK_COLUMN],
        ["JPN", 5.5, 10],
        ["GBR", 4.8, 25],
    ]
    frame = pd.DataFrame(rows)
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        frame.to_excel(writer, sheet_name="Data", index=False, header=False)
    parsed = sd._parse_ttdi_service_frame(buffer.getvalue())
    assert list(parsed["iso3"]) == ["JPN", "GBR"]
    assert list(parsed["service_depth_ttdi_2024_value"]) == [5.5, 4.8]


def test_ttdi_csv_fallback_parser_shape() -> None:
    csv_text = (
        f"ISO Code,{sd.TTDI_SERVICE_COLUMN},{sd.TTDI_SERVICE_RANK_COLUMN}\n"
        "JPN,5.5,10\n"
        "GBR,4.8,25\n"
    )
    parsed = sd._parse_ttdi_service_csv(csv_text)
    assert list(parsed["iso3"]) == ["JPN", "GBR"]
    assert list(parsed["service_depth_ttdi_2024_rank"]) == [10, 25]


def main() -> None:
    test_world_bank_aggregates_are_not_destinations()
    test_local_currency_mapping_covers_core_origins()
    test_ttdi_parser_detects_metadata_rows_before_header()
    test_ttdi_csv_fallback_parser_shape()
    print("Phase 7.1 source repair checks passed")


if __name__ == "__main__":
    main()
