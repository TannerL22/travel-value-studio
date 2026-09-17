# Travel Value Studio

Travel Value Studio is a **quality-adjusted global purchasing-power discovery engine** for people who hold or earn in one currency and want to know where that money can buy an unusually high standard of day-to-day life.

The target use case is a stay of several weeks to several months. Airfare and travel time are intentionally outside scope.

The current product question is:

> **Where does the foreign currency I hold buy the most usable quality of life, with enough basic services and destination-service capacity to actually enjoy the purchasing-power advantage, and where is the FX timing unusually attractive right now?**

## Current model status

The project is at **Phase 4** of the model roadmap.

### Phase 1 — semantic/model-contract cleanup

Completed.

- Removed the artificial home-daily-spend input.
- Stopped presenting macro purchasing power as a predicted daily trip cost.
- Reframed the product around Structural Purchasing Power, Basic Comfort, Service Depth, Stability, and Quality-Adjusted Value.
- Preserved legacy validation outputs for reproducibility.

See `docs/PHASE_1_MODEL_CONTRACT.md`.

### Phase 2 — FX Opportunity v2

Completed.

FX Opportunity is a production ranking input rather than a display-only diagnostic. For the selected origin currency, the backend compares the current destination/origin cross with approximately 1 week, 1 month, 3 months, 1 year and 3 years ago. The resulting timing overlay is bounded to approximately **±15%** by default.

See `docs/PHASE_2_FX_OPPORTUNITY.md`.

### Phase 3 — Basic Comfort

Completed.

The production comfort floor uses direct evidence for drinking water, sanitation, electricity, internet and health-service coverage. Each pillar saturates after a strong modern baseline so already-developed countries do not receive endless additional rewards. Missing direct inputs blend toward a fixed legacy GDP-PPP proxy rather than being interpreted as bad living conditions.

See `docs/PHASE_3_BASIC_COMFORT.md`.

### Phase 4 — Service Depth

Completed.

International-arrivals volume is no longer the production Service Depth signal.

The preferred country-level source is the **World Economic Forum Travel & Tourism Development Index 2024 — Tourist Services and Infrastructure pillar**, which incorporates supply-side evidence such as:

- hotel-room density;
- short-term-rental listing density;
- hotel/restaurant labour productivity;
- travel-and-tourism capital investment intensity.

For countries outside TTDI coverage, arrivals per resident survive only as a capped, low-confidence fallback. Missing service evidence is neutral rather than being treated as poor service supply.

The Service Depth slider now controls only the **shortfall penalty**. The underlying destination score does not change when the user moves the slider.

See `docs/PHASE_4_SERVICE_DEPTH.md`.

## Core concepts

- **Structural Purchasing Power** — broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP. This is an index, not a personal budget forecast.
- **FX Opportunity** — bilateral origin-currency timing signal using 1W / 1M / 3M / 1Y / 3Y reference moves.
- **Basic Comfort** — direct-service floor using water, sanitation, electricity, internet and health evidence, with GDP PPP only as a missing-data fallback.
- **Service Depth** — production country-level service-supply measure using WEF TTDI Tourist Services and Infrastructure where available, with a reduced-confidence arrivals-per-capita fallback.
- **Stability** — currently WGI-led political stability, not a complete personal-safety or crime measure.
- **Quality-Adjusted Value** — structural score after comfort and service-depth shortfall penalties plus bounded FX timing, normalized to 0–100.

## Production ranking order

1. structural purchasing-power / cheapness score;
2. Phase 3 Basic Comfort shortfall penalty;
3. Phase 4 Service Depth shortfall penalty;
4. existing stability term;
5. bounded Phase 2 FX Opportunity overlay;
6. normalized Quality-Adjusted Value.

The old GDP comfort penalty and arrivals-led infrastructure term are retained only for legacy/audit fields and are neutralized in production scoring.

## Roadmap

