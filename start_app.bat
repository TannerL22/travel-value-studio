@echo off
setlocal

echo ==========================================
echo   Starting Travel Value Studio
echo ==========================================

if not exist "backend\.venv\Scripts\python.exe" (
  echo.
  echo Backend virtual environment is missing.
  echo Run:
  echo   cd backend
  echo   python -m venv .venv
  echo   .\.venv\Scripts\activate
  echo   pip install -r requirements.txt
  echo.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo.
  echo Frontend dependencies are missing.
  echo Run:
  echo   cd frontend
  echo   npm install
  echo.
  pause
  exit /b 1
)

echo.
echo [1/2] Launching backend API...
start "Travel Value Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo [2/2] Launching frontend dashboard...
start "Travel Value Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo   App is starting.
echo ==========================================
echo   Frontend: http://localhost:3000
echo   Backend:  http://127.0.0.1:8000/docs
echo.
echo   Close the two server windows to stop the app.
echo ==========================================
pause
