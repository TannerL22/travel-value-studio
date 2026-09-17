from __future__ import annotations

from typing import Dict, Optional

from phase3_registry import get_phase3_source_registry


def _field(
    field_name: str,
    label: str,
    source: str,
    indicator: Optional[str],
    frequency: str,
    measures: str,
    caveat: str,
    field_type: str = "observed",
    confidence: str = "medium",
) -> Dict[str, Optional[str]]:
    return {
        "field_name": field_name,
        "label": label,
        "source": source,
        "indicator": indicator,
        "frequency": frequency,
        "geographic_level": "Country",
        "field_type": field_type,
        "measures": measures,
        "caveat": caveat,
        "recommended_confidence": confidence,
    }


def get_phase4_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_phase3_source_registry()
    registry.update(
        {
            "service_depth_ttdi_2024_value": _field(
                "service_depth_ttdi_2024_value",
                "WEF Tourist Services & Infrastructure",
                "World Economic Forum, Travel & Tourism Development Index 2024",
                "Tourist Services and Infrastructure pillar: 2024 Value",
                "2024 edition; underlying inputs mostly latest available through end-2023",
                "Supply-side tourism-service capacity and productivity, including hotel-room density, short-term-rental listing density, hotel/restaurant productivity and T&T capital investment intensity.",
                "Covers 119 economies and combines public, survey, and commercial underlying sources. It is not a city-level amenity inventory.",
                confidence="medium-high",
            ),
            "service_depth_ttdi_2024_rank": _field(
                "service_depth_ttdi_2024_rank",
                "WEF Tourist Services pillar rank",
                "World Economic Forum, Travel & Tourism Development Index 2024",
                "Tourist Services and Infrastructure pillar: 2024 Rank",
                "2024 edition",
                "WEF rank for the Tourist Services and Infrastructure pillar.",
                "Ranks are only relative to economies included in the TTDI sample and are not used directly in scoring.",
                confidence="medium-high",
            ),
            "service_depth_arrivals_per_100": _field(
                "service_depth_arrivals_per_100",
                "International arrivals per 100 residents",
                "Derived from World Bank WDI arrivals and population",
                "ST.INT.ARVL / SP.POP.TOTL * 100",
                "Annual / latest available <= target year",
                "Tourism-market maturity relative to resident population, used only when direct service-supply evidence is unavailable.",
                "Arrivals measure demand/popularity rather than service supply and can be stale or methodologically inconsistent across countries.",
                field_type="derived/fallback",
                confidence="low",
            ),
            "service_depth_arrivals_fallback_score": _field(
                "service_depth_arrivals_fallback_score",
                "Arrivals maturity fallback score",
                "Derived",
                "Log-scaled arrivals per 100 residents, capped at 70/100",
                "Per ranking dataset",
                "Low-confidence fallback intended to distinguish extremely thin visitor markets from established ones when TTDI supply evidence is unavailable.",
                "The cap prevents tourism demand from being treated as proof of deep service supply.",
                field_type="derived/fallback",
                confidence="low",
            ),
            "service_depth": _field(
                "service_depth",
                "Service Depth",
                "WEF TTDI 2024 preferred; arrivals-per-capita fallback",
                "WEF Tourist Services and Infrastructure pillar normalized to 0-100",
                "2024 supply snapshot / annual fallback",
                "Production measure of how readily a visitor can convert purchasing power into accommodation and established tourism-service capacity.",
                "Country-level supply still misses restaurants, groceries, gyms, pharmacies, neighborhood density and other everyday amenities; Phase 5 adds city-level amenity evidence.",
                field_type="derived/fallback",
                confidence="medium",
            ),
            "service_depth_coverage": _field(
                "service_depth_coverage",
                "Service depth evidence coverage",
                "Derived",
                "1.0 for TTDI supply evidence; 0.45 for arrivals fallback; 0 when unavailable",
                "Per ranking dataset",
                "Confidence weight controlling how strongly Service Depth is allowed to penalize ranking.",
                "This is a model evidence-weight, not a statistical confidence interval.",
                field_type="derived",
            ),
            "service_depth_source": _field(
                "service_depth_source",
                "Service depth source",
                "Derived provenance label",
                None,
                "Per ranking dataset",
                "Identifies whether the production row uses TTDI supply evidence, arrivals-per-capita fallback, or no usable evidence.",
                "Source quality differs materially between direct TTDI coverage and fallback rows.",
                field_type="derived",
            ),
            "service_depth_penalty": _field(
                "service_depth_penalty",
                "Service depth ranking penalty",
                "Derived from Service Depth, evidence coverage and user Service Depth requirement",
                "Confidence-aware saturating shortfall penalty",
                "Per ranking request",
                "Multiplier applied only when service supply is below the user's selected requirement.",
                "This is a preference function. High service depth does not create an unlimited bonus, and missing evidence is not treated as poor service supply.",
                field_type="derived",
            ),
            "legacy_service_depth": _field(
                "legacy_service_depth",
                "Legacy arrivals-led service proxy",
                "Phase 1-3 model snapshot",
                "Legacy component_tourism_depth",
                "Legacy model",
                "Old international-arrivals-led component retained for auditability.",
                "Not used as the Phase 4 production service-depth score.",
                field_type="legacy",
                confidence="low",
            ),
        }
    )
    return registry
