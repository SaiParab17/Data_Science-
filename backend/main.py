"""
DataWatch — FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.drift import router as drift_router
from api.quality import router as quality_router

app = FastAPI(
    title="DataWatch API",
    description="Data Pipeline Quality & Drift Monitoring Platform — Backend API",
    version="1.0.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (and any future production origin) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(drift_router)
app.include_router(quality_router)


@app.get("/")
async def root():
    return {
        "name": "DataWatch API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "POST /api/drift/analyze",
            "GET  /api/drift/latest",
            "POST /api/quality/validate",
            "GET  /api/quality/latest",
            "GET  /api/alerts",
            "GET  /api/health",
        ],
    }
