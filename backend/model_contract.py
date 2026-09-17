from __future__ import annotations

from typing import Any, Dict


PHASE_6_COMPONENTS: Dict[str, Dict[str, str]] = {
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
        "caveat": "National service indicators are not city- or neighborhood-level guarantees. GDP PPP is fallback-only when direct inputs are missing.",
    },
    "service_depth": {
        "label": "Service Depth",
        "status": "production_phase_4",
        "measures": "WEF TTDI Tourist Services and Infrastructure supply pillar where available, with a weaker arrivals-per-capita fallback outside TTDI coverage.",
        "caveat": "Country-level service capacity cannot distinguish high-amenity cities from thin ones inside the same country.",
    },
    "amenity_depth": {
        "label": "City Amenity Depth",
        "status": "discovery_phase_5",
        "measures": "City-level density and diversity of high-confidence Overture Places using GHS-WUP population and land area.",
        "caveat": "A discovery signal using a proxy footprint; it does not measure venue price, quality or accessibility.",
    },
    "mobility": {
        "label": "Mobility",
        "status": "diagnostic_phase_6",
        "measures": "WEF TTDI Ground and Port Infrastructure baseline, including train/public-transport efficiency, plus positive city-level GTFS metadata from MobilityDatabase.",
        "caveat": "Country-level TTDI is not a city transit-service score. Absence of an open GTFS feed is treated as unknown, never as evidence of poor transit.",
    },
    "digital_convenience": {
        "label": "Digital Convenience",
        "status": "diagnostic_phase_6",
        "measures": "Coverage-aware composite of internet use, fixed-broadband penetration, 2024 Global Findex digital-payment use and WEF TTDI ICT readiness.",
        "caveat": "Country-level readiness does not guarantee apartment Wi-Fi quality, visitor eSIM ease or acceptance of a specific foreign payment method.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_alias",
        "measures": "Current WGI-led political-stability signal.",
        "caveat": "Not a complete personal-safety or crime measure.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_4_with_phase_5_6_drilldown",
        "measures": "Country-level structural value after Basic Comfort and Service Depth shortfall penalties plus bounded FX timing, normalized to 0-100.",
        "caveat": "Phase 5/6 city amenity, mobility and digital evidence remain drill-down diagnostics until Phase 7 validation and ranking rebuild.",
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


def phase_6_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_6_quality_adjusted_purchasing_power_mobility_digital",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, and within attractive countries which cities combine dense amenities with practical mobility and low digital friction?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Country-level purchasing power, basic services, service supply, stability and FX timing, plus city-level amenity discovery and Phase 6 mobility/digital usability diagnostics. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 6 adds Mobility and Digital Convenience to the city drill-down without changing production country rankings. Mobility uses WEF TTDI Ground and Port Infrastructure as the comparable baseline and MobilityDatabase GTFS metadata as positive city-level open-transit evidence; no feed match is unknown, not zero. Digital Convenience blends current ITU/WDI connectivity, Global Findex 2025 digital-payment usage from the 2024 survey and WEF TTDI ICT readiness. These diagnostics remain outside ranking weights until Phase 7 validation.",
        "phase_6_components": PHASE_6_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "Basic Comfort remains country-level and can miss city/region differences in service quality.",
            "WEF TTDI Tourist Services and Infrastructure remains a country-level service-capacity benchmark.",
            "City Amenity Depth uses an equivalent-area circle around the GHS-WUP centroid rather than the exact urban-centre polygon.",
            "Overture Places coverage and provider density vary by geography; missing results are unknown rather than zero amenities.",
            "The Phase 5 candidate pool is population-led and does not exhaustively query every >=50k city.",
            "Phase 6 Mobility is still anchored to a country-level WEF benchmark; GTFS catalog matches show open schedule-data availability, not service quality or frequency.",
            "A missing MobilityDatabase GTFS match is never interpreted as no public transport because open-data practices differ across markets.",
            "Digital Convenience is country-level and cannot guarantee local Wi-Fi speed, eSIM availability, app localization or acceptance of a visitor's specific card/wallet.",
            "Global Findex 2025 digital-payment data describe adults surveyed in 2024, not visitor-specific payment acceptance.",
            "Furnished medium-term housing prices and neighborhood-level rental availability are still not directly observed.",
            "Phase 5/6 diagnostics do not alter the production country ranking before the Phase 7 ranking rebuild and validation.",
            "FX Opportunity is a historical bilateral timing signal, not BIS REER/NEER and not a forecast.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


def phase_5_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_6_methodology(legacy_methodology)


def phase_4_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_6_methodology(legacy_methodology)


def phase_3_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_6_methodology(legacy_methodology)


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_6_methodology(legacy_methodology)


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_6_methodology(legacy_methodology)
