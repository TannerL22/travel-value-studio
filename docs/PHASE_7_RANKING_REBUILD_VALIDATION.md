# Travel Value Studio — Phase 7 Ranking Rebuild & Validation

## Purpose

Phase 7 is the point where the project stops adding dimensions and rebuilds the ranking around the evidence that survived Phases 1–6.

The core question is:

> **Does the final model reward genuine foreign-currency purchasing power that is actually usable, without letting legacy macro proxies, missing-data patterns, or a single partial dimension dominate the answer?**

## Major Phase 7 decision: remove the legacy GDP-led production base

The original prototype ranked countries partly from:

`GDP PPP per capita / nominal GDP per capita ^ cheapness exponent`

That construction was useful during exploration, but it became redundant and hard to interpret once the project had a direct origin-relative private-consumption purchasing-power measure.

From Phase 7 onward, the production country score is anchored directly to:

`structural_purchasing_power = destination tourism_pp_power / origin tourism_pp_power`

where `tourism_pp_power = market FX / private-consumption PPP`.

Phase 7.1 also removes the legacy scorer as a country-universe gate. The old scorer now runs only on a separate audit copy and its prefixed fields are left-joined back by ISO3. A destination can therefore rank without a valid legacy GDP-led score as long as the production Phase 7 evidence can score it.

The legacy score is retained in `legacy_score_pre_phase7` for auditability, but it no longer drives production ordering or inclusion.

## Structural value factor

Structural Purchasing Power is transformed into a ranking factor in log space.

- 1.0x relative purchasing power = neutral factor 1.0.
- Ratios are symmetrically capped at **1/3x to 3x** before transformation.
- Cheapness Priority controls the elasticity from **0.45 to 1.00**.

This creates diminishing ranking impact beyond very large purchasing-power differences and avoids allowing an extreme PPP/FX observation to dominate every other component.

Unlike the old cross-sectional min-max score, the factor does not change simply because another country enters or leaves the dataset.

## Explicit shortfall penalties

Basic Comfort, Service Depth and Stability are no longer entangled inside a legacy multiplicative score.

Each is an explicit 0–1 shortfall multiplier. Phase 7.1 distinguishes direct living-foundation evidence from partial proxy dimensions so that the authority of each penalty matches the evidence behind it.

### Basic Comfort

Basic Comfort remains the strongest shortfall dimension because its inputs directly describe basic living foundations: water, sanitation, electricity, internet and healthcare access.

For water and sanitation, Phase 7.1 corrects the treatment of World Bank/JMP nested standards:

- **at-least-basic access** is the foundation of each pillar;
- **safely-managed access** is a stricter quality/reliability uplift rather than a replacement for basic access;
- when both are available, the pillar is 65% basic access and 35% safely-managed quality;
- if only one standard is available, the observed score is retained with lower evidence reliability rather than treating the missing standard as zero.

The Phase 7.1 preference curve is deliberately smoother than the original Phase 3/7 implementation:

- requirement threshold rises from **60 to 85**;
- penalty convexity increases only modestly as Comfort Requirement rises;
- destinations above the selected threshold receive no extra reward;
- lower scores still receive a materially stronger penalty as Comfort Requirement rises;
- direct-data coverage controls how much of the penalty can be applied.

Because these inputs are directly relevant to basic liveability, Basic Comfort is not given the proxy haircut cap used below. Very poor basic-service foundations can still receive a severe penalty at maximum user concern.

### Service Depth

Service Depth uses WEF TTDI 2024 **Tourist Services and Infrastructure** as the preferred comparable source, with arrivals per capita only as a lower-confidence fallback.

Phase 7.1 explicitly treats WEF Tourist Services as a useful but incomplete proxy for the broader product concept of established everyday services. Its ranking authority is therefore bounded:

- preference threshold rises from **25 to 55**;
- the penalty curve is deliberately smoother than before;
- even at Service Requirement = 1 with full evidence, Service Depth alone can reduce the total pre-FX score by at most **45%**;
- arrivals fallback still has lower evidence coverage and therefore less penalty authority;
- the public verbatim copy of the WEF dataset is provenance-labelled and receives 0.90 evidence coverage when the first-party XLSX cannot be retrieved.

High service depth remains a floor-clearing condition rather than an unlimited rich-market bonus.

### Stability

Phase 7.1 uses **World Bank WGI Political Stability** directly. It does not reuse the old blended “safety” component.

> **Stability Priority = 0 means exactly ignore stability.**

