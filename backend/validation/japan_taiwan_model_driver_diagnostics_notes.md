# Japan/Taiwan Model Driver Diagnostics

This is a diagnosis layer only. It explains why the current backend model prefers Taiwan over Japan for `GBR` / `GBP`, while official visitor-spend/day points in the opposite direction under annual-FX normalization. It does not change scoring weights or make a final claim about which destination is cheaper.

## Main Drivers

The model preference for Taiwan is driven primarily by PPP-side and tourism-depth inputs:

- Taiwan has higher `tourism_pp_power` (`2.2850` versus Japan `1.5914`), which drives a higher `model_value_multiplier_relative` and a lower estimated daily cost.
- Taiwan has a higher PPP Advantage component (`47.39` versus Japan `30.41`) and higher `score_tourism_cost` (`0.4956` versus Japan `0.3266`).
- Taiwan has a modest Tourism Depth edge (`59.39` versus Japan `54.22`) because the current model input has higher international arrivals for Taiwan.

Japan has the stronger FX Tailwind component (`94.44` versus Taiwan `33.17`). However, under the current scoring architecture, FX Tailwind is exposed as a named component and diagnostic signal; it is not directly multiplied into the ranking score or the estimated daily cost. This means Japan's origin-historical FX advantage does not offset Taiwan's higher PPP/tourism purchasing-power signal in the current rank order.

## Low-Confidence Inputs

Taiwan's diagnostic row is lower confidence than Japan's:

- Taiwan is a `supplemental_model_row` because WDI omits `TWN`.
- Taiwan private-consumption PPP is proxied from broad GDP PPP (`ppp_private_is_gdp_proxy`).
- Taiwan FX Tailwind is `model_proxy`; historical origin-aware FX is unavailable.
- Taiwan WGI political stability is missing and neutral-filled.
- Taiwan data quality is `55` / `C`, versus Japan `77` / `B`.

Japan also has caveats:

- Japan private-consumption PPP is nowcasted.
- Japan WGI political stability is missing and neutral-filled.
- Japan's official visitor-spend period is 2025, while Taiwan's official spend period is 2024.

## Interpretation

The mismatch looks most like a combination of possible PPP/tourism-purchasing-power overstatement for Taiwan and unresolved comparability limits in official visitor-spend/day. Official spend/day is observed survey evidence, but it is not a controlled item-price basket. It reflects visitor mix, trip behavior, trip length, package travel, and category definitions.

The current warning signal remains: the model estimates Taiwan cheaper for a GBP-origin traveler, while official visitor-spend/day remains higher for Taiwan than Japan under annual-average FX normalization.

This should inform later scoring work, but it is not enough by itself to recalibrate the model. The next evidence step should be either a Tokyo/Taipei item-price basket or a controlled sensitivity test that reduces PPP Advantage / `tourism_pp_power` influence to see whether the mismatch shrinks.
