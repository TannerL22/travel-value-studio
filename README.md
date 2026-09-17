# Travel Value Studio

Travel Value Studio is a **quality-adjusted global purchasing-power discovery engine** for people who hold or earn in one currency and want to know where that money can buy an unusually high standard of day-to-day life.

The target use case is a stay of several weeks to several months. Airfare and travel time are intentionally outside scope.

The current product question is:

> **Where does the foreign currency I hold buy the most usable quality of life, without mistaking weak basic living conditions for value, and where is the FX timing unusually attractive right now?**

## Current model status

The project is at **Phase 3** of the model roadmap.

### Phase 1 — semantic/model-contract cleanup

Completed.

- Removed the artificial home-daily-spend input.
- Stopped presenting macro purchasing power as a predicted daily trip cost.
- Reframed the product around Structural Purchasing Power, Basic Comfort, Service Depth, Stability, and Quality-Adjusted Value.
- Preserved legacy validation outputs for reproducibility.

See `docs/PHASE_1_MODEL_CONTRACT.md`.

### Phase 2 — FX Opportunity v2

Completed.

FX Opportunity is a production ranking input rather than a display-only diagnostic. For the selected origin currency, the backend compares the current destination/origin cross with approximately 1 week, 1 month, 3 months, 1 year and 3 years ago. Those bilateral moves are combined into a bounded timing signal; by default FX can adjust the structural score by up to approximately **±15%**.

See `docs/PHASE_2_FX_OPPORTUNITY.md`.

### Phase 3 — Basic Comfort

Completed.

The production comfort floor now uses direct basic-service evidence rather than GDP PPP as the main signal:

- safely managed drinking water, with at-least-basic water as a down-weighted fallback;
- safely managed sanitation, with at-least-basic sanitation as a down-weighted fallback;
- electricity access;
- internet use;
- UHC service coverage.

Each pillar saturates after a strong modern baseline so already-developed countries do not receive endless additional rewards. Missing direct inputs blend toward the old GDP-PPP comfort proxy rather than being interpreted as bad living conditions.

The production ranking order is now structural value → Basic Comfort penalty → bounded FX Opportunity overlay.

See `docs/PHASE_3_BASIC_COMFORT.md`.

## Core concepts

- **Structural Purchasing Power** — broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP. This is an index, not a personal budget forecast.
- **FX Opportunity** — bilateral origin-currency timing signal using 1W / 1M / 3M / 1Y / 3Y reference moves.
- **Basic Comfort** — production Phase 3 service-floor composite using water, sanitation, electricity, internet and health evidence, with GDP PPP only as a missing-data fallback.
- **Service Depth** — currently mainly an international-arrivals proxy; Phase 4 will replace this with measured amenity and service supply.
- **Stability** — currently WGI-led political stability, not a complete personal-safety or crime measure.
- **Quality-Adjusted Value** — structural score after the Basic Comfort penalty and bounded FX timing overlay, normalized to 0–100.

## Roadmap

1. **Phase 1 — semantic/model contract:** complete.
2. **Phase 2 — FX v2:** complete.
3. **Phase 3 — Basic Comfort:** complete.
4. **Phase 4 — Service Depth:** amenity, accommodation, and tourism-service supply.
5. **Phase 5 — City Intelligence:** city universe plus amenity density.
6. **Phase 6 — Mobility / Digital Convenience:** public transport and digital-life layers.
7. **Phase 7 — Ranking rebuild and validation.**

## Project layout

```text
backend/   FastAPI API, data-source logic, scoring, FX Opportunity, Basic Comfort, validation
frontend/  Next.js dashboard UI
docs/      model contracts and methodology notes
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

API docs: `http://127.0.0.1:8000/docs`

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

Backend options:

```text
ALLOW_ORIGINS=http://localhost:3000
DATASET_CACHE_TTL_SECONDS=43200
FX_OPPORTUNITY_CACHE_TTL_SECONDS=3600
FX_OPPORTUNITY_MAX_EFFECT=0.15
BASIC_COMFORT_CACHE_TTL_SECONDS=43200
```

