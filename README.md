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

# Japan/Taiwan validation scaffold checks
.\.venv\Scripts\python.exe validation\run_validation_checks.py
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

- `component_fx_tailwind`: preferred signal is destination-currency movement versus the selected origin currency using Frankfurter historical cross rates. It falls back to the USD-based Frankfurter signal, then to the current model proxy. This is still not a tourist basket, not BIS NEER/REER, and not adjusted for tourist-facing inflation.
- `component_ppp_advantage`: broad local price advantage from FX versus private-consumption PPP, with optional price-competitiveness input when available.
- `component_comfort_floor`: penalty/boost from PPP income floor used to avoid over-ranking very low-comfort destinations.
- `component_tourism_depth`: arrivals and optional tourism infrastructure signal.
- `component_safety_stability`: WGI political stability plus optional safety input.
- `component_overall_value`: normalized version of the current model's overall score.

Ranking rows also include a first-pass FX diagnostic:

- `fx_tailwind_1y_pct` and `fx_tailwind_3y_pct`: percent change in local-currency units per USD versus the Frankfurter one-year and three-year reference dates.
- `fx_tailwind_recent_ratio`: average of the one-year and three-year FX ratios.
- `fx_tailwind_interpretation`: short label explaining whether the USD is stronger, weaker, or near recent history.
- `component_fx_tailwind_source`: whether the FX Tailwind component used `origin_historical_fx`, `usd_historical_fx`, or `model_proxy`.
- `fx_tailwind_origin_*`: destination-vs-origin FX diagnostics computed from the selected origin currency. These are now preferred for `component_fx_tailwind` where available.

Data-quality flags also identify missing historical FX, proxy-based FX Tailwind, and missing FX reference dates when those diagnostics cannot be built.

Methodology metadata is also available from the API:

- `GET /api/source-registry`: field-level source metadata.
- `GET /api/methodology`: component definitions, current model status, and known limitations.

Important limitation: current daily-cost outputs are model estimates derived from macro purchasing-power, FX, tourism-depth, and scarcity proxies. They are not observed tourist basket costs for hotels, meals, local transport, or attractions. The source registry is the foundation for later work to separate weak currencies from genuinely cheap trips.

## Japan/Taiwan Validation Scaffold

`backend/validation/` defines the evidence structure for testing whether the model can explain the difference between a cheap currency and an actually good tourist-value trip. The first validation case is Japan versus Taiwan.

This scaffold does not prove whether Japan or Taiwan is better value yet. It includes:

