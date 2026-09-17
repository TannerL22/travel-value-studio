from __future__ import annotations

from typing import Any, Dict


PHASE_3_COMPONENTS: Dict[str, Dict[str, str]] = {
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
        "status": "production_phase_3",
        "measures": "Coverage-aware, saturating composite of drinking water, sanitation, electricity access, internet use and UHC service coverage.",
        "caveat": "National service indicators are not city- or neighborhood-level guarantees. The legacy GDP-PPP comfort proxy is used only when direct inputs are missing.",
    },
    "service_depth": {
        "label": "Service Depth",
        "status": "temporary_proxy",
        "measures": "Current tourism-depth signal, mainly international arrivals.",
        "caveat": "Will be replaced by amenity, accommodation, mobility, and service-supply measures in Phase 4 and later.",
    },
    "stability": {
        "label": "Stability",
        "status": "production_alias",
        "measures": "Current WGI-led political-stability signal.",
        "caveat": "Not a complete personal-safety or crime measure.",
    },
    "quality_adjusted_value": {
        "label": "Quality-Adjusted Value",
        "status": "production_phase_3",
        "measures": "Structural value after the Phase 3 Basic Comfort penalty and bounded Phase 2 FX timing overlay, normalized to 0-100.",
        "caveat": "Service depth remains an arrivals-led proxy until Phase 4 replaces it with direct supply/amenity evidence.",
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


def phase_3_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model_contract": "phase_3_quality_adjusted_purchasing_power_basic_comfort",
        "product_question": "Where does the foreign currency I hold buy the most usable quality of day-to-day life, without mistaking poor basic living conditions for value?",
        "target_user": "A globally mobile person holding or earning in a foreign currency and considering a stay of several weeks to several months.",
        "scope": "Destination purchasing power, basic-service usability, stability and bilateral FX timing. Airfare and travel time are outside scope.",
        "current_model_status": "Phase 3 replaces the production GDP-PPP comfort floor with direct basic-service evidence across water, sanitation, electricity, internet and health. Each pillar saturates after a strong modern baseline; missing direct data blends toward the legacy GDP proxy instead of being treated as bad living conditions. Phase 2 FX timing remains a bounded downstream overlay.",
        "phase_3_components": PHASE_3_COMPONENTS,
        "future_component_contract": FUTURE_COMPONENTS,
        "known_limitations": [
            "Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.",
            "Basic Comfort is country-level and can miss large city/region differences in service quality.",
            "Electricity access does not measure outage frequency or reliability; internet use does not measure speed or latency.",
            "UHC service coverage is a national health-system measure, not traveller-specific access or private-hospital quality.",
            "Countries with incomplete Phase 3 data partly fall back to the legacy GDP-PPP comfort proxy; coverage and flags are exposed.",
            "FX Opportunity is a historical bilateral timing signal, not BIS REER/NEER and not a forecast.",
            "Service depth is still mainly arrivals-driven rather than measured amenity/service supply.",
            "WGI political stability is not a complete personal-safety or crime measure.",
        ],
        "legacy_methodology": legacy_methodology,
    }


def phase_2_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    """Backward-compatible wrapper retained for older callers."""
    return phase_3_methodology(legacy_methodology)


def phase_1_methodology(legacy_methodology: Dict[str, Any]) -> Dict[str, Any]:
    return phase_3_methodology(legacy_methodology)
