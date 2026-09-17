# Travel Value Studio

Travel Value Studio is a **quality-adjusted global purchasing-power discovery engine** for people who hold or earn in one currency and want to know where that money buys unusually strong day-to-day life.

The target use case is a stay of several weeks to several months. Airfare and travel time are intentionally outside scope.

> **Where does the foreign currency I hold buy the most usable quality of life, and within attractive countries which cities turn that value into dense, accessible, digitally convenient living?**

## Current model status

The project is at **Phase 7 — Ranking Rebuild & Validation**.

### Phases 1–6

1. **Phase 1 — model contract:** removed the artificial home-daily-spend framing and stopped presenting macro purchasing power as a personal daily-budget estimate.
2. **Phase 2 — FX Opportunity:** origin-currency 1W / 1M / 3M / 1Y / 3Y timing overlay, bounded to roughly ±15% by default.
3. **Phase 3 — Basic Comfort:** water, sanitation, electricity, internet and health-service coverage replace GDP PPP as the main comfort floor.
4. **Phase 4 — Service Depth:** WEF Tourist Services & Infrastructure replaces arrivals as the primary service-supply signal; arrivals survive only as a reduced-confidence fallback.
5. **Phase 5 — City Intelligence:** GHS-WUP / UN WUP 2025 urban centres plus Overture Places amenity density.
6. **Phase 6 — Mobility & Digital:** WEF transport context + positive MobilityDatabase GTFS evidence, plus ITU/WDI connectivity, Global Findex payments and WEF ICT readiness.

See the corresponding files in `docs/`.

### Phase 7 — production ranking rebuild

Phase 7 removes the original prototype's GDP-led production base. Country ranking is now anchored directly to the selected origin's **private-consumption purchasing power**.

`structural_purchasing_power = destination tourism_pp_power / origin tourism_pp_power`

where `tourism_pp_power = market FX / private-consumption PPP`.

The origin-relative ratio is transformed into a **Structural Value Factor** with symmetric saturation at **1/3x to 3x**. Cheapness Priority controls elasticity rather than changing the meaning of the underlying destination attribute.

The production pre-FX score is now:

`Structural Value Factor × Basic Comfort penalty × Service Depth penalty × Stability penalty`

The bounded Phase 2 FX Opportunity multiplier is then applied last.

Important Phase 7 semantics:

- **legacy GDP-based ranking no longer drives production order**;
- **Stability Priority = 0 is exactly neutral**;
- missing stability evidence is neutral rather than silently penalized;
- Basic Comfort and Service Depth remain floor/shortfall mechanisms rather than unlimited rich-country bonuses;
- legacy scores remain available for audit comparison.

See `docs/PHASE_7_RANKING_REBUILD_VALIDATION.md`.

## Two-stage architecture

Phase 7 deliberately keeps the product as:

1. **Country discovery** — Quality-Adjusted Value;
2. **City drill-down** — Amenity Depth, Mobility, Digital Convenience and City Usability.

The evidence does not yet justify pretending there is a precise exhaustive global city-value ranking: PPP, comfort, service supply, mobility and digital readiness remain substantially national, the city candidate set is bounded, Overture coverage varies, and furnished medium-term housing is still missing.

### City Usability

Within the returned city candidates, Phase 7 adds:

- **60% Amenity Depth**;
- **20% Mobility**;
- **20% Digital Convenience**.

Available inputs are combined geometrically and `city_usability_coverage` reports evidence availability. Amenity Depth is required as the city-specific anchor. Missing national Mobility/Digital evidence reduces coverage rather than forcing a city to zero.

City Usability does **not** alter the country Quality-Adjusted Value.

## Core concepts

- **Structural Purchasing Power** — broad destination purchasing power relative to the selected origin using current market FX and private-consumption PPP.
- **Structural Value Factor** — Phase 7 bounded transformation of Structural Purchasing Power used in production ranking.
- **FX Opportunity** — bilateral historical timing overlay across 1W / 1M / 3M / 1Y / 3Y.
- **Basic Comfort** — direct-services floor using water, sanitation, electricity, internet and health evidence.
- **Service Depth** — country-level accommodation / visitor-service capacity.
- **Stability** — WGI-led political-stability shortfall penalty; not a complete crime/safety measure.
- **City Amenity Depth** — direct city POI density/diversity signal.
- **Mobility** — WEF national transport baseline plus positive GTFS metadata evidence.
- **Digital Convenience** — connectivity + digital-payment readiness.
- **City Usability** — Phase 7 city diagnostic combining Amenity, Mobility and Digital evidence.
- **Quality-Adjusted Value** — final Phase 7 country ranking score after shortfall penalties and bounded FX timing.