1. **Phase 1 — semantic/model contract:** complete.
2. **Phase 2 — FX v2:** complete.
3. **Phase 3 — Basic Comfort:** complete.
4. **Phase 4 — Service Depth:** complete.
5. **Phase 5 — City Intelligence:** city universe plus direct amenity density.
6. **Phase 6 — Mobility / Digital Convenience:** public transport and digital-life layers.
7. **Phase 7 — Ranking rebuild and validation.**

## Project layout

```text
backend/   FastAPI API, data-source logic, scoring, FX Opportunity, Basic Comfort, Service Depth, validation
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
SERVICE_DEPTH_CACHE_TTL_SECONDS=86400
```

`ALLOW_ORIGINS=*` allows all origins with credentials disabled.

## Main data sources

Current production inputs include:

- **World Bank WDI** — GDP, PPP, private-consumption PPP, CPI/inflation fallback, official FX fallback, international arrivals, population, WGI political stability, and Phase 3 basic-service indicators.
- **WHO/UNICEF JMP via WDI** — safely managed/basic drinking water and sanitation.
- **World Bank / Tracking SDG7 via WDI** — electricity access.
- **ITU via WDI** — individuals using the internet.
- **WHO via WDI** — UHC service coverage index.
- **World Economic Forum TTDI 2024** — Tourist Services and Infrastructure pillar, the Phase 4 preferred service-supply source.
- **IMF DataMapper / WEO** — GDP and inflation where available.
- **RestCountries** — ISO3-to-primary-currency mapping.
- **Frankfurter** — current and historical FX, including Phase 2 1W / 1M / 3M / 1Y / 3Y bilateral FX Opportunity.
- **Optional TTDI-style local template** — legacy/sample tourism infrastructure, safety, and price-competitiveness fields when explicitly supplied.

The API exposes field-level provenance at:

- `GET /api/source-registry`
- `GET /api/methodology`

## Phase 4 service-depth audit fields

Ranking rows expose:

- `service_depth`
- `service_depth_direct`
- `service_depth_coverage`
- `service_depth_source`
- `service_depth_reference_year`
- `service_depth_penalty`
- `service_depth_requirement_threshold`
- `service_depth_ttdi_2024_value`
- `service_depth_ttdi_2024_rank`
- `service_depth_arrivals_per_100`
- `service_depth_arrivals_fallback_score`
- `service_depth_flags`
- `legacy_service_depth`
- `score_pre_service_depth`

## Phase 3 comfort audit fields

Ranking rows expose `basic_comfort`, direct-data coverage/source, pillar scores, flags, ranking penalty, and the fixed legacy GDP fallback used for missing-data blending.

## FX Opportunity audit fields

Ranking rows expose `fx_opportunity`, its -1 to +1 signal, bounded ranking multiplier, historical coverage/source, five horizon moves and dates, and `score_pre_fx_opportunity`.

## Validation

`backend/validation/` contains the existing Japan/Taiwan evidence and sensitivity scaffold. Legacy snapshots are preserved rather than rewritten after scoring changes so historical model behavior remains auditable.

## Checks

```powershell
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
python -m py_compile main.py data_sources.py source_registry.py model_contract.py fx_opportunity.py phase2_registry.py basic_comfort.py phase3_registry.py service_depth.py phase4_registry.py
python sanity_checks.py
python fx_opportunity_checks.py
python basic_comfort_checks.py
python service_depth_checks.py
```

GitHub Actions runs the same backend and frontend checks on pushes to `main` and pull requests.

## Important interpretation limits

Travel Value Studio is not yet a complete temporary-resident budget or city-quality model. Private-consumption PPP remains broad household-consumption data and furnished housing prices are not directly observed. Basic Comfort and Service Depth are materially better than the original GDP/arrivals proxies, but both remain country-level. TTDI service supply does not directly inventory the restaurants, supermarkets, gyms, pharmacies, coworking spaces, entertainment and neighborhood density that determine whether a three-month stay feels rich in practice.

That is the purpose of **Phase 5: City Intelligence and Amenity Depth**.
