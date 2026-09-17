# Travel Value Studio — Phase 3 Basic Comfort

## Purpose

Phase 3 replaces the production GDP-PPP comfort floor with direct evidence about whether low prices can plausibly translate into a modern basic standard of daily life.

The question is not whether a country is rich. It is:

> **Does this destination clear the basic-service floor required for cheapness to be genuinely useful?**

## Production pillars

Phase 3 uses five country-level pillars:

| Pillar | Preferred source | Indicator | Weight |
| --- | --- | --- | ---: |
| Drinking water | WHO/UNICEF JMP via World Bank WDI | basic `SH.H2O.BASW.ZS` + safely managed `SH.H2O.SMDW.ZS` | 25% |
| Sanitation | WHO/UNICEF JMP via World Bank WDI | basic `SH.STA.BASS.ZS` + safely managed `SH.STA.SMSS.ZS` | 20% |
| Electricity | World Bank / Tracking SDG7 via WDI | `EG.ELC.ACCS.ZS` | 20% |
| Internet | ITU via World Bank WDI | `IT.NET.USER.ZS` | 15% |
| Health | WHO via World Bank WDI | `SH.UHC.SRVS.CV.XD` | 20% |

For water and sanitation, **at-least-basic access is the foundation and safely-managed access is the stricter quality/reliability layer**. They are nested standards, not interchangeable alternatives. When both are observed, the pillar combines 65% basic-access score and 35% safely-managed score. If only basic access is available, its score is retained at 0.90 evidence reliability; if only safely-managed access is available, it is retained at 0.80 reliability. Missing one measure therefore reduces evidence coverage rather than turning the missing dimension into a zero.

This Phase 7.1 correction avoids the earlier pathology where a country could have near-universal basic water or sanitation access but receive a near-zero Basic Comfort pillar simply because the stricter safely-managed percentage was much lower.

## Saturating service scores

Each pillar is mapped to 0–1 using a floor and a target:

| Pillar | Floor | Saturation target |
| --- | ---: | ---: |
| Water | 50 | 95 |
| Sanitation | 45 | 90 |
| Electricity | 70 | 99 |
| Internet | 35 | 90 |
| UHC | 40 | 80 |

Below the floor the underlying service score is zero. At the target and above it is one.

This is deliberate. The model is intended to detect whether a destination clears a useful modern baseline, not to continuously reward already-developed countries. A country with 99% versus 97% electricity access should not receive a meaningful additional value bonus once both have effectively cleared the floor.

## Composite

Available pillar scores are combined using a reliability-weighted geometric mean. The geometric structure makes a severe weakness in an essential service more meaningful than it would be in a simple arithmetic average.

`basic_comfort_direct` is the direct-service score.

`basic_comfort_coverage` is the reliability-weighted share of configured pillar weight supported by direct data.

When direct data are incomplete, the production score blends toward the old GDP-PPP comfort proxy:

`basic_comfort = coverage * direct_score + (1 - coverage) * legacy_proxy`

The GDP-PPP proxy is therefore a **missing-data fallback only**, not the primary production comfort signal.

## User comfort requirement

The Comfort Requirement slider controls how strongly Basic Comfort penalizes the ranking.

At zero, Basic Comfort does not penalize ranking.

As the slider rises:

- the required comfort threshold rises smoothly from **60 toward 85**;
- shortfall convexity increases only modestly rather than steepening sharply;
- destinations already above the selected threshold receive no additional bonus;
- direct-data coverage controls how much penalty authority the dimension has.

Basic Comfort remains intentionally stronger than the partial Service Depth and WGI Stability proxies. At maximum concern, genuinely poor basic-service foundations can still receive a severe penalty. The smoother 60→85 curve is designed to prevent ordinary preference adjustments from creating unnecessary cliff effects while preserving that substantive distinction.

## Current production ranking order

Under Phase 7.1 the country ranking is built in this order:

1. origin-relative Structural Purchasing Power;
2. Basic Comfort shortfall penalty;
3. bounded Service Depth shortfall penalty;
4. bounded WGI Political Stability shortfall penalty;
5. bounded bilateral FX Opportunity overlay;
6. final normalized Quality-Adjusted Value.

The legacy GDP-led score is audit-only and does not determine ranking or country inclusion.

## Audit fields

Ranking rows expose:

- `basic_comfort`
- `basic_comfort_direct`
- `basic_comfort_coverage`
- `basic_comfort_source`
- `basic_comfort_flags`
- `basic_comfort_penalty`
- `legacy_basic_comfort`
- pillar scores for water, sanitation, electricity, internet and health
- raw source fields and source years

## Limitations

The service data are national averages. They can miss large differences between cities, neighborhoods and rural areas.

Electricity access does not measure outage frequency. Internet use does not measure connection speed, latency or reliability. UHC coverage does not directly measure traveller access, private-hospital quality or insurance availability.

These are therefore basic-service floor indicators, not a complete quality-of-life index. City intelligence, amenity depth, mobility and digital convenience remain separate evidence layers.
