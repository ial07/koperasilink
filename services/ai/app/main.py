import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.recommendations import router as reco_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="KoperasiLink AI Service",
    version="0.2.0",
    description="Rule-based supply-demand recommendation engine for KoperasiLink",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(reco_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "service": "KoperasiLink AI",
        "status": "running",
        "version": "0.2.0",
        "endpoints": [
            "/api/v1/health",
            "/api/v1/recommendations/generate",
        ],
    }
