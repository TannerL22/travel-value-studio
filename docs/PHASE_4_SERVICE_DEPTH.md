# Travel Value Studio — Phase 4 Service Depth

## Purpose

Phase 4 replaces international-arrivals volume as the production proxy for how easily cheap local prices can be converted into a usable stay.

The question is:

> **If this destination is cheap for me, is there enough accommodation and established service capacity for that cheapness to be practically useful?**

This is deliberately different from tourism popularity. A country can receive many visitors and still have constrained or expensive service supply; another can have modest visitor volumes while offering deep, high-quality services.

## Primary source

Phase 4 uses the **World Economic Forum Travel & Tourism Development Index 2024 — Tourist Services and Infrastructure pillar** as the preferred country-level supply signal.

Official dataset:

`https://www3.weforum.org/docs/WEF_TTDI_2024_edition_data.xlsx`

The pillar combines supply-side evidence including:

- hotel rooms per 100 residents;
- short-term rental listing density;
- labour productivity in hotels and restaurants;
- travel-and-tourism capital investment intensity.

The WEF dataset covers 119 economies. The pillar is reported on WEF's 1–7 scale and is converted transparently to 0–100:

`service_depth_direct = (ttdi_value - 1) / 6 * 100`

The WEF score is a useful Phase 4 bootstrap because it already combines accommodation capacity and tourism-service supply. It is not the end-state amenity model: Phase 5 will add direct city-level counts for restaurants, groceries, pharmacies, gyms, entertainment and other everyday services.

## Arrivals are now fallback only

International arrivals are no longer a production service-depth input when TTDI supply data exist.

For destinations outside TTDI coverage, Phase 4 uses a deliberately weaker fallback:

`international arrivals / population * 100`

The ratio is log-scaled and capped at **70/100**. The fallback receives only **45% evidence coverage**.

This matters because arrivals are demand/popularity evidence, not proof of accommodation or amenity supply. The cap and lower coverage prevent a tourism-heavy destination from receiving the same confidence as a destination with direct supply evidence.

If neither TTDI nor usable arrivals/population evidence exists, Service Depth is left unavailable and coverage is zero. Missing evidence does **not** create a ranking penalty.

## Service Depth is objective; preference is separate

`service_depth` is an objective destination attribute and does not change with the user's Service Depth slider.

The slider controls only the shortfall penalty.

The required service threshold rises from 35 toward 75 as the slider moves from 0 to 1. Destinations above the threshold receive no extra bonus.

The production penalty is confidence-aware:

`penalty = 1 - requirement * evidence_coverage * (1 - full_shortfall_penalty)`

Consequences:

- requirement = 0 → no Service Depth penalty;
- direct TTDI evidence can apply the full selected penalty;
- arrivals fallback can apply only a reduced penalty because coverage is 0.45;
- missing evidence has coverage 0 and therefore remains neutral;
- high Service Depth never creates an unlimited reward.

## Ranking order

Phase 4 production ranking now runs in this order:

1. structural purchasing-power / cheapness model;
2. Phase 3 Basic Comfort shortfall penalty;
3. Phase 4 Service Depth shortfall penalty;
4. stability term from the existing production model;
5. Phase 2 bilateral FX Opportunity overlay;
6. normalized Quality-Adjusted Value.

The legacy arrivals-led infrastructure term inside the old score is neutralized before Phase 4 is applied, avoiding double counting.

## Audit fields

Ranking rows expose:

- `service_depth`
- `service_depth_direct`
- `service_depth_coverage`
- `service_depth_source`
- `service_depth_reference_year`
- `service_depth_penalty`
- `service_depth_requirement_threshold`
- `service_depth_ttdi_2024_value`
- `service_depth_ttdi_2024_rank`
- `service_depth_arrivals_per_100`
- `service_depth_arrivals_fallback_score`
- `service_depth_flags`
- `legacy_service_depth`
- `score_pre_service_depth`

## Limitations

The WEF TTDI 2024 pillar is a country-level 2024 benchmark and the latest TTDI edition currently available. Its underlying inputs use a mixture of public, survey and commercial sources and are not all from the same observation year.

The pillar measures tourism-service capacity, not general day-to-day amenity density. It does not directly tell us how many good-value furnished apartments, supermarkets, cafes, gyms, pharmacies or coworking spaces exist in the city where the user would actually stay.

The arrivals fallback is intentionally treated as weak evidence because international-arrival definitions and reporting differ across countries and tourism demand can be highly concentrated geographically.

Phase 5 is therefore the major next step: move from country-level service capacity to **city-level amenity depth** using a harmonized city universe and direct place counts.
