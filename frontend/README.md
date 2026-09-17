# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 10 — Visual Polish, Performance & Final Product QA: implemented.**

The frontend has been rebuilt around a product architecture rather than the original model-debugging dashboard.

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

- The global shell includes a visible-on-focus **Skip to main content** link and the header becomes a two-row mobile layout rather than forcing brand + three navigation links into one narrow row.
- Touch targets for primary actions, modal controls, comparison chips and country-detail actions are approximately 44px-class minimums.
- `hooks/useModalDialog.ts` centralizes accessible modal behavior: initial focus, focus trapping, Escape-to-close, body-scroll lock and restoration of the previously focused control.
- Preferences and the mobile map use that same dialog behavior. The mobile map also respects safe-area insets.
- The map no longer creates a separate Tab stop for every country. It uses a single **roving keyboard focus** ordered by destination rank; arrow keys move focus and Enter/Space opens the destination. The ranked list remains the primary non-map alternative.
- Reduced-motion users do not depend on animation for information; residual CSS transition/animation duration is collapsed by the global reduced-motion rule.
- Discover, Country, Compare and Methodology expose persistent inline loading/error/empty states with `aria-live`, `aria-busy`, `role=status` or `role=alert` as appropriate instead of relying on transient toast feedback or visually blank output.
- Comparison remains horizontally scrollable on narrow screens, but the table is a named keyboard-focusable region with table caption/scope semantics and a mobile swipe hint.
- Country/city detail and comparison surfaces received targeted contrast and small-text improvements while preserving the dark visual system.
- Dynamic viewport units (`dvh`), overscroll containment and safe-area padding are used where full-height mobile overlays or independently scrolling panels need them.

### Phase 10 visual polish, performance & final product QA

Phase 10 retains the product architecture and removes the remaining model-dashboard visual signatures.

Key changes:

- Header, Discover controls, country context, comparison context and methodology use a quieter sentence-case hierarchy with fewer uppercase micro-labels.
- The preference summary is one contextual strip rather than a row of small cards.
- Destination results are flatter and denser; condition scores are plain context rather than pills and backend ranking drivers remain the only explanatory effects.
- Country detail is more editorial: lighter hero, one restrained image, flatter ranking-driver/current-value/living-foundation sections, and explicit housing scope without a card-inside-card treatment.
- Comparison and methodology use dividers/sequence structure where possible instead of repeated boxed surfaces.
- `DestinationResult` is memoized and uses stable callbacks so map/list hover state does not needlessly rerender every destination card.
- Live Discover code no longer imports Framer Motion; simple CSS interaction states are sufficient for the product.
- The D3 world map is dynamically imported and the desktop copy is mounted only at desktop widths. On smaller screens the map chunk is not mounted until the user explicitly opens Map.
- The country-image proxy now returns a stable cache shape, prefers a smaller Pexels `large` asset over `large2x`, and sends shared/CDN stale-while-revalidate cache headers.
- A source sweep confirms no return of star ratings, visitor-arrival cards, frontend verdicts, legacy PPP Advantage presentation, frontend-created ranking scores, or comparison winners.

Detailed Phase 10 QA and release findings are recorded in `../docs/FRONTEND_PHASE_10_QA.md`.

Important: frontend v2 is complete, but the overall product should not be called model-frozen until the documented backend ranking-universe issue is resolved. `/api/rankings` still calls legacy `compute_scores()` before the Phase 7 ranking rebuild, so legacy score prerequisites can potentially affect country inclusion even though they no longer determine final ordering.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
