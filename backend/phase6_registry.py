from __future__ import annotations

from typing import Dict, Optional

from phase5_registry import get_phase5_source_registry


def _field(
    field_name: str,
    label: str,
    source: str,
    indicator: Optional[str],
    frequency: str,
    geographic_level: str,
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
        "geographic_level": geographic_level,
        "field_type": field_type,
        "measures": measures,
        "caveat": caveat,
        "recommended_confidence": confidence,
    }


def get_phase6_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_phase5_source_registry()
    registry.update(
        {
            "mobility": _field(
                "mobility",
                "Mobility",
                "WEF Travel & Tourism Development Index 2024",
                "Ground and Port Infrastructure pillar",
                "2024 edition; underlying data mainly 2022–2023",
                "Country",
                "0-100 rescaling of WEF's ground/port infrastructure pillar, which includes train-service efficiency and public-transport efficiency alongside road, rail and port infrastructure.",
                "Country-level benchmark: it does not directly measure travel times, station access or service frequency in a specific city.",
                field_type="derived from observed composite",
                confidence="medium-high",
            ),
            "mobility_gtfs_feed_count": _field(
                "mobility_gtfs_feed_count",
                "Matched active GTFS feeds",
                "MobilityDatabase feeds_v2 catalog",
                "Active GTFS schedule feeds whose municipality or feed bounding box matches the city",
                "Catalog refreshed by MobilityData; fetched daily by the app",
                "City / transit feed",
                "Positive evidence that machine-readable scheduled public-transport data exist for the city.",
                "Feed presence is not a transit-quality score. No catalog match is treated as unknown rather than evidence that the city lacks public transport.",
                field_type="observed metadata",
                confidence="medium",
            ),
            "mobility_gtfs_official_feed_count": _field(
                "mobility_gtfs_official_feed_count",
                "Matched official GTFS feeds",
                "MobilityDatabase",
                "is_official",
                "Current catalog snapshot",
                "City / transit feed",
                "Count of matched GTFS schedule feeds flagged as official agency sources.",
                "Open-data practices vary sharply across countries, so this is provenance evidence rather than a quality ranking.",
                field_type="observed metadata",
            ),
            "digital_convenience": _field(
                "digital_convenience",
                "Digital Convenience",
                "ITU/World Bank WDI + Global Findex 2025 + WEF TTDI 2024",
                "Coverage-aware composite",
                "Latest available <= target year; Findex survey year 2024; TTDI 2024",
                "Country",
                "0-100 composite of internet use, fixed-broadband penetration, digital-payment use and TTDI ICT readiness.",
                "Country-level digital readiness does not guarantee fast Wi-Fi in a particular apartment or seamless acceptance of every foreign payment method.",
                field_type="derived",
                confidence="medium-high",
            ),
            "digital_payments_pct": _field(
                "digital_payments_pct",
                "Adults making or receiving digital payments",
                "World Bank Global Findex 2025",
                "g20_t",
                "2024 survey",
                "Country",
                "Share of adults age 15+ who made or received a digital payment in the past year.",
                "National adult usage is a practical payments-environment proxy, not a guarantee that a visitor's specific card or wallet is accepted.",
                confidence="high",
            ),
            "digital_internet_users_pct": _field(
                "digital_internet_users_pct",
                "Individuals using the internet",
                "World Bank WDI; underlying ITU",
                "IT.NET.USER.ZS",
                "Annual / latest available <= target year",
                "Country",
                "Share of individuals using the internet.",
                "Does not directly measure speed, latency, reliability or accommodation-level Wi-Fi quality.",
                confidence="high",
            ),
            "digital_fixed_broadband_per_100": _field(
                "digital_fixed_broadband_per_100",
                "Fixed broadband subscriptions",
                "World Bank WDI; underlying ITU",
                "IT.NET.BBND.P2",
                "Annual / latest available <= target year",
                "Country",
                "Fixed broadband subscriptions per 100 people as a proxy for mature household connectivity infrastructure.",
                "Subscriptions are shared within households and are not a direct measure of connection speed.",
                confidence="high",
            ),
            "digital_convenience_coverage": _field(
                "digital_convenience_coverage",
                "Digital Convenience evidence coverage",
                "Derived",
                "Configured weight supported by usable inputs",
                "Per request",
                "Country",
                "Share of the Digital Convenience model weight supported by available evidence.",
                "Coverage measures input availability, not statistical certainty.",
                field_type="derived",
            ),
        }
    )
    return registry
