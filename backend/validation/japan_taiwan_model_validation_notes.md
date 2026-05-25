# Japan/Taiwan Model Validation Notes

This comparison is a reality check for the Travel Value Studio model. It is meant to test whether model outputs are directionally consistent with official tourist-spend evidence, not to prove that one country is objectively cheaper for every traveler.

## What It Can Validate

- Whether the model's estimated daily cost is directionally plausible against official visitor spend per day.
- Whether a strong FX Tailwind is being overstated relative to actual tourist-facing spend.
- Whether PPP Advantage and Comfort/Tourism components are pointing in the same broad direction as official spend evidence.
- Whether Japan/Taiwan outputs deserve deeper review before changing the scoring model.

## What It Cannot Validate

- It cannot prove a universal tourist basket cost for either country.
- It cannot compare every travel style, city, season, or origin market.
- It cannot isolate currency effects from inflation, trip length, visitor mix, package tours, or category definitions.
- It cannot validate the full main model from one country pair alone.

## Why Visitor Spend/Day Is Not A Basket

Official visitor spend/day is observed survey evidence, but it is not the same thing as a controlled item-price basket. It reflects who visited, how long they stayed, what they did, whether they used package tours, and how the survey categorizes spending. A clean tourist basket still needs item-level evidence for accommodation, food, local transport, attractions, and connectivity.

## Category Caveats

Japan and Taiwan categories do not map one-to-one:

- Japan `Accommodation` is derived from JTA Annex 2 category spend.
- Taiwan `Hotel expenditure` comes from the Taiwan Tourism Administration 2024 summary.
- Japan food/drink maps to `Restaurant, fast food, cafe etc.` only.
- Taiwan food/drink maps to food and drink outside hotels.
- Japan local transport is intentionally blank in the summary because official `Transport` includes local and intercity transport.
- Taiwan domestic transport is broader than a local metro/bus item.

## How To Use This

Use `japan_taiwan_official_comparison_summary.csv` to understand what official evidence is available in local currencies. Use `japan_taiwan_official_comparison_fx_normalized.csv` as the primary normalized comparison, because it applies documented annual FX assumptions. Use `japan_taiwan_model_validation_template.csv` as the join target for backend model outputs.

A warning sign would be: the model says Japan is much cheaper because of FX, while official spend/day is similar to or higher than Taiwan after documented currency normalization. Another warning sign would be model-estimated daily cost moving opposite to official spend/day without a clear category or visitor-mix explanation.

## GBR Model Run - 2026-05-25

The backend model was run locally using the same scoring functions as `/api/rankings` with `origin_iso3 = GBR` and the default ranking parameters. The origin resolved cleanly:

- `origin_used`: `GBR`
- `origin_currency`: `GBP`
- `origin_pp_multiplier`: `1.0777393848375492`

The model now produces comparable Japan/Taiwan rows:

- Japan (`JPN`) rank 119, score `0.18`, estimated daily cost `139.7764 GBP`, FX Tailwind source `origin_historical_fx`.
- Taiwan (`TWN`) rank 102, score `0.37`, estimated daily cost `94.9412 GBP`, FX Tailwind source `model_proxy`.

Two backend coverage fixes were needed before the comparison could run:

- Missing WGI political-stability values now receive a neutral model component of `50.0` instead of dropping otherwise usable rows. The data-quality layer still flags `missing_stability`.
- Taiwan is added as an explicit supplemental model row because WDI omits `TWN`. IMF macro fields populate GDP/PPP where available; Taiwan's official 2024 arrivals and average FX fill validation-backed gaps. Taiwan's private PPP field is marked as a GDP PPP proxy, not an observed private-consumption PPP value.

The first populated validation signal was `model_direction_mismatch_current_fx` for both rows. The model says Taiwan is cheaper than Japan for a GBP-origin traveler. Official visitor spend/day pointed the other way under the then-documented current-FX conversion: Japan was about `151.20 USD/day` using backend Frankfurter JPY/USD `158.93` from 2026-05-25, while Taiwan was reported at `182.83 USD/day` in the official 2024 Taiwan summary.

## Annual FX Normalization Pass

Current FX was insufficient as the primary validation basis because it mixed a 2026 spot-style backend conversion for Japan with official 2024 USD values from Taiwan's report. The normalized comparison now uses FRED annual foreign exchange rate series from the Board of Governors of the Federal Reserve System G.5A release:

- `AEXJPUS` for Japan, using 2025 annual `149.5686 JPY/USD` because the Japan visitor-spend data is Calendar Year 2025.
- `AEXTAUS` for Taiwan, using 2024 annual `32.1064 TWD/USD` as a cross-check against Taiwan's official report average exchange rate of about `32.108 TWD/USD`.
- `AEXUSUK` for GBP conversion, using 2025 annual `1.3192 USD/GBP` for Japan and 2024 annual `1.2781 USD/GBP` for Taiwan.

After annual-average FX normalization, Japan Total visitor spend/day is `160.66 USD` / `121.79 GBP`, while Taiwan Total visitor spend/day remains `182.83 USD` / `143.05 GBP`. The validation signal is now `model_direction_mismatch_annual_fx`: the model estimates Taiwan cheaper for GBR/GBP, while official visitor-spend/day remains higher for Taiwan than Japan under annual FX normalization.

This is still a warning signal, not a conclusion. Japan and Taiwan periods differ, official visitor spend/day reflects visitor mix and trip behavior rather than a controlled item basket, and Taiwan's model row has lower confidence because it is supplemental, uses a GDP PPP proxy, lacks WGI stability, and lacks historical origin-aware FX. Current backend FX should be treated only as sensitivity context, not the primary official-comparison basis.

Populated model-output validation can now run in stricter mode by setting `MODEL_VALIDATION_REQUIRE_POPULATED=1` before `python backend/validation/run_validation_checks.py`. Rows marked `model_output_missing`, `model_output_pending`, `official_data_pending`, or `not_comparable` are still allowed to keep model fields blank.
