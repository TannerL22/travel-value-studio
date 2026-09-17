# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 7 — Country Comparison: implemented.**

The frontend is being rebuilt around a product architecture rather than the original model-debugging dashboard.

### Phase 1 foundation

```text
app/
  page.tsx                 Discover
  country/[iso3]/page.tsx  Country detail
  compare/page.tsx         Comparison
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

### Phase 3 ranked results

Discover uses `DestinationResult.tsx` plus `lib/ranking-explanations.ts`. Result cards expose production rank, Quality-Adjusted Value, origin-relative purchasing power, bounded FX effect, and actual backend ranking drivers. Visitor arrivals, stars, value percentiles, hover-only metrics, and frontend-created verdict scores were removed.

`ranking-explanations.ts` never calculates a new rank. It only explains the backend factors already returned by the production model.

### Phase 4 integrated discovery map

Desktop Discover uses a synchronized map + ranking surface rather than separate map/results tabs. `WorldMap.tsx` retains the local GeoJSON and Equal Earth projection, uses a sequential Quality-Adjusted Value scale, and shares active-country state with `RankingList.tsx`.

On smaller screens the ranking remains primary and the map opens in a full-screen overlay.

### Phase 5 country detail

The temporary `DestinationModal` has been removed. Selecting a destination now navigates to an addressable route such as:

```text
/country/JPN?origin=GBR&value=0.70&comfort=0.55&services=0.65&stability=0.75
```

The active preference configuration therefore survives country navigation, browser back/forward, refreshes, and shared URLs.

Country detail is composed from decision-first sections: headline value context, actual ranking tailwinds/drags, purchasing power and FX timing, living foundations, city shortlist, then confidence and limitations. Furnished 30–90 day temporary housing, travel-to-destination cost, and comprehensive personal-safety risk remain explicitly outside the score.

### Phase 6 city shortlist

The technical `CityIntelligencePanel` has been removed. Country detail now uses:

```text
components/country/
  CityShortlist.tsx
  CityCard.tsx
```

The shortlist answers a narrower product question: which of the returned major-city candidates is worth investigating first? It preserves the backend City Usability score and candidate rank rather than creating a frontend city score.

Each primary city card shows candidate rank, City Usability, population, evidence coverage, the strongest observed amenity categories, and explicitly labeled **National mobility context** / **National digital context**. Raw amenity, density, area, and GTFS catalog evidence is available behind `View city evidence`.

The first three candidates are shown by default, with the remaining returned candidates available through `Show all`. The interface explicitly states that this is not an exhaustive ranking of every city or hidden gem.

### Phase 7 country comparison

Comparison is now a dedicated, shareable route rather than an overlay:

```text
/compare?origin=GBR&value=0.70&comfort=0.55&services=0.65&stability=0.75&countries=JPN,THA,MYS
```

The route preserves the same reference market and preference settings used by Discover and country detail. Users can add or remove up to three destinations and the `countries` query parameter updates automatically.

Phase 7 adds:

```text
components/compare/
  CompareClient.tsx
  CompareSelector.tsx
  ComparisonMatrix.tsx
  TradeoffSummary.tsx

lib/
  comparison.ts
```

The comparison page intentionally does **not** calculate another score or declare a winner. It shows the same production country evidence side-by-side — Quality-Adjusted Value, purchasing power, bounded FX rank effect, Basic Comfort, Service Depth, Political Stability and data quality — then generates factual difference statements such as one destination having higher purchasing power or a higher observed comfort score.

`lib/comparison.ts` is interpretation-only. It reads existing backend fields and describes spreads between selected countries; it never changes country order or weights.

Discover now has a preference-preserving Compare entry point. Country detail also exposes `Compare this destination`, opening the comparison route with that country preselected and the current model configuration intact.

The comparison page repeats the major scope caveats: temporary furnished housing, travel-to-destination cost, visa feasibility and comprehensive personal-safety risk are not part of the country value score.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
