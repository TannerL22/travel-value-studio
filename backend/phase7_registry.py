from __future__ import annotations

from typing import Dict, Optional

from phase6_registry import get_phase6_source_registry


def _field(
    field_name: str,
    label: str,
    source: str,
    indicator: Optional[str],
    frequency: str,
    geographic_level: str,
    measures: str,
    caveat: str,
    field_type: str = "derived",
    confidence: str = "medium",
) -> Dict[str, Optional[str]]:
    return {
        "field_name": field_name,
        "label": label,
        "source": source,
        "indicator": indicator,
        "frequency": frequency,
        "geographic_level": geographic_level,
        "field_type": field_type,
        "measures": measures,
        "caveat": caveat,
        "recommended_confidence": confidence,
    }


def get_phase7_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_phase6_source_registry()
    registry.update(
        {
            "structural_value_factor": _field(
                "structural_value_factor",
                "Structural Value Factor",
                "Derived from current market FX / private-consumption PPP relative to selected origin",
                "origin-relative structural_purchasing_power",
                "Per ranking request",
                "Country",
                "Direct purchasing-power factor with symmetric saturation at 1/3x to 3x and preference-controlled elasticity.",
                "This is broad household purchasing power rather than a furnished-housing or personal spending basket.",
                confidence="medium-high",
            ),
            "service_depth_penalty": _field(
                "service_depth_penalty",
                "Service Depth shortfall penalty",
                "Derived primarily from WEF TTDI Tourist Services and Infrastructure",
                "Preference-controlled bounded shortfall multiplier; maximum 45% haircut",
                "Per ranking request",
                "Country",
                "Penalty applied when observed service-depth evidence falls below the preference threshold, with evidence coverage controlling authority.",
                "WEF Tourist Services is a tourism-supply proxy rather than a comprehensive measure of every everyday consumer service, so its ranking effect is explicitly bounded.",
            ),
            "stability_penalty": _field(
                "stability_penalty",
                "Stability shortfall penalty",
                "World Bank WGI Political Stability",
                "Preference-controlled bounded shortfall multiplier; maximum 45% haircut",
                "Per ranking request",
                "Country",
                "Penalty applied only when Stability Priority is above zero and observed WGI Political Stability falls below the selected threshold.",
                "WGI is a macro political-stability signal rather than a complete traveller crime/personal-safety measure, so its ranking effect is explicitly bounded.",
            ),
            "city_usability": _field(
                "city_usability",
                "City Usability",
                "Derived from Phase 5 Amenity Depth + Phase 6 Mobility + Digital Convenience",
                "Weighted geometric composite: 60% amenity, 20% mobility, 20% digital",
                "Per city request",
                "City with country context",
                "0-100 diagnostic of how much observed amenity supply is supported by mobility and digital convenience.",
                "Amenity evidence is required; mobility and digital are still mainly country-level. It is not a global city-value ranking and does not alter country Quality-Adjusted Value.",
                confidence="medium",
            ),
            "city_usability_coverage": _field(
                "city_usability_coverage",
                "City Usability evidence coverage",
                "Derived",
                "Share of configured usability weight with available evidence",
                "Per city request",
                "City",
                "Coverage of amenity, mobility and digital inputs supporting City Usability.",
                "Coverage is input availability, not statistical confidence or source completeness.",
            ),
            "city_usability_rank_within_country": _field(
                "city_usability_rank_within_country",
                "City Usability rank within returned candidates",
                "Derived",
                "Descending city_usability",
                "Per city request",
                "City",
                "Within-country ordering among returned candidate cities with observed City Usability.",
                "Candidate coverage remains bounded and is not an exhaustive ranking of every city in the country.",
            ),
            "legacy_score_pre_phase7": _field(
                "legacy_score_pre_phase7",
                "Legacy pre-Phase-7 score",
                "Retained historical model output",
                None,
                "Per ranking request",
                "Country",
                "Audit copy of the old GDP-led prototype score before the Phase 7 rebuild.",
                "Retained for comparison only; it no longer determines production ranking or production-universe inclusion.",
                confidence="audit-only",
            ),
        }
    )
    return registry
