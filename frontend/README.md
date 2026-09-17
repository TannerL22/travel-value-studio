# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 2 — Preference UX: implemented.**

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

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
