from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base, SessionLocal
from app.services.yoga_service import yoga_service

from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed static poses/exercises
    Base.metadata.create_all(bind=engine)
    
    # Self-healing database migration for Phase 3 columns
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN heart_rate FLOAT"))
            conn.commit()
        except Exception:
            pass # Already exists
        try:
            conn.execute(text("ALTER TABLE sessions ADD COLUMN hrv FLOAT"))
            conn.commit()
        except Exception:
            pass # Already exists

    db = SessionLocal()
    try:
        yoga_service.seed_initial_data(db)
    finally:
        db.close()
    yield
    # Shutdown (cleanup if needed)

app = FastAPI(
    title="Yoga Pose AI API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware to allow requests from the React frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Status/health check endpoint for frontend status bar
@app.get("/api/v1/status")
def read_status():
    return {
        "status": "online",
        "project": "Yoga Pose AI API",
        "documentation": "/docs"
    }

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Path to the dist directory
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "dist"))

# Mount assets directory for fast static serving
if os.path.isdir(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

# Catch-all route to serve other files in dist or fall back to index.html for SPA routing
@app.get("/{rest_of_path:path}")
async def serve_spa(rest_of_path: str):
    file_path = os.path.join(DIST_DIR, rest_of_path)
    if rest_of_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    
    return {"detail": f"Frontend build not found at {DIST_DIR}. Please run 'npm run build' first."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