The production WGI score is mapped from the WGI -2.5 to +2.5 scale onto 0–100. The preference threshold rises from **40 to 70**. Because WGI Political Stability is a macro political-risk signal rather than a complete traveller crime/personal-safety measure:

- the curve is smoother than the original Phase 7 implementation;
- even at Stability Priority = 1 with full evidence, this dimension alone can reduce the total pre-FX score by at most **45%**;
- missing WGI evidence has zero penalty authority and is exactly neutral.

This preserves a meaningful distinction for users who care strongly about political stability without allowing one macro proxy to act as a destination veto.

## FX Opportunity remains bounded and last

The Phase 2 bilateral 1W / 1M / 3M / 1Y / 3Y FX Opportunity overlay is retained.

It runs after structural purchasing power and usability penalties and remains hard-capped at the configured maximum effect (15% by default).

Phase 7.1 also repairs destination/origin currency mapping with local ISO territory metadata, using network lookup only as fallback, so a third-party country-metadata outage cannot silently neutralize FX Opportunity globally.

This preserves the intended distinction:

- **Structural Purchasing Power** = how much broad local consumption the user's currency buys now;
- **FX Opportunity** = whether this moment is unusually attractive relative to the destination currency's recent history.

## Production country formula

Before the FX timing overlay:

`score = structural_value_factor × comfort_penalty × service_penalty × stability_penalty`

Then:

`final_score = score × bounded_fx_opportunity_multiplier`

Quality-Adjusted Value is the final score normalized to 0–100 across the current scoreable country universe.

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

`backend/ranking_v7_checks.py`, `backend/phase71_universe_checks.py` and `backend/control_sensitivity_checks.py` enforce the following model properties:

1. Structural Purchasing Power is monotonic and saturates at the configured bounds.
2. 1.0x origin-relative purchasing power is exactly neutral.
3. Stability Priority zero is exactly neutral.
4. Missing stability evidence cannot create a penalty.
5. Service Depth and Stability have explicit maximum-haircut floors so neither partial proxy can become a single-factor veto.
6. The Comfort control remains strong for genuinely poor foundations but is smooth for ordinary preference adjustments.
7. High Comfort and Service requirements can still overturn a superficially cheaper but unusable destination.
8. Legacy GDP values and the legacy score cannot affect Phase 7 ordering when current Phase 7 evidence is identical.
9. Legacy-score availability cannot determine the production country universe.
10. Cheapness Priority changes the strength, not the direction, of the purchasing-power signal.
11. Water/sanitation basic access is not erased by a stricter safely-managed observation.
12. City Usability requires city Amenity Depth.
13. Missing Mobility/Digital evidence reduces coverage rather than forcing City Usability to zero.
14. City Usability ordering responds monotonically to stronger observed usability evidence.

These are structural tests rather than claims that any particular country "should" occupy a specific rank.

## Empirical control-sensitivity audit

`backend/phase71_empirical_audit.py` runs the production evidence and ranking path against live/current source pulls. It reports:

- production-universe counts and legacy-score independence;
- currency, FX, WGI, Basic Comfort and Service Depth coverage;
- baseline rankings for multiple origin currencies;
- full 0→1 control endpoint sensitivity;
- practical ±0.20 control sensitivity around the default settings;
- evidence-level face-validity diagnostics for selected destinations.

The empirical audit is intentionally diagnostic rather than a target-fitting exercise. Calibration changes should be justified by what an input actually measures and by pathological sensitivity, not by forcing a preferred country ordering.

In the post-Phase-7.1 live audit, normal ±0.20 changes preserved 18–19 of the top 20 destinations for each control. Basic Comfort still produces large tail-rank moves for countries with genuinely weak living-foundation evidence; this is intentional and is distinguished from the much more bounded Service Depth and Stability proxy effects.

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

### Service breadth

WEF Tourist Services and Infrastructure is a tourism-supply pillar, not a comprehensive index of retail, healthcare, logistics, consumer services and institutional convenience. Phase 7.1 bounds its ranking authority for this reason, but a broader direct service-depth dataset remains a future upgrade.

### City search breadth

The city candidate pool is bounded for cost/performance. It can still miss smaller high-usability cities.

## Phase 7 production contract

The intended production architecture after Phase 7.1 is therefore:

**Country discovery**

Structural Purchasing Power → Basic Comfort shortfall → bounded Service Depth shortfall → bounded Stability shortfall → bounded FX Opportunity → Quality-Adjusted Value

**City drill-down**

Amenity Depth + Mobility context + Digital Convenience → City Usability + evidence coverage

This preserves interpretability and data honesty while leaving clear upgrade paths for direct housing, safety, broader services and city-specific transport data.
