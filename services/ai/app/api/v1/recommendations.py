from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.engine.rule_engine import generate_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/generate")
async def create_recommendations(
    max_results: int = Query(10, ge=1, le=50, description="Maximum recommendations to return"),
    radius_km: float = Query(50.0, ge=1.0, le=200.0, description="Search radius in km"),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI rule-based supply-demand recommendations.

    Matches surplus villages with shortage villages for the same commodity,
    ranked by priority score (distance, perishability, match efficiency, profit).
    """
    try:
        results = await generate_recommendations(
            db,
            max_recommendations=max_results,
            radius_km=radius_km,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engine error: {str(e)}")

    return {
        "total": len(results),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "parameters": {"max_results": max_results, "radius_km": radius_km},
        "recommendations": [
            {
                "from_village_id": r.from_village_id,
                "from_village": r.from_village_name,
                "to_village_id": r.to_village_id,
                "to_village": r.to_village_name,
                "commodity_id": r.commodity_id,
                "commodity": r.commodity_name,
                "available_qty": r.available_qty,
                "requested_qty": r.requested_qty,
                "match_qty": r.match_qty,
                "distance_km": r.distance_km,
                "unit_price": r.unit_price,
                "estimated_shipping_cost": r.estimated_shipping_cost,
                "estimated_profit": r.estimated_profit,
                "priority_score": r.priority_score,
                "perishability": r.perishability,
                "explanation": r.explanation,
            }
            for r in results
        ],
    }
