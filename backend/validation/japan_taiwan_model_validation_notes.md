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
- It cannot validate the main model until model-ranking rows are joined into `japan_taiwan_model_validation_template.csv`.

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

Use `japan_taiwan_official_comparison_summary.csv` to understand what official evidence is available in local currencies. Use `japan_taiwan_official_comparison_usd.csv` only after Japan receives a documented annual JPY/USD conversion. Use `japan_taiwan_model_validation_template.csv` as the join target for backend model outputs.

A warning sign would be: the model says Japan is much cheaper because of FX, while official spend/day is similar to or higher than Taiwan after documented currency normalization. Another warning sign would be model-estimated daily cost moving opposite to official spend/day without a clear category or visitor-mix explanation.

## Next Population Step

Run backend rankings for a defined origin, likely `GBR` / `GBP`, capture model rows for Japan and Taiwan, then fill the model component columns in `japan_taiwan_model_validation_template.csv`. Keep model-output validation separate from scoring changes until the comparison exposes a concrete issue.
