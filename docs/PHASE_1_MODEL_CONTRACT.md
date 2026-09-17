# Travel Value Studio — Phase 1 Model Contract

## Product question

Travel Value Studio is a destination-screening engine for globally mobile people who hold or earn in a foreign currency and want to know where that money can buy an unusually high standard of day-to-day life.

The current target use case is a stay of several weeks to several months. Travel-to-destination costs such as airfare are outside scope.

## Phase 1 semantic contract

Phase 1 does not replace the current production ranking formula. It changes the product language and API outputs so they describe what the model actually measures, and establishes stable names for later scoring work.

### Current production concepts

- `structural_purchasing_power`: destination broad purchasing power relative to the selected origin, derived from the existing `tourism_pp_power` ratio. A value above 1 means the selected origin currency has greater broad purchasing power in the destination than at home.
- `fx_opportunity`: current origin-aware historical FX signal. Phase 1 exposes the existing signal but does not yet make it a direct ranking multiplier; Phase 2 will redesign this using additional horizons.
- `basic_comfort`: Phase 1 alias/semantic replacement for the existing GDP-PPP comfort floor. It remains a rough development proxy until dedicated water, sanitation, electricity, connectivity, and health inputs are added.
- `service_depth`: Phase 1 alias/semantic replacement for the existing tourism-depth score. It remains primarily arrivals-driven until amenity, accommodation, and mobility sources are integrated.
- `stability`: Phase 1 alias/semantic replacement for the current WGI-led safety/stability component. It should not be presented as a complete personal-safety measure.
- `quality_adjusted_value`: the existing normalized overall score. The production formula is unchanged in Phase 1.

### Future component contract

These fields are reserved as the target architecture for later phases:

- `structural_purchasing_power`
- `fx_opportunity`
- `basic_comfort`
- `amenity_depth`
- `mobility`
- `digital_convenience`
- `stability`
- `accommodation_depth`
- `quality_adjusted_value`

Each future component should carry source provenance, data vintage, geographic level, and confidence/coverage metadata.

## What is deliberately removed from the product framing

- No claim that broad PPP produces an actual tourist or resident daily budget.
- No user-entered "daily budget at home" as an anchor for destination affordability.
- No claim that low international arrivals prove a destination has higher daily costs.
- No claim that WGI Political Stability is equivalent to personal safety or crime risk.

Legacy validation files may retain historical estimated-daily-cost columns so old model-validation snapshots remain reproducible. Those fields are not part of the forward product contract.

## User controls

The user should be able to tune how strongly the model penalizes destinations that fail to convert cheapness into usable quality of life.

Phase 1 UI labels:

- `Cheapness priority` — existing budget-sensitivity control.
- `Comfort requirement` — existing comfort-floor control.
- `Service depth` — existing tourism-depth control; a temporary label until richer amenity/service data arrive.
- `Stability priority` — existing risk-priority control.

The controls should act primarily as penalties/thresholds rather than endlessly rewarding already-high development or stability.

## Phase roadmap

1. **Phase 1 — semantic/model-contract cleanup**: accurate labels and outputs; no scoring redesign.
2. **Phase 2 — FX v2**: origin-currency 1w/1m/3m/1y/3y opportunity signals directly influence ranking.
3. **Phase 3 — basic comfort**: water, sanitation, electricity, connectivity, and health replace GDP PPP as the main comfort floor.
4. **Phase 4 — service depth**: amenity, accommodation, and tourism-service supply replace arrivals as the primary usability signal.
5. **Phase 5 — city intelligence**: city universe plus amenity density.
6. **Phase 6 — mobility/digital convenience**: public-transport and digital-life layers.
7. **Phase 7 — ranking rebuild and validation**.
