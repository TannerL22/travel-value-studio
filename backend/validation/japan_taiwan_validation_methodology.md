# Japan/Taiwan Validation Methodology

## Purpose

This validation scaffold tests whether Travel Value Studio can distinguish a cheap currency from an actually good-value trip. The immediate comparison is Japan versus Taiwan, because Japan can screen attractively when the yen is weak while Taiwan may still feel cheaper or better value once tourist-facing costs and convenience are considered.

This is not a claim that Taiwan is always cheaper than Japan. It defines the evidence structure needed to test that claim with repeatable data.

## What We Are Validating

The app should eventually answer whether macro signals line up with tourist experience:

- Does FX weakness make the trip cheaper for the selected origin currency?
- Do PPP and local price levels support the same conclusion?
- Do tourist-facing basket costs agree with the macro indicators?
- Does quality, comfort, safety, infrastructure, and ease of travel change the value interpretation?

For Japan/Taiwan, the validation question is:

> Does Taiwan show better tourist value than Japan after comparing origin-aware FX, broad PPP advantage, and a consistent tourist basket?

## Why Japan/Taiwan Is Useful

Japan is a useful stress test because yen weakness can create a strong FX Tailwind signal. That does not automatically mean hotels, rail, food, and attractions are cheap for tourists.

Taiwan is useful as a contrast case because it may not always look as dramatic on macro FX screens, but day-to-day tourist costs, transport convenience, food affordability, and urban quality may produce strong felt value.

Together, they test the central thesis:

> Separate cheap currencies from cheap trips.

## Definitions

### FX Cheapness

FX cheapness measures whether the destination currency is weak relative to the selected origin currency and recent history. In the current app, FX Tailwind uses Frankfurter historical cross rates where available, with USD-based and proxy fallbacks.

FX cheapness can support a cheaper trip, but it can be offset by high tourist prices or tourist-facing inflation.

### PPP / Local-Price Cheapness

PPP cheapness measures broad local purchasing power from macro data such as private-consumption PPP. It is useful for broad local price levels, but it is not a hotel, restaurant, or transport basket.

PPP can suggest local affordability while still missing tourist-heavy neighborhoods, hotel scarcity, rail pricing, or attraction costs.

### Tourist-Basket Cheapness

Tourist-basket cheapness uses observed or well-sourced prices for items a visitor actually buys:

- Accommodation
- Food and drink
- Local transport
- Intercity transport
- Attractions
- Connectivity
- Miscellaneous trip costs

This is the strongest evidence for whether a trip is actually cheap.

### Felt Value / Quality-Adjusted Value

Felt value asks whether the trip feels good for the cost. It may include safety, infrastructure, transit coverage, payment convenience, cleanliness, walkability, food quality, accommodation quality, and depth of things to do.

This should not be reduced to low prices alone. A destination can be good value because it delivers high comfort and convenience at moderate prices.

## Evidence That Would Support Taiwan As Better Tourist Value

The case for Taiwan strengthens if the evidence shows:

- Similar or lower accommodation cost for comparable quality.
- Lower everyday food and drink costs for tourist-relevant meals.
- Lower local transport costs with good coverage and reliability.
- Lower or comparable attraction and connectivity costs.
- Comparable or better comfort/safety/infrastructure for the cost.
- Tourist-basket totals remain lower after converting to USD and GBP.
- The advantage persists across at least Taipei and one secondary area, not only a cherry-picked neighborhood.

## Evidence That Would Support Japan As Cheaper Because Of FX

The case for Japan strengthens if the evidence shows:

- Origin-aware FX Tailwind is meaningfully stronger for Japan.
- Comparable tourist-basket costs fall below Taiwan after FX conversion.
- Accommodation, transport, and food prices show broad reductions in origin-currency terms.
- Visitor expenditure surveys show declining real or converted tourist spend for comparable trip profiles.
- Japan's higher infrastructure or tourism depth offsets any remaining basket premium.

## What Would Falsify Or Weaken The Current Model

The current model is weakened if:

- FX Tailwind ranks Japan strongly, but tourist-basket costs remain materially higher than Taiwan.
- PPP Advantage says one country is cheaper, but observed tourist items consistently point the other way.
- Accommodation scarcity or transport costs erase a macro advantage.
- City-level evidence contradicts country-level conclusions.
- Source quality is too weak or inconsistent to support a claim.
- Data collection shows the comparison depends heavily on travel style, season, or city selection.

## Evidence Tiers

Preferred evidence order:

1. Official tourism expenditure surveys and statistics.
2. Official fare tables and public agency price references.
3. Direct provider prices from official operator websites.
4. Reputable commercial datasets with clear methodology.
5. Manual spot checks, clearly marked as low-confidence and date-specific.

This scaffold starts with official-source planning and a blank basket template. It intentionally avoids scraped prices or unofficial datasets until the methodology is stable.

## Initial Validation Workflow

1. Populate the source register with official Japan and Taiwan tourism/statistical sources.
2. Fill the basket template only with source-backed observed prices.
3. Convert prices using a documented FX date and rate source.
4. Compare basket totals by category and travel style.
5. Compare those basket results against FX Tailwind, PPP Advantage, Tourism Depth, Comfort Floor, and Safety/Stability.
6. Record whether the model explains the observed basket, overstates currency cheapness, or misses quality-adjusted value.

## Current Status

This folder is a validation scaffold only. It does not prove whether Japan or Taiwan is better value yet.
