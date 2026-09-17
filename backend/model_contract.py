from __future__ import annotations

from typing import Any, Dict


PHASE_1_COMPONENTS: Dict[str, Dict[str, str]] = {
    "structural_purchasing_power": {
        "label": "Structural Purchasing Power",
        "status": "production_alias",
        "measures": "Broad destination purchasing power relative to the selected origin using the existing FX/private-consumption-PPP framework.",
        "caveat": "An index, not a predicted personal, tourist, or expat daily budget.",
    },
    "fx_opportunity": {
        "label": "FX Opportunity",
        "status": "production_alias_pending_phase_2",
        "measures": "Current origin-aware historical FX tailwind where available.",
        "caveat": "Phase 1 retains the existing 1Y/3Y signal and does not yet make it a direct ranking multiplier.",
    },
    "basic_comfort": {
        "label": "Basic Comfort",
        "status": "temporary_proxy",
        "measures": "Current GDP-PPP comfort-floor proxy.",
        "caveat": "Will be replaced by direct water, sanitation, electricity, connectivity, and health inputs.",
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
        "status": "production_alias",
        "measures": "The current normalized production score under Phase 1 semantics.",
        "caveat": "Phase 1 changes semantics and outputs, not the underlying ranking formula.",
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


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_1_quality_adjusted_purchasing_power",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Destination purchasing power and usability. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 1 relabels and exposes the current model accurately without redesigning the production ranking formula.",
        "phase_1_components": PHASE_1_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "Basic comfort still uses the legacy GDP-PPP floor rather than direct basic-services data.",
            "Service depth is still mainly arrivals-driven rather than measured amenity/service supply.",
            "Origin-aware FX is displayed but does not yet directly reorder the production score.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }
