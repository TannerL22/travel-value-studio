# Travel Value Studio — Phase 3 Basic Comfort

## Purpose

Phase 3 replaces the production GDP-PPP comfort floor with direct evidence about whether low prices can plausibly translate into a modern basic standard of daily life.

The question is not whether a country is rich. It is:

> **Does this destination clear the basic-service floor required for cheapness to be genuinely useful?**

## Production pillars

Phase 3 uses five country-level pillars:

| Pillar | Preferred source | Indicator | Weight |
| --- | --- | --- | ---: |
| Drinking water | WHO/UNICEF JMP via World Bank WDI | `SH.H2O.SMDW.ZS` | 25% |
| Sanitation | WHO/UNICEF JMP via World Bank WDI | `SH.STA.SMSS.ZS` | 20% |
| Electricity | World Bank / Tracking SDG7 via WDI | `EG.ELC.ACCS.ZS` | 20% |
| Internet | ITU via World Bank WDI | `IT.NET.USER.ZS` | 15% |
| Health | WHO via World Bank WDI | `SH.UHC.SRVS.CV.XD` | 20% |

For water and sanitation, Phase 3 uses `SH.H2O.BASW.ZS` and `SH.STA.BASS.ZS` as explicit fallbacks when safely managed service is unavailable. These fallbacks are capped and reliability-downweighted because "at least basic" is not equivalent to "safely managed".

## Saturating service scores

Each pillar is mapped to 0–1 using a floor and a target:

| Pillar | Floor | Saturation target |
| --- | ---: | ---: |
| Water | 50 | 95 |
| Sanitation | 45 | 90 |
| Electricity | 70 | 99 |
| Internet | 35 | 90 |
| UHC | 40 | 80 |

Below the floor the pillar score is zero. At the target and above it is one.

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

- the required comfort threshold rises from 55 toward 90;
- the shortfall penalty becomes stronger;
- destinations already above the threshold receive no additional bonus.

The function is therefore mainly a penalty/threshold system rather than a rich-country reward.

## Ranking order

Production ranking is now built in this order:

1. structural model score without the legacy GDP comfort floor;
2. Phase 3 Basic Comfort penalty;
3. Phase 2 bilateral FX Opportunity overlay;
4. final normalized Quality-Adjusted Value.

This prevents an unusually favorable currency move from overwhelming a destination that fails the user's selected basic-comfort requirement.

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

These are therefore basic-service floor indicators, not a complete quality-of-life index. City intelligence, amenity depth, mobility and digital convenience remain later phases.
