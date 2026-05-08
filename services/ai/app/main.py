from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.recommendations import router as recommendations_router

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI Rule Engine for KoperasiLink — surplus/shortage redistribution recommendations",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations_router)


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
    }
