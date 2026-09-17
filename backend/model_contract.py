from __future__ import annotations

from typing import Any, Dict


PHASE_7_COMPONENTS: Dict[str, Dict[str, str]] = {
    "structural_purchasing_power": {
        "label": "Structural Purchasing Power",
        "status": "production_phase_7",
        "measures": "Broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP.",
        "caveat": "An index, not a predicted personal, tourist, furnished-rental, or expat daily budget.",
    },
    "fx_opportunity": {
        "label": "FX Opportunity",
        "status": "production_phase_2",
        "measures": "Bilateral destination-vs-origin currency opportunity across 1W, 1M, 3M, 1Y and 3Y reference horizons.",
        "caveat": "A bounded historical timing overlay, not an exchange-rate forecast.",
    },
    "basic_comfort": {
        "label": "Basic Comfort",
        "status": "production_phase_3",
        "measures": "Coverage-aware, saturating composite of water, sanitation, electricity, internet use and UHC service coverage.",
        "caveat": "National service indicators are not city-level guarantees; GDP PPP is fallback-only.",
    },
    "service_depth": {
        "label": "Service Depth",
        "status": "production_phase_4",
        "measures": "WEF TTDI Tourist Services and Infrastructure supply evidence with a weaker arrivals-per-capita fallback.",
        "caveat": "Country-level service capacity cannot distinguish cities inside the same country.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_phase_7_penalty",
        "measures": "WGI-led political-stability signal applied as a preference-controlled shortfall penalty.",
        "caveat": "Priority zero is exactly neutral. WGI is not a complete personal-safety or crime measure.",
    },
    "amenity_depth": {
        "label": "City Amenity Depth",
        "status": "city_phase_5",
        "measures": "City density/diversity of Overture Places using GHS-WUP population and area.",
        "caveat": "Measures observed supply, not price or venue quality.",
    },
    "mobility": {
        "label": "Mobility",
        "status": "city_context_phase_6",
        "measures": "WEF Ground and Port Infrastructure baseline plus positive MobilityDatabase GTFS evidence.",
        "caveat": "Mostly country-level; no GTFS match is unknown rather than poor transit.",
    },
    "digital_convenience": {
        "label": "Digital Convenience",
        "status": "city_context_phase_6",
        "measures": "Internet use, fixed broadband, digital payments and WEF ICT readiness.",
        "caveat": "Mostly country-level and not traveller-specific.",
    },
    "city_usability": {
        "label": "City Usability",
        "status": "diagnostic_phase_7",
        "measures": "Coverage-aware 60% Amenity Depth / 20% Mobility / 20% Digital Convenience geometric composite.",
        "caveat": "Requires city amenity evidence and does not alter country Quality-Adjusted Value or claim a global city ranking.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_7",
        "measures": "Direct origin-relative purchasing-power factor after Basic Comfort, Service Depth and Stability shortfall penalties plus bounded FX timing.",
        "caveat": "Normalized within the current country universe; medium-term housing remains a major unobserved cost.",
    },
}

FUTURE_COMPONENTS = [
    "structural_purchasing_power", "fx_opportunity", "basic_comfort", "service_depth",
    "amenity_depth", "mobility", "digital_convenience", "city_usability", "stability",
    "accommodation_depth", "quality_adjusted_value",
]


def phase_7_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_7_rebuilt_country_value_city_usability",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, and which cities inside attractive countries convert that value into dense, accessible, digitally convenient living?",
        "target_user": "A globally mobile foreign-currency holder considering a stay of several weeks to several months.",
        "scope": "Country-level purchasing power, comfort, service depth, stability and FX timing plus city-level amenity/usability diagnostics. Airfare and travel time remain outside scope.",
        "current_model_status": "Phase 7 replaces the original GDP-led production score with a direct origin-relative private-consumption purchasing-power factor. Cheapness is symmetrically saturated, Basic Comfort/Service Depth/Stability are explicit preference-controlled shortfall penalties, Stability priority zero is exactly neutral, and the bounded FX timing overlay remains final. Phase 7 also adds City Usability from Amenity Depth, Mobility and Digital Convenience while preserving the two-stage country-screen then city-drill-down architecture.",
        "phase_7_components": PHASE_7_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP does not directly observe furnished medium-term rents, which may be the largest missing cost for a multi-month stay.",
            "Quality-Adjusted Value is normalized to the current country universe and should be interpreted comparatively rather than as an absolute utility number.",
            "Basic Comfort, Service Depth, Mobility and Digital Convenience remain mostly country-level and can miss large city/regional variation.",
            "City Amenity Depth still uses a proxy footprint and Overture coverage varies geographically.",
            "The city candidate pool is bounded rather than exhaustive, so hidden-gem smaller cities can still be missed.",
            "City Usability inherits national Mobility/Digital context; it is not yet a city-specific transit-frequency or payment-acceptance model.",
            "No MobilityDatabase feed match is interpreted as unknown rather than no transit.",
            "FX Opportunity is historical timing evidence, not a forecast.",
            "WGI political stability is not a complete personal-safety/crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


def phase_6_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)


def phase_5_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)


def phase_4_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)


def phase_3_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_7_methodology(legacy_methodology)
