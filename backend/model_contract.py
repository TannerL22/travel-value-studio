from __future__ import annotations

from typing import Any, Dict


PHASE_5_COMPONENTS: Dict[str, Dict[str, str]] = {
    "structural_purchasing_power": {
        "label": "Structural Purchasing Power",
        "status": "production",
        "measures": "Broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP.",
        "caveat": "An index, not a predicted personal, tourist, or expat daily budget.",
    },
    "fx_opportunity": {
        "label": "FX Opportunity",
        "status": "production_phase_2",
        "measures": "Bilateral destination-vs-origin currency opportunity across 1W, 1M, 3M, 1Y, and 3Y reference horizons.",
        "caveat": "A timing signal, not a real-exchange-rate valuation model and not evidence that local prices moved one-for-one with FX.",
    },
    "basic_comfort": {
        "label": "Basic Comfort",
        "status": "production_phase_3",
        "measures": "Coverage-aware, saturating composite of drinking water, sanitation, electricity access, internet use and UHC service coverage.",
        "caveat": "National service indicators are not city- or neighborhood-level guarantees. The legacy GDP-PPP comfort proxy is used only when direct inputs are missing.",
    },
    "service_depth": {
        "label": "Service Depth",
        "status": "production_phase_4",
        "measures": "WEF TTDI Tourist Services and Infrastructure supply pillar where available, with a deliberately weaker arrivals-per-capita fallback outside TTDI coverage.",
        "caveat": "Country-level supply is useful for screening but cannot distinguish high-amenity cities from thin ones inside the same country.",
    },
    "amenity_depth": {
        "label": "City Amenity Depth",
        "status": "discovery_phase_5",
        "measures": "City-level density of high-confidence Overture Places across food & drink, shopping, health care, recreation/culture and lodging, normalized using GHS-WUP city population and land area.",
        "caveat": "Phase 5 is a city-discovery layer, not yet a country-ranking input. The first implementation uses a centroid-and-area bounding-box proxy rather than the exact urban-centre polygon.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_alias",
        "measures": "Current WGI-led political-stability signal.",
        "caveat": "Not a complete personal-safety or crime measure.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_4_with_phase_5_drilldown",
        "measures": "Country-level structural value after Basic Comfort and Service Depth shortfall penalties plus the bounded FX timing overlay, normalized to 0-100.",
        "caveat": "Phase 5 adds city-level drill-down without yet forcing city amenity coverage into the country ranking. Furnished housing prices and local mobility remain later inputs.",
    },
}

FUTURE_COMPONENTS = [
    "structural_purchasing_power",
    "fx_opportunity",
    "basic_comfort",
    "service_depth",
    "amenity_depth",
    "mobility",
    "digital_convenience",
    "stability",
    "accommodation_depth",
    "quality_adjusted_value",
]


def phase_5_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_5_quality_adjusted_purchasing_power_city_intelligence",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, and within an attractive country which cities actually have enough everyday amenities to make that purchasing power useful?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Country-level purchasing power, basic services, service supply, stability and bilateral FX timing, plus Phase 5 city-level amenity discovery. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 5 adds a city-intelligence drill-down on top of the Phase 4 country ranking. The canonical city universe comes from the JRC GHS-WUP-MTUC R2025A dataset that supports the UN World Urbanization Prospects 2025 framework. For each country, the backend selects major 2025 urban centres and can query the latest Overture Maps Places release for high-confidence amenity supply across food & drink, shopping, health care, recreation/culture and lodging. Amenity Depth is kept separate from the country score until city coverage and geometry are sufficiently validated.",
        "phase_5_components": PHASE_5_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "Basic Comfort remains country-level and can miss city/region differences in service quality.",
            "WEF TTDI Tourist Services and Infrastructure remains a country-level service-capacity benchmark.",
            "Phase 5 City Amenity Depth currently uses a centroid-and-land-area bounding-box proxy rather than exact GHS-WUP urban-centre polygons, so irregular or adjacent urban centres can be imperfectly counted.",
            "Overture Places coverage, deduplication and provider density can vary by geography; missing query results are treated as unknown rather than zero amenities.",
            "The city universe covers harmonized Degree-of-Urbanization urban centres rather than every legal municipality or neighborhood.",
            "Amenity Depth measures supply/density, not the price or subjective quality of each venue.",
            "Furnished medium-term housing prices and neighborhood-level rental availability are still not directly observed.",
            "Local public-transport quality and digital-performance data remain Phase 6 inputs.",
            "FX Opportunity is a historical bilateral timing signal, not BIS REER/NEER and not a forecast.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


def phase_4_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    """Backward-compatible wrapper retained for older callers."""
    return phase_5_methodology(legacy_methodology)


def phase_3_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_5_methodology(legacy_methodology)


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_5_methodology(legacy_methodology)


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_5_methodology(legacy_methodology)
