# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 6 — City Shortlist: implemented.**

The frontend is being rebuilt around a product architecture rather than the original model-debugging dashboard.

### Phase 1 foundation

```text
app/
  page.tsx                 Discover
  country/[iso3]/page.tsx  Country detail
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

Each primary city card shows:

- candidate rank within the returned country set;
- City Usability;
- population;
- evidence-coverage label;
- the three highest observed amenity-category scores;
- **National mobility context** and **National digital context**, explicitly avoiding the claim that these are direct city-level transit/digital measurements.

The first three candidates are shown by default, with the remaining returned candidates available through `Show all`. The interface explicitly states that this is not an exhaustive ranking of every city or hidden gem.

Raw evidence is available behind `View city evidence`: all six amenity categories, city-specific Amenity Depth, reference area, observed amenity density, and positive/unknown GTFS catalog evidence. A missing GTFS match is described as unknown rather than evidence that the city lacks public transport.

City Usability remains separate from the country Quality-Adjusted Value ranking and temporary housing remains unmodeled.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
