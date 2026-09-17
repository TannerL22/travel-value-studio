from __future__ import annotations

from typing import Dict, Optional

from phase2_registry import get_phase2_source_registry


def _field(
    field_name: str,
    label: str,
    source: str,
    indicator: Optional[str],
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
        "frequency": "Annual / latest available <= target year",
        "geographic_level": "Country",
        "field_type": field_type,
        "measures": measures,
        "caveat": caveat,
        "recommended_confidence": confidence,
    }


def get_phase3_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_phase2_source_registry()
    registry.update(
        {
            "comfort_water_safe_pct": _field(
                "comfort_water_safe_pct",
                "Safely managed drinking water",
                "World Bank WDI; underlying WHO/UNICEF JMP",
                "SH.H2O.SMDW.ZS",
                "Share of people using an improved drinking-water source that is on premises, available when needed, and free from priority contamination.",
                "Country averages can hide urban/rural differences; missing data do not imply unsafe water.",
                confidence="high",
            ),
            "comfort_water_basic_pct": _field(
                "comfort_water_basic_pct",
                "At least basic drinking water",
                "World Bank WDI; underlying WHO/UNICEF JMP",
                "SH.H2O.BASW.ZS",
                "Fallback share of people using at least basic drinking-water services.",
                "Basic access is weaker evidence than safely managed water and is explicitly down-weighted/capped when used as a fallback.",
                field_type="observed/fallback",
            ),
            "comfort_sanitation_safe_pct": _field(
                "comfort_sanitation_safe_pct",
                "Safely managed sanitation",
                "World Bank WDI; underlying WHO/UNICEF JMP",
                "SH.STA.SMSS.ZS",
                "Share of people using improved sanitation where excreta are safely disposed of or treated.",
                "Country averages can hide neighborhood-level differences and do not directly measure cleanliness of specific accommodation.",
                confidence="high",
            ),
            "comfort_sanitation_basic_pct": _field(
                "comfort_sanitation_basic_pct",
                "At least basic sanitation",
                "World Bank WDI; underlying WHO/UNICEF JMP",
                "SH.STA.BASS.ZS",
                "Fallback share of people using at least basic improved sanitation not shared with other households.",
                "Basic sanitation is weaker evidence than safely managed sanitation and is explicitly down-weighted/capped when used as a fallback.",
                field_type="observed/fallback",
            ),
            "comfort_electricity_pct": _field(
                "comfort_electricity_pct",
                "Electricity access",
                "World Bank WDI / Tracking SDG7",
                "EG.ELC.ACCS.ZS",
                "Share of population with access to electricity.",
                "Access does not measure outage frequency or grid reliability, so this is primarily a basic-service floor.",
                confidence="high",
            ),
            "comfort_internet_pct": _field(
                "comfort_internet_pct",
                "Internet use",
                "World Bank WDI; underlying ITU World Telecommunication/ICT Indicators",
                "IT.NET.USER.ZS",
                "Share of population that used the internet recently; proxy for practical digital connectivity.",
                "Does not measure speed, latency, reliability, affordability, or city-level coverage.",
            ),
            "comfort_uhc_index": _field(
                "comfort_uhc_index",
                "UHC service coverage",
                "World Bank WDI; underlying WHO Global Health Observatory",
                "SH.UHC.SRVS.CV.XD",
                "0-100 coverage index for essential health services and service capacity/access.",
                "Measures national health-system coverage, not traveller insurance, private-hospital quality, or emergency access in a specific city.",
            ),
            "basic_comfort_direct": _field(
                "basic_comfort_direct",
                "Direct basic comfort score",
                "Derived from Phase 3 service pillars",
                "Weighted geometric composite",
                "Saturating 0-100 composite of water, sanitation, electricity, internet and health service pillars.",
                "Thresholds and weights are transparent model choices, not an official index.",
                field_type="derived",
            ),
            "basic_comfort_coverage": _field(
                "basic_comfort_coverage",
                "Basic comfort data coverage",
                "Derived",
                "Reliability-weighted share of configured pillar weights",
                "How much of the Phase 3 comfort composite is supported by direct service data.",
                "Coverage measures configured input availability, not the accuracy of every underlying national statistic.",
                field_type="derived",
            ),
            "basic_comfort": _field(
                "basic_comfort",
                "Basic Comfort",
                "Derived Phase 3 composite",
                "Coverage-weighted direct services + legacy GDP-PPP fallback",
                "Production comfort score used to determine whether cheapness can plausibly translate into a modern basic standard of daily life.",
                "National averages remain imperfect for city-level stays; GDP PPP is retained only as a missing-data fallback.",
                field_type="derived/fallback",
            ),
            "basic_comfort_penalty": _field(
                "basic_comfort_penalty",
                "Comfort ranking penalty",
                "Derived from Basic Comfort and user comfort requirement",
                "Saturating threshold penalty",
                "Multiplier applied to the structural score when a destination falls below the user's selected comfort requirement.",
                "This is a preference function; it is not a claim that one universal comfort threshold is objectively correct.",
                field_type="derived",
            ),
        }
    )
    return registry