`ALLOW_ORIGINS=*` allows all origins with credentials disabled.

## Main data sources

Current production inputs include:

- **World Bank WDI** — GDP, PPP, private-consumption PPP, CPI/inflation fallback, official FX fallback, international arrivals, WGI political stability, and the Phase 3 basic-service indicators.
- **WHO/UNICEF JMP via WDI** — safely managed/basic drinking water and sanitation.
- **World Bank / Tracking SDG7 via WDI** — electricity access.
- **ITU via WDI** — individuals using the internet.
- **WHO via WDI** — UHC service coverage index.
- **IMF DataMapper / WEO** — GDP and inflation where available.
- **RestCountries** — ISO3-to-primary-currency mapping.
- **Frankfurter** — current and historical FX. Phase 2 uses the v2 blended reference-rate feed for 1W / 1M / 3M / 1Y / 3Y bilateral FX Opportunity.
- **Optional TTDI-style local template** — legacy/sample tourism infrastructure, safety, and price-competitiveness fields when explicitly supplied.

The API exposes field-level provenance at:

- `GET /api/source-registry`
- `GET /api/methodology`

## Phase 3 comfort audit fields

Ranking rows expose:

- `basic_comfort`: production 0–100 comfort score.
- `basic_comfort_direct`: direct-service composite before legacy fallback blending.
- `basic_comfort_coverage`: reliability-weighted direct-data coverage.
- `basic_comfort_source`: direct, blended direct/legacy, or legacy fallback.
- `basic_comfort_flags`: row-level missing/fallback flags.
- `basic_comfort_penalty`: preference-weighted ranking multiplier.
- `legacy_basic_comfort`: retained old GDP-PPP component for auditability.
- `comfort_water_score`, `comfort_sanitation_score`, `comfort_electricity_score`, `comfort_internet_score`, `comfort_health_score`.
- the corresponding raw source fields and source years.

## FX Opportunity audit fields

Ranking rows expose:

- `fx_opportunity`: 0–100 timing score.
- `fx_opportunity_signal`: underlying -1 to +1 signal.
- `fx_opportunity_multiplier`: bounded production ranking multiplier.
- `fx_opportunity_coverage`: weighted share of configured horizons with usable data.
- `fx_opportunity_source`: v2 bilateral history, legacy historical fallback, or unavailable.
- `fx_opportunity_1w_pct`, `1m_pct`, `3m_pct`, `1y_pct`, `3y_pct`.
- matching reference-date fields for each horizon.
- `score_pre_fx_opportunity`: structural production score before the timing overlay.

Legacy 1Y/3Y FX fields remain available for historical validation and fallback behavior.

## Validation

`backend/validation/` contains the existing Japan/Taiwan evidence and sensitivity scaffold. It includes official visitor-spend evidence, model-driver diagnostics, deterministic snapshots, and sensitivity runs designed to test whether the model confuses weak currencies with genuinely useful purchasing power.

Legacy snapshots are preserved rather than rewritten after scoring changes. New production rankings can therefore evolve while historical validation outputs remain reproducible.

## Checks

```powershell
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
python -m py_compile main.py data_sources.py source_registry.py model_contract.py fx_opportunity.py phase2_registry.py basic_comfort.py phase3_registry.py
python sanity_checks.py
python fx_opportunity_checks.py
python basic_comfort_checks.py
```

GitHub Actions runs the same backend and frontend checks on pushes to `main` and pull requests.

## Important interpretation limits

Travel Value Studio is not currently a complete cost-of-living or temporary-resident budget model. Private-consumption PPP remains broad household-consumption data and furnished housing is not yet directly observed. Basic Comfort is materially more direct than the old GDP proxy but remains country-level; electricity access does not measure outage reliability, internet use does not measure speed/latency, and UHC does not guarantee traveller-specific healthcare access. Service Depth is still a temporary arrivals-led proxy, and reference FX rates are not executable card/cash quotes.

The intended use is **destination discovery and relative value screening**, with increasingly direct city-, service-, housing- and mobility-level inputs added in later phases.
