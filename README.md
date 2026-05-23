# Travel Value Studio

Travel Value Studio ranks countries by travel value from a chosen home country. The backend builds a country dataset from World Bank, IMF, RestCountries, and FX data; the frontend turns those rankings into a dashboard with filters, cards, a map, destination detail, and comparison views.

## Project Layout

```text
backend/   FastAPI API and ranking/data-source logic
frontend/  Next.js dashboard UI
```

## Requirements

- Python 3.11+
- Node.js 20+
- npm

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API docs are available at `http://127.0.0.1:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

`frontend/.env.local`:

```text
PEXELS_API_KEY=your_key_here
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Backend CORS can be configured with `ALLOW_ORIGINS` as a comma-separated list. It defaults to `http://localhost:3000`. Use `ALLOW_ORIGINS=*` to allow all origins, with credentials disabled.

## Useful Commands

```powershell
# Frontend checks
cd frontend
npm run lint
npm run build

# Backend syntax check
cd backend
.\.venv\Scripts\python.exe -m py_compile main.py data_sources.py source_registry.py

# Minimal backend sanity checks
.\.venv\Scripts\python.exe sanity_checks.py
```

## Data Methodology / Source Registry

The backend has a source registry in `backend/source_registry.py`. It documents each current dataset field with a user-facing label, source, indicator/API identifier, frequency, geographic level, field type, meaning, caveat, and recommended confidence level.

Current sources include:

- World Bank WDI for GDP, PPP, private-consumption PPP, CPI/inflation fallback, official FX fallback, international arrivals, and WGI political stability.
- IMF DataMapper / WEO for GDP and inflation where available.
- RestCountries for mapping ISO3 country codes to currency codes.
- Frankfurter for latest, one-year, and three-year USD-based FX references, with a legacy live FX endpoint and WDI annual FX as fallback.
- Optional TTDI-style local template fields for tourism infrastructure, safety, and price competitiveness.

The registry separates field types:

- `observed`: pulled directly from a source series or API.
- `derived`: calculated from other fields, such as `tourism_pp_power`.
- `fallback`: a backup source is used when the preferred source is unavailable.
- `nowcast`: estimated forward from older data, such as private-consumption PPP adjusted by inflation differentials.

Ranking rows include simple data-quality fields:

- `data_quality_score`: 0-100 quality score.
- `data_quality_grade`: A/B/C/D grade.
- `data_quality_flags`: machine-readable caveats such as `fx_fallback_wdi`, `ppp_nowcast`, or `missing_arrivals`.

Ranking rows also expose named component scores on a 0-100 scale:

- `component_fx_tailwind`: historical FX support from Frankfurter latest rates versus one-year and three-year USD reference rates where available. Currencies without Frankfurter history still fall back to the older current-model proxy. True real-effective valuation still needs a future BIS NEER/REER module.
- `component_ppp_advantage`: broad local price advantage from FX versus private-consumption PPP, with optional price-competitiveness input when available.
- `component_comfort_floor`: penalty/boost from PPP income floor used to avoid over-ranking very low-comfort destinations.
- `component_tourism_depth`: arrivals and optional tourism infrastructure signal.
- `component_safety_stability`: WGI political stability plus optional safety input.
- `component_overall_value`: normalized version of the current model's overall score.

Ranking rows also include a first-pass FX diagnostic:

- `fx_tailwind_1y_pct` and `fx_tailwind_3y_pct`: percent change in local-currency units per USD versus the Frankfurter one-year and three-year reference dates.
- `fx_tailwind_recent_ratio`: average of the one-year and three-year FX ratios.
- `fx_tailwind_interpretation`: short label explaining whether the USD is stronger, weaker, or near recent history.
- `component_fx_tailwind_source`: whether the FX Tailwind component used historical FX data or the model proxy.
- `fx_tailwind_origin_*`: additive destination-vs-origin FX diagnostics computed from the selected origin currency. These fields do not change the ranking score yet.

Data-quality flags also identify missing historical FX, proxy-based FX Tailwind, and missing FX reference dates when those diagnostics cannot be built.

Methodology metadata is also available from the API:

- `GET /api/source-registry`: field-level source metadata.
- `GET /api/methodology`: component definitions, current model status, and known limitations.

Important limitation: current daily-cost outputs are model estimates derived from macro purchasing-power, FX, tourism-depth, and scarcity proxies. They are not observed tourist basket costs for hotels, meals, local transport, or attractions. The source registry is the foundation for later work to separate weak currencies from genuinely cheap trips.

## Notes

- Live FX uses a public FX endpoint plus RestCountries to map ISO3 country codes to currencies.
- Historical FX Tailwind uses Frankfurter's latest, one-year, and three-year USD-base reference rates where available.
- PPP and GDP inputs are annual series, even when live FX is enabled.
- If a source API blocks requests, backend ranking falls back where possible to official World Bank data.
