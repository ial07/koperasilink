"""
Main rule engine: orchestrates surplus/shortage matching.
Uses haversine distance calculation (works without PostGIS).
PostGIS spatial queries are available when enabled in schema.
"""
import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.engine.surplus_match import (
    VillageInventory,
    MatchResult,
    calculate_available_surplus,
    calculate_shortage_amount,
)
from app.engine.priority_scorer import rank_recommendations
from app.engine.profit_estimator import estimate_profit_and_shipping, haversine_distance
from app.core.config import settings

logger = logging.getLogger(__name__)


async def fetch_inventory_data(db: AsyncSession) -> List[VillageInventory]:
    """
    Fetch all active village inventory data directly from PostgreSQL.
    Classifies status inline using CASE expression for efficiency.
    """
    query = text("""
        SELECT
            v.id                                    AS village_id,
            v.name                                  AS village_name,
            c.id                                    AS commodity_id,
            c.name                                  AS commodity_name,
            CAST(i.current_stock AS FLOAT)          AS current_stock,
            CAST(COALESCE(i.capacity, 0) AS FLOAT)  AS capacity,
            CAST(COALESCE(i.min_stock, 0) AS FLOAT) AS min_stock,
            CAST(COALESCE(i.surplus_threshold,
                COALESCE(i.capacity, 0) * 0.7) AS FLOAT) AS surplus_threshold,
            CAST(COALESCE(i.unit_price, 0) AS FLOAT) AS unit_price,
            v.latitude,
            v.longitude,
            c.perishability,
            CASE
                WHEN i.current_stock >= COALESCE(i.surplus_threshold, COALESCE(i.capacity, 0) * 0.7)
                    THEN 'surplus'
                WHEN i.current_stock <= COALESCE(i.min_stock, COALESCE(i.capacity, 0) * 0.2)
                    THEN 'shortage'
                ELSE 'balanced'
            END AS status
        FROM inventory i
        JOIN villages v ON i.village_id = v.id
        JOIN commodities c ON i.commodity_id = c.id
        WHERE v.status = 'active'
          AND COALESCE(i.capacity, 0) > 0
    """)

    result = await db.execute(query)
    rows = result.fetchall()
    logger.info(f"Fetched {len(rows)} inventory records for matching")

    items = []
    for row in rows:
        mapping = dict(row._mapping)
        items.append(VillageInventory(**mapping))
    return items


async def generate_recommendations(
    db: AsyncSession,
    max_recommendations: int = None,
    radius_km: float = None,
) -> List[MatchResult]:
    """
    Main recommendation generator.

    Algorithm:
    1. Fetch all active inventory records with status classification.
    2. Separate into surplus_items and shortage_items.
    3. For each surplus × shortage pair with same commodity:
       a. Check distance ≤ radius_km (haversine).
       b. Calculate transferable quantity.
       c. Estimate profit and shipping cost.
       d. Build MatchResult.
    4. Rank by priority score (exponential decay + perishability + efficiency + profit).
    5. Return top N.
    """
    max_reco = max_recommendations or settings.max_recommendations
    radius = radius_km or settings.match_radius_km

    inventory = await fetch_inventory_data(db)
    surplus_items = [i for i in inventory if i.status == "surplus"]
    shortage_items = [i for i in inventory if i.status == "shortage"]

    if not surplus_items:
        logger.info("No surplus villages detected — no recommendations generated")
        return []
    if not shortage_items:
        logger.info("No shortage villages detected — no recommendations generated")
        return []

    logger.info(f"Matching: {len(surplus_items)} surplus × {len(shortage_items)} shortage records")

    matches: List[MatchResult] = []
    seen_pairs = set()  # deduplicate same village pair + commodity

    # Group by commodity for much faster matching
    surplus_by_commodity = {}
    for s in surplus_items:
        surplus_by_commodity.setdefault(s.commodity_id, []).append(s)

    shortage_by_commodity = {}
    for s in shortage_items:
        shortage_by_commodity.setdefault(s.commodity_id, []).append(s)

    for commodity_id, surpluses in surplus_by_commodity.items():
        shortages = shortage_by_commodity.get(commodity_id, [])
        for surplus in surpluses:
            for shortage in shortages:
                # Can't send to yourself
                if surplus.village_id == shortage.village_id:
                    continue

                # Deduplication key
                pair_key = (surplus.village_id, shortage.village_id, surplus.commodity_id)
                if pair_key in seen_pairs:
                    continue

                # Distance filter
                distance_km = haversine_distance(
                    surplus.latitude, surplus.longitude,
                    shortage.latitude, shortage.longitude,
                )
                if distance_km > radius:
                    continue

                # Calculate quantities
                available = calculate_available_surplus(surplus)
                needed = calculate_shortage_amount(shortage)
                match_qty = min(available, needed)

                if match_qty <= 0:
                    continue

                # Profit estimation
                profit, shipping = estimate_profit_and_shipping(
                    surplus.unit_price, match_qty, distance_km
                )

                seen_pairs.add(pair_key)
                matches.append(MatchResult(
                    from_village_id=surplus.village_id,
                    from_village_name=surplus.village_name,
                    to_village_id=shortage.village_id,
                    to_village_name=shortage.village_name,
                    commodity_id=surplus.commodity_id,
                    commodity_name=surplus.commodity_name,
                available_qty=available,
                requested_qty=needed,
                match_qty=match_qty,
                distance_km=distance_km,
                unit_price=surplus.unit_price,
                estimated_profit=profit,
                estimated_shipping_cost=shipping,
                priority_score=0.0,  # set by ranker
                perishability=surplus.perishability,
            ))

    ranked = rank_recommendations(matches, top_n=max_reco, max_km=radius)
    logger.info(f"Generated {len(ranked)} recommendations from {len(matches)} candidate matches")
    return ranked
