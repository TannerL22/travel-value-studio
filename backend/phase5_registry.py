from __future__ import annotations

from typing import Dict, Optional

from phase4_registry import get_phase4_source_registry


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


def get_phase5_source_registry() -> Dict[str, Dict[str, Optional[str]]]:
    registry = get_phase4_source_registry()
    registry.update(
        {
            "city_id": _field(
                "city_id",
                "Stable urban-centre ID",
                "European Commission JRC GHS-WUP-MTUC R2025A V1.1",
                "ID_UC_G0",
                "2025 urban-centre cohort",
                "City / urban centre",
                "Stable identifier for a harmonized Degree-of-Urbanization urban centre.",
                "Represents a harmonized urban centre, not an administrative municipality boundary.",
                confidence="high",
            ),
            "city_name": _field(
                "city_name",
                "Urban-centre name",
                "European Commission JRC GHS-WUP-MTUC R2025A / UN WUP 2025 framework",
                "Main urban-centre name",
                "2025",
                "City / urban centre",
                "Canonical label for the urban centre used in the city-discovery layer.",
                "Urban-centre naming can differ from municipal or metropolitan naming conventions.",
                confidence="high",
            ),
            "population": _field(
                "population",
                "City population",
                "European Commission JRC GHS-WUP-MTUC R2025A / UN WUP 2025",
                "POP",
                "2025",
                "City / urban centre",
                "Population within the harmonized urban-centre footprint.",
                "This is a Degree-of-Urbanization city population, not necessarily the legal municipality population.",
                confidence="high",
            ),
            "area_km2": _field(
                "area_km2",
                "City land area",
                "European Commission JRC GHS-WUP-MTUC R2025A",
                "AREA_km2",
                "2025",
                "City / urban centre",
                "Land area of the harmonized urban-centre footprint in square kilometres.",
                "The Phase 5 Overture query currently approximates the footprint from this area and the population-weighted centroid rather than using the exact polygon.",
                confidence="high",
            ),
            "built_up_km2": _field(
                "built_up_km2",
                "City built-up area",
                "European Commission JRC GHS-WUP-MTUC R2025A",
                "BU_km2",
                "2025",
                "City / urban centre",
                "Built-up surface within the harmonized urban centre.",
                "Built-up area measures physical development, not amenity quality or accessibility.",
                confidence="high",
            ),
            "amenity_depth": _field(
                "amenity_depth",
                "City Amenity Depth",
                "Derived from Overture Maps Places",
                "High-confidence POI density across taxonomy branches",
                "Latest available Overture release; cached per city",
                "City / urban centre",
                "0-100 city discovery score combining per-capita and spatial density of food & drink, shopping, health care, recreation/culture and lodging.",
                "Phase 5 uses a centroid-and-area bounding-box proxy rather than exact urban-centre polygons, and Overture POI coverage varies by geography. This is not yet part of the country ranking.",
                field_type="derived",
                confidence="medium",
            ),
            "amenity_total_per_10k": _field(
                "amenity_total_per_10k",
                "High-confidence POIs per 10,000 residents",
                "Derived from Overture Maps Places + GHS-WUP population",
                "POI count / population * 10,000",
                "Latest Overture / 2025 population denominator",
                "City / urban centre",
                "Broad amenity intensity relative to city population.",
                "Provider coverage and duplicate-resolution quality can differ across countries; use with the category mix and source flags.",
                field_type="derived",
                confidence="medium",
            ),
            "amenity_source": _field(
                "amenity_source",
                "Amenity source",
                "Overture Maps Places",
                "Latest STAC release",
                "Monthly release cadence",
                "City / urban centre",
                "Provenance label for the city amenity inventory.",
                "A failed Overture query leaves amenity fields unavailable rather than assuming the city has no amenities.",
                field_type="derived",
            ),
            "amenity_footprint_method": _field(
                "amenity_footprint_method",
                "Amenity query footprint",
                "Derived from GHS-WUP centroid and land area",
                "centroid_area_bbox_proxy",
                "Per city query",
                "City / urban centre",
                "Method used to spatially bound Overture place counts.",
                "The current bounding-box proxy can include adjacent areas or miss irregular edges; exact GHS-WUP polygons are a planned precision upgrade.",
                field_type="derived",
                confidence="medium-low",
            ),
        }
    )
    return registry
