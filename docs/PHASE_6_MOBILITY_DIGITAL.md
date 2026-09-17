# Travel Value Studio — Phase 6 Mobility & Digital Convenience

## Purpose

Phase 6 adds two usability diagnostics to the city drill-down:

- **Mobility** — whether a destination sits within a transport environment that plausibly makes dense amenities usable without relying entirely on a car;
- **Digital Convenience** — whether connectivity and digital-payment infrastructure make a several-week to several-month stay operationally easy.

The question is no longer only whether amenities exist. It is:

> **Can I reach and use those amenities conveniently, and can I function digitally with low friction?**

Phase 6 deliberately does **not** alter the production country ranking or the Phase 5 Amenity Depth ordering. The new evidence is exposed first, then Phase 7 will validate it before any weighting decisions are made.

## Mobility

### Comparable baseline

The production Phase 6 mobility diagnostic uses the **World Economic Forum Travel & Tourism Development Index 2024 — Ground and Port Infrastructure pillar**.

The pillar contains broad ground-transport evidence including:

- road-network quality/access;
- railroad density;
- efficiency of train services;
- efficiency of public-transport services;
- port infrastructure.

The WEF 1–7 pillar value is transparently rescaled to 0–100:

`mobility = (ttdi_value - 1) / 6 * 100`

This gives the project a consistent cross-country baseline, but it remains a **country-level** benchmark. It is not presented as a direct city transit-frequency, travel-time or station-access score.

### City-level GTFS evidence

Phase 6 also reads the public **MobilityDatabase `feeds_v2.csv` catalog**.

For each displayed city, the backend looks for active GTFS schedule feeds where either:

- the city centroid lies inside the feed's published geographic bounding box; or
- the catalog municipality matches the city name.

The city row exposes:

- `mobility_gtfs_feed_count`
- `mobility_gtfs_official_feed_count`
- `mobility_gtfs_evidence`
- `mobility_gtfs_providers`

This is **positive evidence only**.

A matching feed demonstrates that machine-readable public-transport schedule data exist in the catalog. It does not prove excellent transport.

More importantly:

> **No MobilityDatabase match is not scored as no public transport.**

Open-data publication practices differ sharply by country, agency and transport mode. A city with no catalog match is therefore labelled `no_catalog_match_unknown_not_zero` rather than receiving a low mobility score.

## Digital Convenience

Digital Convenience is a coverage-aware country-level composite using four pillars:

| Pillar | Weight | Production evidence |
| --- | ---: | --- |
| Internet use | 35% | ITU via World Bank WDI `IT.NET.USER.ZS` |
| Fixed broadband | 15% | ITU via World Bank WDI `IT.NET.BBND.P2` |
| Digital-payment usage | 35% | World Bank Global Findex 2025, 2024 survey (`g20_t`) |
| ICT readiness | 15% | WEF TTDI 2024 ICT Readiness pillar |

### Saturating scores

Inputs are treated as usability thresholds rather than unlimited development bonuses:

- internet use: 45% floor → 95% saturation;
- fixed broadband: 3 subscriptions per 100 people floor → 35 saturation;
- digital payments: 25% floor → 90% saturation;
- TTDI ICT: linear WEF 1–7 → 0–100 transformation.

Available pillars are combined with a weighted geometric mean. Missing inputs are excluded from the mean and separately reduce `digital_convenience_coverage`.

This makes the score evidence-aware without automatically treating missing information as poor digital conditions.

## Why digital payments matter

A three-month stay can be digitally frustrating even with fast internet if ordinary commerce remains heavily cash-dependent or digital-payment adoption is thin.

The Global Findex 2025 measure therefore adds a practical transaction layer to the connectivity indicators. It measures adults who made or received a digital payment during the 2024 survey year.

It remains a national resident-use indicator: it does not guarantee that a visitor's exact foreign card, Apple Pay / Google Pay wallet, QR-payment app or bank account will work everywhere.

## Ranking isolation

Phase 6 fields are intentionally **diagnostic only**.

They do not change:

- `quality_adjusted_value` country rankings;
- Phase 5 `amenity_depth`;
- `amenity_rank_within_country`.

This is a deliberate modelling control. Mobility and digital data have different geographic precision and coverage characteristics from PPP, comfort and service-supply data. Phase 7 is the correct place to test whether and how they should affect rankings after cross-market validation.

## API

`GET /api/cities/{country_iso3}` now supports:

- `limit`
- `include_amenities`
- `include_usability`

`include_usability=1` adds the Phase 6 fields to the city rows.

The endpoint metadata explicitly reports:

- `phase6_scores_affect_country_ranking: false`
- `phase6_scores_affect_city_amenity_rank: false`
- mobility and digital source provenance;
- source warnings when a public source cannot be retrieved.

## Main audit fields

### Mobility

- `mobility`
- `mobility_source`
- `mobility_coverage`
- `mobility_ttdi_2024_value`
- `mobility_gtfs_feed_count`
- `mobility_gtfs_official_feed_count`
- `mobility_gtfs_evidence`
- `mobility_gtfs_providers`

### Digital Convenience

- `digital_convenience`
- `digital_convenience_coverage`
- `digital_convenience_source`
- `digital_internet_users_pct`
- `digital_fixed_broadband_per_100`
- `digital_payments_pct`
- `digital_internet_score`
- `digital_fixed_broadband_score`
- `digital_payments_score`
- `digital_ttdi_ict_score`

## Limitations

The WEF mobility pillar is a national benchmark and includes roads/ports as well as public transport, so it cannot substitute for city-level service frequency, coverage, reliability or average travel times.

MobilityDatabase measures availability of open transit-feed metadata. Feed count can reflect agency fragmentation and open-data practices as much as network scale. It is therefore never used as a negative score when absent.

Digital Convenience is also currently country-level. It does not observe apartment Wi-Fi, mobile-data pricing, eSIM availability, censorship/access restrictions, app language support or a visitor's exact payment acceptance experience.

The Global Findex measure describes adults surveyed in 2024 and is not traveller-specific.

Phase 6 therefore improves the **usability evidence set** without claiming that these diagnostics are yet precise enough to determine the global ranking.

## Next step

Phase 7 is the ranking rebuild and validation phase. It should test the full evidence stack against real destinations and known counterexamples before deciding:

- which city diagnostics should affect recommendations;
- whether mobility/digital should be penalties, thresholds or preference-controlled weights;
- how to handle uneven geographic coverage;
- whether the final product should rank countries first and cities second or construct a true city-level Quality-Adjusted Value score.