## Roadmap

1. Phase 1 — semantic/model contract: complete.
2. Phase 2 — FX v2: complete.
3. Phase 3 — Basic Comfort: complete.
4. Phase 4 — Service Depth: complete.
5. Phase 5 — City Intelligence: complete.
6. Phase 6 — Mobility / Digital Convenience: complete.
7. **Phase 7 — Ranking rebuild and validation: production model implemented; ongoing evidence challenge should continue as new direct datasets are added.**

## Main data sources

- **World Bank WDI / underlying JMP, ITU, WHO, SDG7** — PPP, basic services, connectivity and macro fallbacks.
- **IMF DataMapper / WEO** — GDP and inflation where needed for legacy/fallback context.
- **Frankfurter** — current/historical FX and Phase 2 timing.
- **World Economic Forum TTDI 2024** — Tourist Services & Infrastructure, Ground & Port Infrastructure and ICT Readiness.
- **World Bank Global Findex 2025** — 2024 digital-payment usage.
- **MobilityDatabase** — GTFS feed-catalog metadata, used only as positive open-transit evidence.
- **JRC GHS-WUP-MTUC R2025A V1.1 / UN WUP 2025** — harmonized city universe.
- **Overture Maps Places** — city amenity inventories.
- **RestCountries** — country-to-primary-currency mapping.

The API exposes provenance at:

- `GET /api/source-registry`
- `GET /api/methodology`
- `GET /api/cities/{country_iso3}`

## Key Phase 7 audit fields

Country rows include:

- `structural_purchasing_power`
- `structural_value_factor`
- `basic_comfort_penalty`
- `service_depth_penalty`
- `stability_penalty`
- `stability_evidence_coverage`
- `score_pre_fx_opportunity`
- `fx_opportunity_multiplier`
- `quality_adjusted_value`
- `legacy_score_pre_phase7`
- `legacy_component_overall_value_pre_phase7`

City rows additionally include:

- `city_usability`
- `city_usability_coverage`
- `city_usability_rank_within_country`
- Phase 5 amenity fields
- Phase 6 mobility / GTFS / digital fields.

## Validation

`backend/ranking_v7_checks.py` enforces structural model invariants including monotonic purchasing power, symmetric saturation, zero-priority stability neutrality, no missing-stability penalty, legacy-score isolation, usability-floor behavior and City Usability missing-data handling.

Historical Japan/Taiwan evidence under `backend/validation/` is preserved so earlier model behavior remains auditable rather than silently overwritten.

## Checks

```powershell
cd backend
python -m py_compile main.py data_sources.py source_registry.py model_contract.py fx_opportunity.py phase2_registry.py basic_comfort.py phase3_registry.py service_depth.py phase4_registry.py city_intelligence.py phase5_registry.py mobility_digital.py phase6_registry.py ranking_v7.py phase7_registry.py
python sanity_checks.py
python fx_opportunity_checks.py
python basic_comfort_checks.py
python service_depth_checks.py
python city_intelligence_checks.py
python mobility_digital_checks.py
python ranking_v7_checks.py

cd ../frontend
npm run lint
npm run build
```

GitHub Actions runs the same checks on pushes to `main` and pull requests.

## Important interpretation limits

Travel Value Studio remains a **discovery/screening model**, not a complete temporary-resident budget model. The largest remaining economic gap is likely furnished 1–3 month housing. Private-consumption PPP includes housing broadly but does not directly price the furnished market faced by a mobile foreign-currency earner.

City evidence is also incomplete: Overture measures venue presence rather than price/quality; Mobility is still anchored to a national benchmark; GTFS reflects open-data publication rather than service quality; Digital Convenience is national; and the bounded candidate pool can miss smaller hidden-gem cities.

Those limitations are surfaced rather than converted into false precision.
