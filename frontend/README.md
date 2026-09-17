# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 4 — Integrated Discovery Map: implemented.**

The frontend is being rebuilt around a product architecture rather than the original model-debugging dashboard.

### Phase 1 foundation

```text
app/
  page.tsx                 Discover
  country/[iso3]/page.tsx  Country-detail route scaffold
  compare/page.tsx         Comparison route scaffold
  methodology/page.tsx     Methodology route scaffold

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

The old compatibility `ControlPanel` has been removed and replaced with:

```text
components/preferences/
  PreferenceBar.tsx
  PreferenceDrawer.tsx
```

The collapsed Preference Bar shows the selected reference market/currency plus semantic summaries for Value, Comfort, Services, and Stability. Users no longer need to interpret raw coefficient values such as `0.65`.

The responsive Preference Drawer opens as a bottom sheet on smaller screens and a right-side panel on larger screens. It preserves the exact continuous 0–1 backend parameters while presenting plain-language states such as `Flexible`, `Balanced`, `High`, `Very high`, and `Ignore`. Changes update rankings immediately and continue to persist through the URL.

`lib/preferences.ts` is the single frontend definition for preference labels, semantic state mapping, URL serialization/parsing, and reset behavior. Resetting preferences leaves the selected reference market and year intact.

### Phase 3 ranked results

The photo-heavy `DestinationCard` has been removed. Discover now uses:

```text
components/discover/
  DestinationResult.tsx

lib/
  ranking-explanations.ts
```

Each result exposes the backend value rank, Quality-Adjusted Value score, origin-relative purchasing power, bounded FX ranking effect, and direct Comfort / Services / Stability evidence. The card no longer displays visitor arrivals, star ratings, value percentiles, hover-only metrics, or frontend-invented verdicts such as `Strong Arbitrage`.

`lib/ranking-explanations.ts` does not calculate a new score. It reads the actual Phase 7 multiplicative ranking effects already returned by the backend:

- `structural_value_factor`
- `basic_comfort_penalty`
- `service_depth_penalty`
- `stability_penalty`
- `fx_opportunity_multiplier`

It then identifies the largest observed tailwind and drag for explanatory display only. The backend remains the sole source of ranking order and score.

Country imagery is no longer fetched for the entire ranking list. While the compatibility country modal remains in use, Pexels is requested only when a user opens a destination. Phase 5 will replace that modal with the full country-detail route.

### Phase 4 integrated discovery map

Desktop Discover now uses a persistent two-column discovery surface rather than separate Results / Map tabs:

```text
components/discover/
  RankingList.tsx
  DestinationResult.tsx

components/
  WorldMap.tsx
```

The map occupies the larger side of the desktop layout and remains visible while the ranked destination list scrolls independently. Hovering or keyboard-focusing a result highlights the same country on the map; hovering or focusing a map country highlights the matching result. Both sides use the same ISO3/country key and the backend's existing global value rank.

`WorldMap.tsx` retains the local GeoJSON and Equal Earth projection, but now uses a calmer single-hue sequential Quality-Adjusted Value scale. Its tooltip exposes only production fields: global rank, value score, origin-relative purchasing power, and FX ranking effect. The map does not change meaning when the list is sorted by purchasing power or stability; map color always remains Quality-Adjusted Value.

On smaller screens the ranking remains primary. A Map button opens a full-screen discovery overlay, with Escape/close handling and body-scroll locking. Selecting a country from that map opens the existing country-detail compatibility modal.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
