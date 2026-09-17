# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 5 — Country Detail: implemented.**

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

Country detail is composed from:

```text
components/country/
  CountryDetailClient.tsx
  CountryHero.tsx
  RankingDrivers.tsx
  ValueSummary.tsx
  LivingFoundations.tsx
  EvidenceSummary.tsx
```

The page hierarchy is intentionally decision-first:

1. headline rank / value / purchasing power / FX context;
2. actual ranking tailwinds and drags;
3. current purchasing power and currency timing;
4. comfort, service depth, and political-stability foundations;
5. city candidates;
6. data confidence and explicit model limitations.

The page explicitly states that furnished 30–90 day temporary housing is not modeled. Travel-to-destination cost and comprehensive personal-safety risk also remain outside the score. Legacy PPP-component cards, “similar profile” suggestions, “higher value” lists, and internal Phase labels are not part of the country experience.

Country imagery is fetched only on the country page rather than across the ranking list. City Intelligence remains a second-stage country drill-down; its full consumer presentation is the focus of Frontend Phase 6.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
