# Travel Value Studio — Phase 7 Ranking Rebuild & Validation

## Purpose

Phase 7 is the point where the project stops adding dimensions and rebuilds the ranking around the evidence that survived Phases 1–6.

The core question is:

> **Does the final model reward genuine foreign-currency purchasing power that is actually usable, without letting legacy macro proxies, missing-data patterns, or a single flashy dimension dominate the answer?**

## Major Phase 7 decision: remove the legacy GDP-led production base

The original prototype ranked countries partly from:

`GDP PPP per capita / nominal GDP per capita ^ cheapness exponent`

That construction was useful during exploration, but it became redundant and hard to interpret once the project had a direct origin-relative private-consumption purchasing-power measure.

From Phase 7 onward, the production country score is anchored directly to:

`structural_purchasing_power = destination tourism_pp_power / origin tourism_pp_power`

where `tourism_pp_power = market FX / private-consumption PPP`.

The legacy score is retained in `legacy_score_pre_phase7` for auditability, but it no longer drives production ordering.

## Structural value factor

Structural Purchasing Power is transformed into a ranking factor in log space.

- 1.0x relative purchasing power = neutral factor 1.0.
- Ratios are symmetrically capped at **1/3x to 3x** before transformation.
- Cheapness Priority controls the elasticity from **0.45 to 1.00**.

This creates diminishing ranking impact beyond very large purchasing-power differences and avoids allowing an extreme PPP/FX observation to dominate every other component.

Unlike the old cross-sectional min-max score, the factor does not change simply because another country enters or leaves the dataset.

## Explicit shortfall penalties

Basic Comfort, Service Depth and Stability are no longer entangled inside a legacy multiplicative score.

Each is an explicit 0–1 shortfall multiplier.

### Basic Comfort

Retains the Phase 3 logic:

- requirement threshold rises from 55 to 90;
- destinations above the selected threshold receive no extra reward;
- lower scores receive a stronger penalty as Comfort Requirement rises;
- direct-data coverage controls how much of the penalty can be applied.

### Service Depth

Retains the Phase 4 logic:

- threshold rises from 35 to 75;
- high supply is a floor-clearing condition rather than an unlimited rich-market bonus;
- arrivals fallback has lower evidence coverage, therefore lower penalty authority.

### Stability

Phase 7 fixes an important semantic issue in the original model:

> **Stability Priority = 0 now means exactly ignore stability.**

The previous prototype always retained a small stability exponent. Phase 7 instead applies a shortfall multiplier only in proportion to the selected priority and only when observed WGI evidence exists.

Missing stability evidence remains neutral and is surfaced through provenance/quality flags.

## FX Opportunity remains bounded and last

The Phase 2 bilateral 1W / 1M / 3M / 1Y / 3Y FX Opportunity overlay is retained.

It runs after structural purchasing power and usability penalties and remains hard-capped at the configured maximum effect (15% by default).

This preserves the intended distinction:

- **Structural Purchasing Power** = how much broad local consumption the user's currency buys now;
- **FX Opportunity** = whether this moment is unusually attractive relative to the destination currency's recent history.

## Production country formula

Before the FX timing overlay:

`score = structural_value_factor × comfort_penalty × service_penalty × stability_penalty`

Then:

`final_score = score × bounded_fx_opportunity_multiplier`

Quality-Adjusted Value is the final score normalized to 0–100 across the current country universe.

The normalization is useful for discovery but should not be interpreted as an absolute utility scale.

## City architecture decision

Phase 7 deliberately keeps the product **two-stage** rather than pretending the current evidence supports an exhaustive global city ranking.

1. rank countries by Quality-Adjusted Value;
2. drill into candidate cities within attractive countries.

The reasons are structural:

- private-consumption PPP is national;
- Basic Comfort is national;
- Service Depth is national;
- Mobility and Digital Convenience remain mainly national;
- Overture city POI coverage varies geographically;
- the Phase 5 candidate pool is bounded and not exhaustive;
- furnished medium-term housing is still not directly observed.

A global city score today would therefore imply more city-specific precision than the evidence actually provides.

## City Usability

Phase 7 adds a separate within-country diagnostic:

| Component | Weight |
| --- | ---: |
| City Amenity Depth | 60% |
| Mobility | 20% |
| Digital Convenience | 20% |

The available inputs are combined using a weighted geometric mean.

Amenity Depth is required because it is the city-specific anchor. Mobility and Digital Convenience are currently context layers and may be missing without forcing the city score to zero.

`city_usability_coverage` reports the share of configured weight with available evidence.

City Usability:

- can order returned city candidates;
- does not change the country ranking;
- is not labelled a global city Quality-Adjusted Value score.

## Validation invariants

`backend/ranking_v7_checks.py` enforces the following model properties:

1. Structural Purchasing Power is monotonic and saturates at the configured bounds.
2. 1.0x origin-relative purchasing power is exactly neutral.
3. Stability Priority zero is exactly neutral.
4. Missing stability evidence cannot create a penalty.
5. High Comfort and Service requirements can overturn a superficially cheaper but unusable destination.
6. Legacy GDP values and the legacy score cannot affect Phase 7 ordering when current Phase 7 evidence is identical.
7. Cheapness Priority changes the strength, not the direction, of the purchasing-power signal.
8. City Usability requires city Amenity Depth.
9. Missing Mobility/Digital evidence reduces coverage rather than forcing City Usability to zero.
10. City Usability ordering responds monotonically to stronger observed usability evidence.

These are structural tests rather than claims that any particular country "should" occupy a specific rank.

## Validation philosophy

The model should be challenged with counterexamples rather than tuned to reproduce a preconceived ranking.

Useful checks include:

- cheap but weak basic services;
- cheap and comfortable but thin visitor/accommodation supply;
- rich/high-service destinations with poor purchasing power;
- weak currencies whose recent FX timing is attractive but whose structural value is already captured in PPP;
- open-data-poor cities where missing GTFS/POI evidence must not become a negative score;
- high-amenity cities whose transport/digital context is materially weaker than their venue density suggests.

The model is not calibrated against subjective travel rankings or influencer lists.

## Remaining major model gaps

### Furnished medium-term housing

This is probably the largest remaining economic gap. Private-consumption PPP includes housing broadly, but it does not directly measure the furnished 1–3 month rental market faced by a globally mobile visitor.

### City-specific mobility

WEF provides useful comparable national transport context, while MobilityDatabase provides open-feed evidence. Neither yet measures city-level transit frequency, travel times, coverage or car dependence consistently worldwide.

### Personal safety

WGI political stability remains a macro signal. A proper traveller-relevant safety layer would need more direct violence/crime evidence with careful geographic and reporting-bias treatment.

### City search breadth

The city candidate pool is bounded for cost/performance. It can still miss smaller high-usability cities.

## Phase 7 production contract

The intended production architecture after Phase 7 is therefore:

**Country discovery**

Structural Purchasing Power → Basic Comfort shortfall → Service Depth shortfall → Stability shortfall → bounded FX Opportunity → Quality-Adjusted Value

**City drill-down**

Amenity Depth + Mobility context + Digital Convenience → City Usability + evidence coverage

This preserves interpretability and data honesty while leaving clear upgrade paths for direct housing, safety and city-specific transport data.
