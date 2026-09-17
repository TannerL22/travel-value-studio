# Travel Value Studio — Phase 5 City Intelligence

## Purpose

Phase 5 adds a city-level discovery layer on top of the country ranking.

The country model answers:

> **Which countries currently offer attractive quality-adjusted purchasing power?**

Phase 5 asks the next question:

> **Within an attractive country, which major cities actually have enough dense, varied everyday amenities to make that purchasing power useful?**

City Amenity Depth is deliberately **not** part of the country ranking in Phase 5. Overture place coverage varies geographically, and low observed POI counts can reflect thin source coverage as well as genuinely thin city life. Unknown evidence must not be converted into a national ranking penalty.

## Canonical city universe

The city universe comes from the **European Commission JRC GHS-WUP-MTUC R2025A V1.1** statistics dataset, the geospatial city framework supporting the UN World Urbanization Prospects 2025 revision.

Phase 5 uses harmonized Degree-of-Urbanization urban centres with at least 50,000 residents and retains:

- stable urban-centre ID;
- city / urban-centre name;
- ISO3 country;
- 2025 population;
- land area;
- built-up area where available;
- population-weighted centroid;
- source plausibility / capital flags where available.

These are harmonized urban centres, not legal municipality boundaries. That distinction is useful because city comparisons otherwise become badly distorted by administrative boundary definitions.

## Amenity source

Amenity evidence comes from the **latest Overture Maps Places release** discovered through Overture's STAC catalog, with `2026-08-19.0` retained only as a fallback release identifier.

Phase 5 uses Overture's taxonomy hierarchy rather than brittle individual category IDs. It filters out permanently closed places and applies a configurable minimum Overture existence-confidence threshold, currently `0.75`.

The confidence value is used as a filtering signal. It is **not** treated as a calibrated probability of coverage or as evidence that every geography is mapped equally well.

## Amenity groups

The discovery score uses six broad groups:

| Group | Weight | Per-10k saturation target | Per-km² saturation target |
| --- | ---: | ---: | ---: |
| Food & drink | 27% | 35 | 8 |
| Shopping | 20% | 30 | 6 |
| Health care | 15% | 10 | 2 |
| Recreation & culture | 20% | 14 | 3 |
| Lifestyle services | 10% | 10 | 2 |
| Lodging | 8% | 5 | 1 |

The weights are transparent model choices. They are intended to capture practical day-to-day optionality for a several-week to several-month stay rather than short-trip sightseeing intensity.

## Amenity Depth calculation

For each group, Phase 5 calculates:

- POIs per 10,000 residents;
- POIs per square kilometre;
- a saturating score for each density measure;
- the geometric mean of per-capita and spatial density.

The geometric combination matters. A city should not score exceptionally merely because it has many places in absolute terms if those places are thin relative to population or extremely dispersed spatially.

Both density measures saturate. Once a city has cleared a deep amenity threshold, ever more POIs create diminishing value rather than an unlimited mega-city bonus.

The weighted category score is then multiplied by a modest diversity factor based on how many amenity groups are represented.

`amenity_depth` is reported on a 0–100 scale.

## City footprint

The official GHS-WUP statistics provide city land area and a population-weighted centroid. Phase 5 currently creates an **equivalent-area circle** around that centroid:

`radius = sqrt(city_area / pi)`

A bounding box around the circle is used only for Overture Parquet predicate pushdown. The SQL then applies a circular distance filter before counting POIs.

This is an important correction over counting the entire bounding rectangle and dividing by the smaller official city area.

The footprint is still a proxy. Irregular coastal cities, elongated urban corridors and polycentric shapes will not be represented perfectly. The official GHS-WUP vector polygons are the intended precision upgrade once we are ready to add exact polygon queries without making the current endpoint unnecessarily heavy.

## Candidate set and within-country ranking

For a selected country, Phase 5:

1. takes the largest candidate urban centres by 2025 population, defaulting to the top 12;
2. queries Overture amenity evidence for those candidates in parallel;
3. sorts candidates with observed evidence by Amenity Depth;
4. returns the requested top cities, defaulting to six;
5. assigns `amenity_rank_within_country` only to cities with observed evidence.

A city with a failed or unavailable Overture query remains visible but **unranked**. It is not assigned an amenity score of zero.

This ranking is therefore a ranking **within the queried population-led candidate set**, not an exhaustive claim about every settlement in the country. Smaller hidden-gem cities can be added once city search and broader candidate exploration are introduced.

## API

`GET /api/cities/{country_iso3}`

Parameters:

- `limit` — 1 to 20, default 6;
- `include_amenities` — 1 or 0, default 1.

The endpoint returns city rows plus source metadata. Country rankings expose the endpoint in metadata but are not altered by the city layer.

## Main audit fields

City rows can expose:

- `city_id`
- `city_name`
- `population`
- `area_km2`
- `built_up_km2`
- `lat`, `lon`
- `amenity_depth`
- `amenity_rank_within_country`
- `amenity_total`
- `amenity_total_per_10k`
- category counts, per-10k density, per-km² density and category scores
- `amenity_diversity`
- `amenity_source`
- `amenity_release`
- `amenity_confidence_min`
- `amenity_query_success`
- `amenity_footprint_method`
- `amenity_query_radius_km`
- `amenity_flags`

## What Phase 5 deliberately does not claim

Amenity Depth does not measure quality, price, opening hours, English availability, neighborhood safety, transit access or furnished-housing availability. A restaurant count says that choice exists, not that the restaurant is good or cheap.

Overture provider coverage can vary materially across countries. Successful retrieval means the query worked; it does not mean coverage is complete.

The Phase 5 score is therefore a **city-discovery signal**, not a universal city-quality index and not yet a ranking input at country level.

## Next step

Phase 6 adds the dimensions that POI density cannot answer well:

- public-transport availability and service intensity;
- digital convenience / connectivity quality;
- potentially more direct accessibility measures.

That will let the city layer distinguish a dense catalogue of amenities from amenities that are actually easy to reach and use without a car.
