# Travel Value Studio — Phase 2 FX Opportunity

## Purpose

Phase 2 makes currency timing a production input rather than a display-only diagnostic.

The user question is:

> Given the currency I hold, is this destination unusually attractive **right now** compared with recent bilateral FX history?

This is deliberately separate from Structural Purchasing Power. Structural Purchasing Power asks whether broad local consumption is inexpensive. FX Opportunity asks whether the selected origin currency has recently become unusually strong against the destination currency.

## Data source

Primary source: **Frankfurter v2 `/rates`**, using its blended reference-rate feed.

The engine requests:

- latest USD-base rates;
- approximately 1 week earlier;
- approximately 1 month earlier;
- approximately 3 months earlier;
- approximately 1 year earlier;
- approximately 3 years earlier.

USD-base tables are converted into destination-currency-per-origin-currency cross rates. This lets the same engine support GBP, USD, EUR, CHF and other selected origin currencies without hard-coding currency pairs.

Historical target dates walk backward by up to seven days when needed so weekends and holidays do not create false missing data.

## Bilateral move

For each horizon:

`tailwind ratio = current destination/origin cross / historical destination/origin cross`

A ratio above 1 means one unit of the selected origin currency currently buys more destination currency than it did at the reference point.

The UI reports the corresponding percent move:

`(tailwind ratio - 1) * 100`

## Horizon combination

The five horizons are intentionally not treated identically.

| Horizon | Weight | Saturation scale |
| --- | ---: | ---: |
| 1W | 15% | 4% log move |
| 1M | 25% | 7% log move |
| 3M | 25% | 10% log move |
| 1Y | 20% | 15% log move |
| 3Y | 15% | 25% log move |

Each horizon is transformed with a symmetric tanh function on the bilateral log return. This prevents extreme currency collapses from creating unbounded scores and treats equivalent strengthening/weakening symmetrically in log space.

The available horizon signals are weight-normalized into `fx_opportunity_signal`, ranging from -1 to +1.

The user-facing `fx_opportunity` score is:

`50 + 50 * fx_opportunity_signal`

So:

- 50 = broadly neutral versus recent history;
- above 50 = origin-currency tailwind;
- below 50 = origin-currency headwind.

## Ranking effect

Phase 2 applies FX as a **timing overlay**, not as a replacement for structural value.

By default:

`fx_opportunity_multiplier = 1 + 0.15 * signal * coverage_confidence`

The maximum ranking effect is therefore approximately **±15%**, and incomplete historical coverage reduces the amplitude further.

The pre-FX score is retained as `score_pre_fx_opportunity` for auditability.

This design is intentional. A sharp one-week currency move should be capable of changing rankings, but it should not make weak comfort, poor service depth or structurally expensive local prices irrelevant.

## Fallback behavior

If Frankfurter v2 is unavailable for a request, Phase 2 can fall back to the existing historical FX component when that component is based on historical FX. A pure model proxy is **not** allowed to create a Phase 2 ranking adjustment.

If no historical timing evidence is available, the FX multiplier is neutral at 1.0.

## Caching

The multi-horizon Frankfurter history is cached by the backend for one hour by default (`FX_OPPORTUNITY_CACHE_TTL_SECONDS=3600`). Historical observations are effectively immutable, while the latest reference rate changes at most a few times per working day.

The maximum ranking amplitude can be configured with `FX_OPPORTUNITY_MAX_EFFECT`, default `0.15`.

## What this does not claim

FX Opportunity is not:

- a currency forecast;
- a statement that the currency is fundamentally under- or over-valued;
- BIS NEER or REER;
- an executable cash/card exchange rate;
- evidence that hotels, rent, restaurants or other local prices moved one-for-one with the currency.

It is a transparent answer to a narrower question: **is my currency buying unusually much or little of this destination currency compared with recent history?**
