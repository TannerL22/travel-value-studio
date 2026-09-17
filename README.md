# Travel Value Studio

Travel Value Studio is a **quality-adjusted global purchasing-power discovery engine** for people who hold or earn in one currency and want to know where that money can buy an unusually high standard of day-to-day life.

The target use case is a stay of several weeks to several months. Airfare and travel time are intentionally outside scope.

The current product question is:

> **Where does the foreign currency I hold buy the most usable quality of life, and within an attractive country which cities actually give me dense, useful day-to-day choice?**

## Current model status

The project is at **Phase 5** of the model roadmap.

### Phase 1 — semantic/model-contract cleanup

Completed. The artificial home-daily-spend framing was removed and macro purchasing power is no longer presented as a predicted daily trip cost.

See `docs/PHASE_1_MODEL_CONTRACT.md`.

### Phase 2 — FX Opportunity v2

Completed. The selected origin currency is compared against destination currencies over approximately 1 week, 1 month, 3 months, 1 year and 3 years. The bilateral timing overlay can affect rankings but is bounded to approximately **±15%** by default.

See `docs/PHASE_2_FX_OPPORTUNITY.md`.

### Phase 3 — Basic Comfort

Completed. The production comfort floor uses direct evidence for drinking water, sanitation, electricity, internet and health-service coverage. Pillars saturate after a strong modern baseline and GDP PPP is retained only as a missing-data fallback.

See `docs/PHASE_3_BASIC_COMFORT.md`.

### Phase 4 — Service Depth

Completed. International-arrivals volume is no longer the primary production Service Depth signal. WEF TTDI 2024 Tourist Services & Infrastructure is preferred; arrivals per resident are only a capped, reduced-confidence fallback outside TTDI coverage.

See `docs/PHASE_4_SERVICE_DEPTH.md`.

### Phase 5 — City Intelligence

Completed as a **city-discovery layer**.

The country ranking remains the first screen. When a country is opened, the backend can now compare major cities using:

- the JRC **GHS-WUP-MTUC R2025A V1.1** / UN WUP 2025 harmonized urban-centre framework;
- 2025 city population, land area, built-up area and population-weighted centroids;
- the latest **Overture Maps Places** release;
- high-confidence POI density across food & drink, shopping, health care, recreation/culture, lifestyle services and lodging;
- both per-capita and spatial amenity density, with saturation and a diversity adjustment.

Amenity Depth is **not yet part of the country ranking**. Overture coverage varies by geography, so missing or thin observed POI data cannot safely be interpreted as poor city life. Failed queries remain unavailable rather than being scored as zero.

See `docs/PHASE_5_CITY_INTELLIGENCE.md`.

## Core concepts

- **Structural Purchasing Power** — broad destination purchasing power relative to the selected origin using market FX and private-consumption PPP.
- **FX Opportunity** — bilateral origin-currency timing signal using 1W / 1M / 3M / 1Y / 3Y reference moves.
- **Basic Comfort** — direct-service floor using water, sanitation, electricity, internet and health evidence.
- **Service Depth** — country-level accommodation and established visitor-service supply.
- **City Amenity Depth** — city-level discovery score using direct POI density and diversity; currently drill-down only.
- **Stability** — currently WGI-led political stability, not a complete personal-safety or crime measure.
- **Quality-Adjusted Value** — structural country score after comfort/service shortfall penalties and bounded FX timing.

## Production country-ranking order

1. structural purchasing-power / cheapness score;
2. Phase 3 Basic Comfort shortfall penalty;
3. Phase 4 Service Depth shortfall penalty;
4. existing stability term;
5. bounded Phase 2 FX Opportunity overlay;
6. normalized Quality-Adjusted Value.

Phase 5 city amenities do not alter this country ordering yet.

## Roadmap

1. **Phase 1 — semantic/model contract:** complete.
2. **Phase 2 — FX v2:** complete.
3. **Phase 3 — Basic Comfort:** complete.
4. **Phase 4 — Service Depth:** complete.
5. **Phase 5 — City Intelligence:** complete as a drill-down layer.
6. **Phase 6 — Mobility / Digital Convenience:** public transport and digital-life layers.
7. **Phase 7 — Ranking rebuild and validation.**

