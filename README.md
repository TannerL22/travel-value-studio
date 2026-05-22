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
.\.venv\Scripts\python.exe -m py_compile main.py data_sources.py
```

## Notes

- Live FX uses a public FX endpoint plus RestCountries to map ISO3 country codes to currencies.
- PPP and GDP inputs are annual series, even when live FX is enabled.
- If a source API blocks requests, backend ranking falls back where possible to official World Bank data.
