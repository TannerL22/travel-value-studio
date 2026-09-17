# Frontend

Next.js application for Travel Value Studio.

## Frontend v2 status

**Phase 1 — Foundation & application shell: implemented.**

The frontend is being rebuilt around a product architecture rather than the original model-debugging dashboard. Phase 1 intentionally preserves the current discovery cards, map and a compatibility country modal while replacing the underlying application structure.

### Phase 1 architecture

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

The former fixed 320px sidebar / `ml-80` layout has been removed. Controls now sit in the normal document flow and the shared shell is responsive. Phase 2 will replace these compatibility controls with the final semantic Preference Bar + Preference Drawer experience.

## Commands

```powershell
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend is not running on `http://127.0.0.1:8000`.
