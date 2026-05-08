import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.engine.rule_engine import generate_recommendations

router = APIRouter(prefix="/api/v1", tags=["recommendations"])


@router.get("/recommendations/generate")
async def get_recommendations(
    village_id: Optional[str] = Query(None, description="Optional village ID to filter"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    limit: int = Query(10, description="Maximum number of recommendations"),
    db: AsyncSession = Depends(get_db),
):
    """Generate redistribution recommendations based on surplus/shortage analysis."""
    recommendations = await generate_recommendations(
        db=db,
        village_id=village_id,
        radius_km=radius_km,
        limit=limit,
    )

    return {
        "success": True,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "count": len(recommendations),
        "data": recommendations,
    }


@router.get("/recommendations/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "KoperasiLink AI Rule Engine",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
