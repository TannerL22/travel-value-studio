from __future__ import annotations

from typing import Any, Dict


PHASE_2_COMPONENTS: Dict[str, Dict[str, str]] = {
    "structural_purchasing_power": {
        "label": "Structural Purchasing Power",
        "status": "production",
        "measures": "Broad destination purchasing power relative to the selected origin using the existing FX/private-consumption-PPP framework.",
        "caveat": "An index, not a predicted personal, tourist, or expat daily budget.",
    },
    "fx_opportunity": {
        "label": "FX Opportunity",
        "status": "production_phase_2",
        "measures": "Bilateral destination-vs-origin currency opportunity across 1W, 1M, 3M, 1Y, and 3Y reference horizons.",
        "caveat": "This is a timing signal, not a real exchange-rate valuation model and not evidence that local prices moved one-for-one with FX.",
    },
    "basic_comfort": {
        "label": "Basic Comfort",
        "status": "temporary_proxy",
        "measures": "Current GDP-PPP comfort-floor proxy.",
        "caveat": "Will be replaced by direct water, sanitation, electricity, connectivity, and health inputs in Phase 3.",
    },
    "service_depth": {
        "label": "Service Depth",
        "status": "temporary_proxy",
        "measures": "Current tourism-depth signal, mainly international arrivals.",
        "caveat": "Will be replaced by amenity, accommodation, mobility, and service-supply measures.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_alias",
        "measures": "Current WGI-led political-stability signal.",
        "caveat": "Not a complete personal-safety or crime measure.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_2",
        "measures": "Structural value adjusted by a bounded FX-opportunity timing multiplier, then normalized to 0-100.",
        "caveat": "Basic comfort and service depth still use Phase 1 proxy inputs until later phases replace them.",
    },
}

FUTURE_COMPONENTS = [
    "structural_purchasing_power",
    "fx_opportunity",
    "basic_comfort",
    "amenity_depth",
    "mobility",
    "digital_convenience",
    "stability",
    "accommodation_depth",
    "quality_adjusted_value",
]


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_2_quality_adjusted_purchasing_power_fx_v2",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, and where is the FX timing unusually attractive right now?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Destination purchasing power, usability, and bilateral FX timing. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 2 adds a production FX-opportunity engine using 1W/1M/3M/1Y/3Y bilateral reference moves. The FX layer directly affects ranking, but its impact is capped so short-term currency moves cannot overwhelm structural value.",
        "phase_2_components": PHASE_2_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "FX Opportunity is a historical bilateral timing signal, not BIS REER/NEER and not a forecast.",
            "Reference FX rates are institutional/mid-market style rates and can differ from card or cash execution.",
            "Basic comfort still uses the legacy GDP-PPP floor rather than direct basic-services data.",
            "Service depth is still mainly arrivals-driven rather than measured amenity/service supply.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


# Backward-compatible name for any code that still imports the Phase 1 wrapper.
def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_2_methodology(legacy_methodology)
