from decimal import Decimal
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.engine.surplus_match import VillageInventory, MatchResult, classify_inventory
from app.engine.priority_scorer import apply_perishability_score, rank_recommendations
from app.engine.profit_estimator import estimate_profit


async def fetch_inventory_data(
    db: AsyncSession,
    village_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Fetch inventory data joined with villages and commodities.

    Uses raw SQL query mapping to snake_case table names.
    """
    query = text("""
        SELECT
            i.id AS inventory_id,
            i.village_id,
            v.name AS village_name,
            v.subdistrict,
            v.district,
            v.latitude,
            v.longitude,
            i.commodity_id,
            c.name AS commodity_name,
            c.perishability,
            i.current_stock,
            i.capacity,
            i.min_stock,
            i.surplus_threshold,
            i.unit_price
        FROM inventory i
        JOIN villages v ON v.id = i.village_id
        JOIN commodities c ON c.id = i.commodity_id
        WHERE (:village_id IS NULL OR i.village_id = :village_id)
    """)

    result = await db.execute(query, {"village_id": village_id})
    rows = result.fetchall()

    inventory_list = []
    for row in rows:
        inventory_list.append({
            "inventory_id": str(row.inventory_id),
            "village_id": str(row.village_id),
            "village_name": row.village_name,
            "subdistrict": row.subdistrict,
            "district": row.district,
            "latitude": float(row.latitude) if row.latitude else 0.0,
            "longitude": float(row.longitude) if row.longitude else 0.0,
            "commodity_id": str(row.commodity_id),
            "commodity_name": row.commodity_name,
            "perishability": row.perishability,
            "current_stock": Decimal(str(row.current_stock)),
            "capacity": Decimal(str(row.capacity)),
            "min_stock": Decimal(str(row.min_stock)),
            "surplus_threshold": Decimal(str(row.surplus_threshold)),
            "unit_price": Decimal(str(row.unit_price)),
        })

    return inventory_list


async def find_nearby_villages(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_km: float = 50.0,
) -> list[dict[str, Any]]:
    """Find villages within radius using PostGIS ST_DWithin.

    Assumes geography column (geometry(Point, 4326)).
    """
    query = text("""
        SELECT
            id,
            name,
            subdistrict,
            district,
            latitude,
            longitude,
            ST_Distance(
                geography(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)),
                geography(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
            ) / 1000.0 AS distance_km
        FROM villages
        WHERE ST_DWithin(
            geography(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)),
            geography(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)),
            :radius_meters
        )
        AND id != :exclude_village_id
        ORDER BY distance_km ASC
    """)

    radius_meters = radius_km * 1000.0
    result = await db.execute(query, {
        "latitude": latitude,
        "longitude": longitude,
        "radius_meters": radius_meters,
        "exclude_village_id": "",
    })
    rows = result.fetchall()

    villages = []
    for row in rows:
        villages.append({
            "id": str(row.id),
            "name": row.name,
            "subdistrict": row.subdistrict,
            "district": row.district,
            "latitude": float(row.latitude) if row.latitude else 0.0,
            "longitude": float(row.longitude) if row.longitude else 0.0,
            "distance_km": float(row.distance_km),
        })

    return villages


async def generate_recommendations(
    db: AsyncSession,
    village_id: Optional[str] = None,
    radius_km: float = 50.0,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Main orchestration: find surplus villages and match with nearby shortage villages.

    1. Fetch all inventory data
    2. Classify surplus and shortage villages
    3. For each surplus village, find nearby shortage villages
    4. Score and rank recommendations
    """
    inventory_list = await fetch_inventory_data(db, village_id)

    # Classify
    surplus_inventories = []
    shortage_inventories = []
    for inv in inventory_list:
        status = classify_inventory(VillageInventory(**inv))
        if status == "surplus":
            surplus_inventories.append(inv)
        elif status == "shortage":
            shortage_inventories.append(inv)

    # Build shortage lookup by commodity_id
    shortage_by_commodity: dict[str, list[dict]] = {}
    for si in shortage_inventories:
        cid = si["commodity_id"]
        if cid not in shortage_by_commodity:
            shortage_by_commodity[cid] = []
        shortage_by_commodity[cid].append(si)

    # Find matches
    recommendations = []
    for surplus in surplus_inventories:
        cid = surplus["commodity_id"]
        shortages = shortage_by_commodity.get(cid, [])

        if not shortages:
            continue

        # Find nearby shortage villages
        nearby_villages = await find_nearby_villages(
            db, surplus["latitude"], surplus["longitude"], radius_km
        )
        nearby_ids = {nv["id"] for nv in nearby_villages}
        nearby_shortages = [
            s for s in shortages if s["village_id"] in nearby_ids
        ]

        if not nearby_shortages:
            continue

        # Build distance map
        distance_map: dict[str, float] = {
            nv["id"]: nv["distance_km"] for nv in nearby_villages
        }

        # Calculate available surplus
        sur_inv = VillageInventory(**surplus)
        available_surplus = sur_inv.current_stock - sur_inv.surplus_threshold
        remaining = available_surplus

        for shortage in nearby_shortages:
            if remaining <= 0:
                break

            short_inv = VillageInventory(**shortage)
            needed = short_inv.min_stock - short_inv.current_stock
            matched_qty = min(remaining, needed)

            distance_km = distance_map.get(shortage["village_id"], 0.0)

            # Build match result
            match = MatchResult(
                source_village_id=surplus["village_id"],
                source_village_name=surplus["village_name"],
                target_village_id=shortage["village_id"],
                target_village_name=shortage["village_name"],
                commodity_id=surplus["commodity_id"],
                commodity_name=surplus["commodity_name"],
                surplus_amount=available_surplus,
                shortage_amount=needed,
                matched_quantity=matched_qty,
                distance_km=distance_km,
            )

            # Estimate profit
            profit_est = estimate_profit(
                quantity_kg=matched_qty,
                unit_price=surplus["unit_price"],
                distance_km=distance_km,
            )

            # Calculate score
            priority_score = apply_perishability_score(
                match,
                surplus["perishability"],
                profit_est.estimated_profit,
            )

            recommendations.append({
                "source_village_id": match.source_village_id,
                "source_village_name": match.source_village_name,
                "target_village_id": match.target_village_id,
                "target_village_name": match.target_village_name,
                "commodity_id": match.commodity_id,
                "commodity_name": match.commodity_name,
                "matched_quantity": float(match.matched_quantity),
                "distance_km": match.distance_km,
                "estimated_profit": float(profit_est.estimated_profit),
                "estimated_revenue": float(profit_est.estimated_revenue),
                "estimated_shipping_cost": float(profit_est.estimated_shipping_cost),
                "priority_score": priority_score,
            })

            remaining -= matched_qty

    # Rank by priority score
    recommendations = rank_recommendations(recommendations)

    return recommendations[:limit]