## Project layout

```text
backend/   FastAPI API, country scoring, FX Opportunity, Basic Comfort, Service Depth, City Intelligence, validation
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

Backend options include:

```text
ALLOW_ORIGINS=http://localhost:3000
DATASET_CACHE_TTL_SECONDS=43200
FX_OPPORTUNITY_CACHE_TTL_SECONDS=3600
FX_OPPORTUNITY_MAX_EFFECT=0.15
BASIC_COMFORT_CACHE_TTL_SECONDS=43200
SERVICE_DEPTH_CACHE_TTL_SECONDS=86400
CITY_DATA_CACHE_TTL_SECONDS=604800
OVERTURE_AMENITY_CACHE_TTL_SECONDS=604800
OVERTURE_CONFIDENCE_MIN=0.75
CITY_CANDIDATE_LIMIT=12
CITY_AMENITY_MAX_WORKERS=4
```

## Main data sources

Current inputs include:

- **World Bank WDI** — GDP, PPP, private-consumption PPP, inflation/FX fallbacks, population, WGI political stability and Phase 3 basic-service indicators.
- **WHO/UNICEF JMP via WDI** — drinking water and sanitation.
- **World Bank / Tracking SDG7 via WDI** — electricity access.
- **ITU via WDI** — internet use.
- **WHO via WDI** — UHC service coverage.
- **World Economic Forum TTDI 2024** — Phase 4 Tourist Services & Infrastructure pillar.
- **European Commission JRC GHS-WUP-MTUC R2025A V1.1 / UN WUP 2025 framework** — Phase 5 harmonized city universe and 2025 population/area/centroids.
- **Overture Maps Places** — latest-release city amenity inventories for Phase 5.
- **IMF DataMapper / WEO** — GDP and inflation where available.
- **RestCountries** — ISO3-to-primary-currency mapping.
- **Frankfurter** — current and historical FX for Phase 2.

The API exposes provenance at:

- `GET /api/source-registry`
- `GET /api/methodology`
- `GET /api/cities/{country_iso3}` — Phase 5 city drill-down (`limit` and `include_amenities` supported).

## Phase 5 city audit fields

City rows expose the GHS-WUP city identifiers and denominators plus `amenity_depth`, `amenity_rank_within_country`, total and category POI counts/densities/scores, Overture release/confidence threshold, query success, footprint method/radius and row-level flags.

The current amenity footprint is an **equivalent-area circle around the official population-weighted centroid**. It is materially cleaner than counting an entire bounding rectangle, but exact GHS-WUP polygons remain a future precision upgrade.

## Validation

`backend/validation/` preserves the existing Japan/Taiwan evidence and sensitivity scaffold. Legacy snapshots are not rewritten after scoring changes so historical model behavior remains auditable.

## Checks

```powershell
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
python -m py_compile main.py data_sources.py source_registry.py model_contract.py fx_opportunity.py phase2_registry.py basic_comfort.py phase3_registry.py service_depth.py phase4_registry.py city_intelligence.py phase5_registry.py
python sanity_checks.py
python fx_opportunity_checks.py
python basic_comfort_checks.py
python service_depth_checks.py
python city_intelligence_checks.py
```

GitHub Actions runs the backend and frontend checks on pushes to `main` and pull requests.

## Important interpretation limits

Travel Value Studio is still a discovery/screening model rather than a complete temporary-resident budget model. Furnished housing prices are not yet directly observed. Country-level comfort/service measures can hide large local differences, while Phase 5 POI counts measure amenity **presence and density**, not quality, price, opening hours, accessibility or transit convenience.

Overture provider coverage also varies by geography. A successful query means evidence was retrieved; it does not mean mapping coverage is complete.

Phase 6 therefore focuses on **Mobility and Digital Convenience**, allowing the city layer to distinguish a dense catalogue of places from amenities that are genuinely easy to reach and use.
