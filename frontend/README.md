# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 9 — Mobile, Responsive & Accessibility Hardening: implemented.**

The frontend is being rebuilt around a product architecture rather than the original model-debugging dashboard.

### Phase 1 foundation

```text
app/
  page.tsx                 Discover
  country/[iso3]/page.tsx  Country detail
  compare/page.tsx         Comparison
  methodology/page.tsx     Methodology

components/shell/
  AppHeader.tsx
  AppShell.tsx

hooks/
  useRankings.ts
  useOrigins.ts
  useCities.ts

lib/
  api.ts
  preferences.ts
  types.ts
```

The Discover preference state is encoded in the URL using `origin`, `value`, `comfort`, `services`, `stability`, and optional `year` parameters. Refreshing or sharing the URL therefore preserves the model configuration.

### Phase 2 preference experience

The old compatibility `ControlPanel` has been removed and replaced with `PreferenceBar.tsx` and `PreferenceDrawer.tsx`. The frontend preserves exact continuous backend parameters while presenting plain-language states such as `Flexible`, `Balanced`, `High`, `Very high`, and `Ignore`.

### Phase 3 ranked results

Discover uses `DestinationResult.tsx` plus `lib/ranking-explanations.ts`. Result cards expose production rank, Quality-Adjusted Value, origin-relative purchasing power, bounded FX effect, and actual backend ranking drivers. Visitor arrivals, stars, value percentiles, hover-only metrics, and frontend-created verdict scores were removed.

### Phase 4 integrated discovery map

Desktop Discover uses a synchronized map + ranking surface rather than separate map/results tabs. `WorldMap.tsx` retains the local GeoJSON and Equal Earth projection, uses a sequential Quality-Adjusted Value scale, and shares active-country state with `RankingList.tsx`. On smaller screens the ranking remains primary and the map opens in a full-screen overlay.

### Phase 5 country detail

The temporary destination modal was removed. Selecting a destination navigates to an addressable country route with the active preference configuration preserved in the query string. Country detail is decision-first: headline value context, ranking tailwinds/drags, purchasing power and FX timing, living foundations, city shortlist, then confidence and limitations.

### Phase 6 city shortlist

The technical `CityIntelligencePanel` was replaced by `CityShortlist.tsx` and `CityCard.tsx`. The primary city view preserves backend City Usability and candidate rank, labels Mobility and Digital Convenience as national context, and moves POI density / GTFS mechanics behind `View city evidence`.

### Phase 7 country comparison

Comparison is a dedicated, shareable route:

```text
/compare?origin=GBR&value=0.70&comfort=0.55&services=0.65&stability=0.75&countries=JPN,THA,MYS
```

Users can add or remove up to three destinations. Comparison uses production fields only and does not create another score or declare a winner. `lib/comparison.ts` is interpretation-only and describes factual metric spreads.

### Phase 8 methodology & trust layer

The old methodology modal has been removed. `/methodology` is now the canonical methodology experience, and Discover / country-detail links preserve the active preference configuration so returning to Discover restores the same model setup.

Phase 8 adds:

```text
components/methodology/
  MethodologyClient.tsx
  HowItWorks.tsx
  AdvancedMethodology.tsx

lib/
  methodology.ts
```

The route has two levels:

1. **How it works** — a plain-language flow from reference market → purchasing power → comfort/services/stability floors → bounded FX timing → city shortlist. It also visualizes the production country scoring sequence without exposing internal development-phase labels.
2. **Advanced methodology & evidence** — live backend model contract, component definitions/caveats, missing-data rules, known limitations and a searchable source registry.

The methodology page prominently states the largest current blind spot: furnished move-in-ready housing for roughly 30–90 day stays is not modeled because the available free data are not globally consistent enough for an auditable production comparison. Travel-to-destination cost, visa feasibility and comprehensive personal-safety risk are also explicitly outside the country value score.

### Phase 9 mobile, responsive & accessibility hardening

Phase 9 keeps the Phase 1–8 information architecture and hardens behavior across phone, tablet, keyboard and reduced-motion use cases.

Key changes:

- The global shell now includes a visible-on-focus **Skip to main content** link and the header becomes a two-row mobile layout rather than forcing brand + three navigation links into one narrow row.
- Touch targets for primary actions, modal controls, comparison chips and country-detail actions are approximately 44px-class minimums.
- `hooks/useModalDialog.ts` centralizes accessible modal behavior: initial focus, focus trapping, Escape-to-close, body-scroll lock and restoration of the previously focused control.
- Preferences and the mobile map use that same dialog behavior. The mobile map also respects safe-area insets.
- The map no longer creates a separate Tab stop for every country. It uses a single **roving keyboard focus** ordered by destination rank; arrow keys move focus and Enter/Space opens the destination. The ranked list remains the primary non-map alternative.
- Destination-result and mobile-map Framer Motion transitions respect `prefers-reduced-motion`; global CSS also collapses residual animation/transition duration for reduced-motion users.
- Discover, Country, Compare and Methodology now expose persistent inline loading/error/empty states with `aria-live`, `aria-busy`, `role=status` or `role=alert` as appropriate instead of relying on transient toast feedback or visually blank output.
- Comparison remains horizontally scrollable on narrow screens, but the table is now a named keyboard-focusable region with table caption/scope semantics and a mobile swipe hint.
- Country/city detail and comparison surfaces received targeted contrast and small-text improvements while preserving the dark visual system.
- Dynamic viewport units (`dvh`), overscroll containment and safe-area padding are used where full-height mobile overlays or independently scrolling panels need them.

Phase 9 acceptance targets are:

```text
375px phone       no structural horizontal page overflow; rankings first; map/dialog usable
430px phone       same interaction model with comfortable touch targets
Tablet            responsive stacked/grid layouts with no fixed-sidebar assumptions
Laptop/Desktop    synchronized map/list and independent list scrolling retained
Keyboard          skip link, visible focus, modal focus trap, map roving focus, table scrolling
Reduced motion    no required information depends on animation
Loading/Error     meaningful persistent state on every primary route
```

This is a code/CI acceptance contract. Final visual polish, spacing normalization, performance tuning and cross-device product QA remain Phase 10.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
