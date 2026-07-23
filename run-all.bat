@echo off
echo Starting PranaAI Backend and Frontend...

:: Start the FastAPI backend
start "PranaAI Backend" cmd /k "cd yoga-pose-ai\backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Start the React frontend
start "PranaAI Frontend" cmd /k "npm run dev"

echo Both servers started!