- `japan_taiwan_validation_methodology.md`: validation question, evidence tiers, and falsification criteria.
- `japan_taiwan_basket_template.csv`: tourist-basket rows for accommodation, food/drink, transport, attractions, connectivity, and miscellaneous costs, with explicit placeholder/observed status fields.
- `japan_taiwan_source_register.csv`: official-source candidates and exact Japan source paths where currently known.
- `japan_official_visitor_spend.csv`: Japan Tourism Agency Calendar Year 2025 visitor-spend data parsed from the official International Visitor Survey workbook, Annex 2.
- `japan_official_length_of_stay.csv`: Japan Tourism Agency Calendar Year 2025 average nights parsed from the official workbook, Table 4-1.
- `japan_official_visitor_spend_per_day.csv`: derived per-day spend estimates where official spend and average-nights origin markets match.
- `japan_official_visitor_spend_summary.csv`: compact official/derived summary for Total, UK, Taiwan, and United States origin markets.
- `taiwan_official_visitor_spend.csv`: Taiwan Tourism Administration 2024 visitor-spend headline and broad category data from the official survey summary PDF.
- `taiwan_official_length_of_stay.csv`: Taiwan Tourism Administration 2024 average stay from the official survey summary PDF.
- `taiwan_official_visitor_spend_per_day.csv`: officially reported Taiwan per-day spend values, with TWD category values derived from the report's official exchange-rate note where needed.
- `taiwan_official_visitor_spend_summary.csv`: compact Taiwan Total-market summary.
- `japan_taiwan_official_comparison_summary.csv`: first official local-currency comparison across fields available for both countries.
- `validation_fx_rates.csv`: documented annual-average FRED G.5A FX rates used for validation conversion.
- `japan_taiwan_official_comparison_usd.csv`: USD-normalized comparison using FRED annual FX for Japan and official Taiwan USD values cross-checked to FRED.
- `japan_taiwan_official_comparison_fx_normalized.csv`: primary annual-FX-normalized USD/GBP comparison across comparable official spend fields.
- `japan_taiwan_model_validation_template.csv`: join target for backend model outputs and official spend/day evidence.
- `japan_taiwan_model_validation_notes.md`: cautious interpretation notes for using official spend evidence against model outputs.
- `japan_taiwan_model_driver_diagnostics.csv`: model-driver row diagnostics explaining why the current backend prefers Taiwan for `GBR` / `GBP`.
- `japan_taiwan_model_driver_delta.csv`: Japan-versus-Taiwan deltas for key score components, raw inputs, and data-quality fields.
- `japan_taiwan_model_driver_diagnostics_notes.md`: diagnosis notes for interpreting the model-driver mismatch without changing scoring yet.
- `japan_taiwan_sensitivity_scenarios.csv`: controlled validation-only scenario definitions for Japan/Taiwan model sensitivity testing.
- `japan_taiwan_sensitivity_results.csv`: row-level Japan/Taiwan outputs for each sensitivity scenario.
- `japan_taiwan_sensitivity_summary.csv`: scenario summary showing whether the mismatch persists and which adjustments shrink it.
- `japan_taiwan_sensitivity_notes.md`: cautious interpretation of the sensitivity results.
- `run_japan_taiwan_sensitivity.py`: local validation runner that regenerates sensitivity outputs without changing production scoring.
- `taiwan_data_collection_notes.md`: official Taiwan pages inspected, parsing notes, and remaining Taiwan data gaps.
- `japan_data_collection_notes.md`: official pages inspected, parsing notes, and remaining Japan data gaps.
- `validation_schema.py` and `run_validation_checks.py`: lightweight pandas checks for required columns, observed-row source/price fields, and the Japan official spend file when present.

Japan and Taiwan official data collection has started. Japan spend has approximate per-day normalization using official average nights where origin markets match. Taiwan headline spend and stay data is populated from the official 2024 Tourism Administration summary PDF, with broad category-level per-day values for Total visitors. The official comparison summary now compares only fields that exist cleanly for both countries. USD-normalized comparison depends on a documented Japan FX conversion.

The first populated `GBR` model-validation run is recorded. Japan now remains in scored output when WGI stability is missing, using a neutral safety/stability component while keeping the `missing_stability` quality flag. Taiwan is included as an explicit supplemental model row because WDI omits `TWN`; IMF macro values, official Taiwan 2024 arrivals/FX, and a marked GDP PPP proxy fill the minimum fields needed for comparison. Annual-average FX normalization now uses FRED G.5A series (`AEXJPUS`, `AEXTAUS`, and `AEXUSUK`) as the primary official-comparison basis; current backend FX is treated as sensitivity context only. The current signal is `model_direction_mismatch_annual_fx`: the model estimates Taiwan cheaper than Japan for GBP-origin travel, while official visitor-spend/day remains higher for Taiwan than Japan under annual-average FX normalization.

The model-driver diagnostics identify why this happens under the current architecture: Taiwan has higher `tourism_pp_power`, PPP Advantage, score_tourism_cost, and a modest Tourism Depth edge. Japan has a much stronger FX Tailwind, but FX Tailwind is currently exposed as a component/diagnostic rather than a direct multiplier in the ranking score. This is a diagnosis layer, not a scoring change, and the mismatch remains a warning signal pending item-basket validation.

Controlled sensitivity testing has also been added. The tests diagnose model fragility only; production scoring is unchanged. The current mismatch persists across the tested scenarios, but it shrinks most when PPP / `tourism_pp_power` influence is reduced or when Taiwan proxy-data penalties are applied. This points the next scoring review toward PPP weighting and proxy-data treatment, while preserving the need for item-basket validation.

## Notes

- Live FX uses a public FX endpoint plus RestCountries to map ISO3 country codes to currencies.
- Historical FX Tailwind uses Frankfurter's latest, one-year, and three-year USD-base reference rates where available.
- PPP and GDP inputs are annual series, even when live FX is enabled.
- If a source API blocks requests, backend ranking falls back where possible to official World Bank data.
