# Japan/Taiwan Sensitivity Notes

This is diagnostic only. Production scoring is unchanged.

The sensitivity runner tests whether the Japan/Taiwan warning signal is fragile under controlled scoring variations for `GBR` / `GBP`. By default it uses `japan_taiwan_model_snapshot.csv`, a fixed copy of the accepted model-driver baseline, then applies optional diagnostic-only adjustments to scores and estimated costs. These adjustments are not written back into `compute_scores()` and should not be treated as a new ranking model.

## Baseline Reproducibility

Sensitivity tests now default to a fixed validation snapshot. This fixes a reproducibility gap where a fresh live rebuild could change Japan's FX Tailwind from `origin_historical_fx` to `model_proxy` if historical FX enrichment was unavailable during the run. That changed Japan's component FX Tailwind and data-quality flags, so the sensitivity baseline no longer matched the accepted model-validation baseline.

Snapshot mode reproduces the accepted baseline:

- Japan FX Tailwind `94.44`, source `origin_historical_fx`, data quality `77 / B`.
- Taiwan FX Tailwind `33.17`, source `model_proxy`, data quality `55 / C`.
- Japan model daily cost `139.7764 GBP`.
- Taiwan model daily cost `94.9412 GBP`.

Live rebuild mode still exists for exploratory refreshes only:

```powershell
$env:SENSITIVITY_USE_LIVE_REBUILD='1'; python backend\validation\run_japan_taiwan_sensitivity.py
```

Live rebuilds may produce different FX enrichment depending on API availability and should not overwrite the deterministic validation baseline unless intentionally refreshing the snapshot.

## What Was Tested

The scenarios cover:

- Current default controls (`baseline_default`).
- Lower budget sensitivity.
- Lower PPP / tourism purchasing-power influence.
- Higher diagnostic importance for FX Tailwind.
- Lower tourism-depth influence.
- A conservative Taiwan proxy-data penalty.
- High-comfort and low-comfort traveler controls.

## Results

The baseline reproduces the current validation rows: Japan estimated daily cost is `139.7764 GBP`, Taiwan is `94.9412 GBP`, and the model preference remains Taiwan.

No scenario reverses the diagnostic score preference. The mismatch persists across all eight scenarios: the model or diagnostic-adjusted score still favours Taiwan, while official annual-FX-normalized visitor spend/day favours Japan.

Several scenarios shrink the diagnostic adjusted-cost gap:

- `conservative_taiwan_proxy_penalty` shrinks the adjusted cost gap from Taiwan `44.8352 GBP` cheaper to only `1.4125 GBP` cheaper.
- `lower_ppp_weight_proxy` shrinks the adjusted cost gap to `5.9023 GBP`.
- `higher_fx_importance` shrinks the adjusted cost gap to `13.7615 GBP`.
- `lower_tourism_depth_importance` shrinks the adjusted cost gap to `27.4881 GBP`.

This suggests the mismatch is most sensitive to PPP / `tourism_pp_power` treatment and Taiwan proxy-data treatment. FX Tailwind helps Japan in the sensitivity layer, but the tested FX boost alone does not reverse the model preference.

## Caveats

Official visitor-spend/day is not a controlled item basket. It reflects visitor mix, trip length, package travel, category definitions, and period differences. Taiwan also remains lower confidence in the model because it is a supplemental row, uses a GDP PPP proxy for private-consumption PPP, lacks WGI stability, and has model-proxy FX Tailwind.

The next scoring review should focus on PPP / `tourism_pp_power` weighting and proxy-data treatment, but the next evidence step may still need a Tokyo/Taipei item-price basket before changing production scoring.
