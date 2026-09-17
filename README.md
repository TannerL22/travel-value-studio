# Travel Value Studio

Travel Value Studio is a **quality-adjusted global purchasing-power discovery engine** for people who hold or earn in one currency and want to know where that money can buy an unusually high standard of day-to-day life.

The target use case is a stay of several weeks to several months. Airfare and travel time are intentionally outside scope.

The current product question is:

> **Where does the foreign currency I hold buy the most usable quality of life, and where is the FX timing unusually attractive right now?**

## Current model status

The project is at **Phase 2** of the model roadmap.

### Phase 1 — semantic/model-contract cleanup

Completed.

- Removed the artificial home-daily-spend input.
- Stopped presenting macro purchasing power as a predicted daily trip cost.
- Reframed the product around Structural Purchasing Power, Basic Comfort, Service Depth, Stability, and Quality-Adjusted Value.
- Preserved legacy validation outputs for reproducibility.

See `docs/PHASE_1_MODEL_CONTRACT.md`.

### Phase 2 — FX Opportunity v2

Completed.

FX Opportunity is now a production ranking input rather than a display-only diagnostic.

For the selected origin currency, the backend compares the current destination/origin cross with approximately:

- 1 week ago;
- 1 month ago;
- 3 months ago;
- 1 year ago;
- 3 years ago.

Those bilateral moves are combined into a bounded timing signal. By default, FX can adjust the structural score by up to approximately **±15%**. This allows a meaningful currency shock to change rankings without letting short-term FX overwhelm underlying purchasing power, comfort, service depth, or stability.

See `docs/PHASE_2_FX_OPPORTUNITY.md`.

## Core concepts

- **Structural Purchasing Power** — broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP. This is an index, not a personal budget forecast.
- **FX Opportunity** — bilateral origin-currency timing signal using 1W / 1M / 3M / 1Y / 3Y reference moves.
- **Basic Comfort** — currently the legacy GDP-PPP development floor; Phase 3 will replace this with direct basic-services data.
- **Service Depth** — currently mainly an international-arrivals proxy; Phase 4 will replace this with measured amenity and service supply.
- **Stability** — currently WGI-led political stability, not a complete personal-safety or crime measure.
- **Quality-Adjusted Value** — structural score after the bounded FX timing overlay, normalized to 0–100.

## Roadmap

1. **Phase 1 — semantic/model contract:** complete.
2. **Phase 2 — FX v2:** complete.
3. **Phase 3 — Basic Comfort:** water, sanitation, electricity, connectivity, and health.
4. **Phase 4 — Service Depth:** amenity, accommodation, and tourism-service supply.
5. **Phase 5 — City Intelligence:** city universe plus amenity density.
6. **Phase 6 — Mobility / Digital Convenience:** public transport and digital-life layers.
7. **Phase 7 — Ranking rebuild and validation.**

## Project layout

```text
backend/   FastAPI API, data-source logic, scoring, FX Opportunity, validation
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
```

`ALLOW_ORIGINS=*` allows all origins with credentials disabled.

## Main data sources

Current production inputs include:

- **World Bank WDI** — GDP, PPP, private-consumption PPP, CPI/inflation fallback, official FX fallback, international arrivals, and WGI political stability.
- **IMF DataMapper / WEO** — GDP and inflation where available.
- **RestCountries** — ISO3-to-primary-currency mapping.
- **Frankfurter** — current and historical FX. Phase 2 uses the v2 blended reference-rate feed for 1W / 1M / 3M / 1Y / 3Y bilateral FX Opportunity.
- **Optional TTDI-style local template** — legacy/sample tourism infrastructure, safety, and price-competitiveness fields when explicitly supplied.

The API exposes field-level provenance at:

- `GET /api/source-registry`
- `GET /api/methodology`

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

Phase 2 deliberately preserves those legacy snapshots rather than rewriting history after the scoring change. New production rankings can therefore evolve while old validation results remain reproducible.

## Checks

```powershell
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
python -m py_compile main.py data_sources.py source_registry.py model_contract.py fx_opportunity.py phase2_registry.py
python sanity_checks.py
python fx_opportunity_checks.py
```

GitHub Actions runs the same backend and frontend checks on pushes to `main` and pull requests.

## Important interpretation limits

Travel Value Studio is not currently a complete cost-of-living or temporary-resident budget model. Private-consumption PPP remains broad household-consumption data, furnished housing is not yet directly observed, Basic Comfort and Service Depth still rely on temporary proxies, and reference FX rates are not executable card/cash quotes.

The intended use is **destination discovery and relative value screening**, with increasingly direct quality-of-life inputs added in later phases.
