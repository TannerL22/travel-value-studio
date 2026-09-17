from __future__ import annotations

from typing import Any, Dict


PHASE_4_COMPONENTS: Dict[str, Dict[str, str]] = {
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
        "caveat": "The country-level supply score still does not directly inventory restaurants, groceries, gyms, pharmacies or neighborhood-level amenities. Phase 5 adds city-level amenity evidence.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_alias",
        "measures": "Current WGI-led political-stability signal.",
        "caveat": "Not a complete personal-safety or crime measure.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_4",
        "measures": "Structural value after Basic Comfort and Service Depth shortfall penalties plus the bounded FX timing overlay, normalized to 0-100.",
        "caveat": "Accommodation pricing, city-level amenity density and local mobility are not yet directly priced/measured in the production score.",
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


def phase_4_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_4_quality_adjusted_purchasing_power_service_depth",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, with enough basic services and destination-service capacity to actually enjoy the purchasing-power advantage?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Destination purchasing power, basic-service usability, destination-service supply, stability and bilateral FX timing. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 4 replaces international-arrivals volume as the production Service Depth signal. WEF TTDI 2024 Tourist Services and Infrastructure is the preferred country-level supply measure; arrivals per resident survive only as a capped, low-confidence fallback outside TTDI coverage. Service Depth is objective and independent of the user's slider; the slider only controls a confidence-aware shortfall penalty. Phase 3 Basic Comfort and Phase 2 FX Opportunity remain downstream production layers.",
        "phase_4_components": PHASE_4_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "Basic Comfort is country-level and can miss large city/region differences in service quality.",
            "WEF TTDI Tourist Services and Infrastructure is a 2024 country-level supply benchmark covering 119 economies, not a live city amenity inventory.",
            "TTDI combines public, survey and commercial underlying data; its component score is useful for breadth but less granular than direct city-level source counts.",
            "Outside TTDI coverage, arrivals per resident are only a low-confidence maturity fallback and cannot prove service supply; fallback influence is explicitly reduced.",
            "Service Depth does not yet directly measure furnished housing availability/prices, restaurants, supermarkets, gyms, pharmacies, entertainment or neighborhood density.",
            "FX Opportunity is a historical bilateral timing signal, not BIS REER/NEER and not a forecast.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


def phase_3_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    """Backward-compatible wrapper retained for older callers."""
    return phase_4_methodology(legacy_methodology)


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_4_methodology(legacy_methodology)


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_4_methodology(legacy_methodology)
