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

import os
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

INTERNAL_TOKEN = os.getenv("AI_SERVICE_TOKEN", "super-secret-internal-token-123")

@app.middleware("http")
async def verify_internal_token(request: Request, call_next):
    if request.url.path.startswith("/api/v1/recommendations"):
        token = request.headers.get("x-internal-token")
        if token != INTERNAL_TOKEN:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized: Invalid or missing internal token"})
    return await call_next(request)

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
