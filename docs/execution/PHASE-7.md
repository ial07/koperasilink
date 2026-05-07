# PHASE 7: AI Rule Engine (FastAPI)

**Duration:** Week 6  
**Dependencies:** Phase 4 (Inventory), Phase 5 (PostGIS)  
**Review After:** AI service running, surplus/shortage matching working via API

---

## Goal

Python FastAPI service untuk rule-based AI engine: match surplus villages with shortage villages, priority scoring, profit estimation.

## Task 7.1: AI Service Dependencies

**File: `services/ai/requirements.txt`**
```
fastapi==0.110.*
uvicorn[standard]==0.29.*
pydantic==2.7.*
pydantic-settings==2.2.*
httpx==0.27.*
asyncpg==0.29.*
sqlalchemy[asyncio]==2.0.*
pytest==8.*
pytest-asyncio==0.23.*
```

Install:
```bash
cd services/ai
source venv/bin/activate
pip install -r requirements.txt
```

## Task 7.2: Config & Database Connection

**File: `services/ai/app/core/config.py`**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://koperasi:koperasi_dev@localhost:5432/koperasilink"
    redis_url: str = "redis://localhost:6379"
    api_url: str = "http://localhost:4000/api/v1"
    match_radius_km: float = 50.0
    max_recommendations: int = 10
    surplus_threshold_pct: float = 0.7  # >70% capacity = surplus
    shortage_threshold_pct: float = 0.2  # <20% capacity = shortage

    class Config:
        env_file = ".env"

settings = Settings()
```

**File: `services/ai/app/core/database.py`**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(settings.database_url, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
```

## Task 7.3: Rule Engine Core

**File: `services/ai/app/engine/surplus_match.py`**
```python
"""Surplus-shortage matching logic using inventory and PostGIS data."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class VillageInventory:
    village_id: str
    village_name: str
    commodity_id: str
    commodity_name: str
    current_stock: float
    capacity: float
    min_stock: float
    surplus_threshold: float
    unit_price: float
    latitude: float
    longitude: float
    status: str  # surplus / shortage / balanced


@dataclass
class MatchResult:
    from_village_id: str
    from_village_name: str
    to_village_id: str
    to_village_name: str
    commodity_id: str
    commodity_name: str
    available_qty: float
    requested_qty: float
    match_qty: float
    distance_km: float
    estimated_profit: float
    priority_score: float
    perishability: str


def classify_inventory(current_stock: float, capacity: float,
                       min_stock: Optional[float] = None,
                       surplus_threshold: Optional[float] = None) -> str:
    min_stock = min_stock or capacity * 0.2
    surplus_threshold = surplus_threshold or capacity * 0.7
    if current_stock >= surplus_threshold:
        return "surplus"
    if current_stock <= min_stock:
        return "shortage"
    return "balanced"


def calculate_available_surplus(item: VillageInventory) -> float:
    """How much surplus is available beyond reserve."""
    safe_reserve = item.capacity * 0.15  # keep 15% as safety
    return max(0, item.current_stock - safe_reserve)


def calculate_shortage_amount(item: VillageInventory) -> float:
    """How much is needed to reach minimum acceptable level."""
    target = item.min_stock or item.capacity * 0.3
    return max(0, target - item.current_stock)
```

**File: `services/ai/app/engine/priority_scorer.py`**
```python
"""Priority scoring for match recommendations."""
from typing import List
from .surplus_match import MatchResult


def calculate_priority_score(match: MatchResult) -> float:
    """
    Calculate priority score (0-100) for a match.
    Higher = more urgent / better match.
    Factors: distance, perishability, surplus ratio, match efficiency.
    """
    score = 50.0  # baseline

    # Distance: closer = better (up to 30 points)
    if match.distance_km <= 10:
        score += 30
    elif match.distance_km <= 25:
        score += 20
    elif match.distance_km <= 50:
        score += 10

    # Perishability: high perishability = higher priority (up to 20 points)
    perish_score = {"high": 20, "medium": 10, "low": 0}
    score += perish_score.get(match.perishability, 0)

    # Match efficiency: how well qty aligns (up to 20 points)
    if match.match_qty > 0 and match.requested_qty > 0:
        efficiency = min(match.match_qty / match.requested_qty, 1.0)
        score += efficiency * 20

    # Profit potential (up to 10 points)
    if match.estimated_profit > 0:
        profit_score = min(match.estimated_profit / 500000, 1.0)
        score += profit_score * 10

    return round(min(score, 100), 1)


def rank_recommendations(matches: List[MatchResult], top_n: int = 10) -> List[MatchResult]:
    """Sort by priority score descending and return top N."""
    for match in matches:
        match.priority_score = calculate_priority_score(match)
    matches.sort(key=lambda m: m.priority_score, reverse=True)
    return matches[:top_n]
```

**File: `services/ai/app/engine/profit_estimator.py`**
```python
"""Estimate potential profit from a match."""
from .surplus_match import MatchResult


def estimate_profit(
    unit_price: float,
    match_qty: float,
    distance_km: float,
    shipping_cost_per_km_per_kg: float = 500.0,
) -> float:
    """
    Estimate profit = (sell_price * qty) - (buy_price * qty) - shipping_cost.
    Revenue: assuming 20% margin over unit price for sell price.
    """
    buy_price = unit_price * match_qty
    sell_price = unit_price * 1.2 * match_qty  # 20% markup
    shipping_cost = distance_km * match_qty * shipping_cost_per_km_per_kg
    profit = sell_price - buy_price - shipping_cost
    return round(max(profit, 0), 2)
```

**File: `services/ai/app/engine/rule_engine.py`**
```python
"""Main rule engine that orchestrates matching."""
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from .surplus_match import VillageInventory, MatchResult, calculate_available_surplus, calculate_shortage_amount
from .priority_scorer import rank_recommendations
from .profit_estimator import estimate_profit

logger = logging.getLogger(__name__)


async def fetch_inventory_data(db: AsyncSession) -> List[VillageInventory]:
    """Fetch village + inventory data with PostGIS coordinates."""
    query = text("""
        SELECT
            v.id AS village_id,
            v.name AS village_name,
            c.id AS commodity_id,
            c.name AS commodity_name,
            i.current_stock,
            i.capacity,
            i.min_stock,
            i.surplus_threshold,
            i.unit_price,
            v.latitude,
            v.longitude,
            c.perishability,
            CASE
                WHEN i.current_stock >= COALESCE(i.surplus_threshold, i.capacity * 0.7) THEN 'surplus'
                WHEN i.current_stock <= COALESCE(i.min_stock, i.capacity * 0.2) THEN 'shortage'
                ELSE 'balanced'
            END AS status
        FROM inventory i
        JOIN villages v ON i.village_id = v.id
        JOIN commodities c ON i.commodity_id = c.id
        WHERE v.status = 'active'
    """)
    result = await db.execute(query)
    rows = result.fetchall()
    return [VillageInventory(**row._mapping) for row in rows]


async def find_nearby_villages(db: AsyncSession, lat: float, lng: float, radius_km: float):
    """Use PostGIS to find villages within radius."""
    query = text("""
        SELECT id, name, latitude, longitude,
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            ) / 1000 AS distance_km
        FROM villages
        WHERE ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius_meters
        ) AND status = 'active'
        ORDER BY distance_km
    """)
    result = await db.execute(query, {"lat": lat, "lng": lng, "radius_meters": radius_km * 1000})
    return result.fetchall()


async def generate_recommendations(
    db: AsyncSession,
    max_recommendations: int = 10,
    radius_km: float = 50.0,
) -> List[MatchResult]:
    """Main recommendation generator."""
    inventory = await fetch_inventory_data(db)
    surplus_items = [i for i in inventory if i.status == "surplus"]
    shortage_items = [i for i in inventory if i.status == "shortage"]

    if not surplus_items or not shortage_items:
        logger.info(f"No matches: surplus={len(surplus_items)}, shortage={len(shortage_items)}")
        return []

    matches: List[MatchResult] = []

    for surplus in surplus_items:
        nearby = await find_nearby_villages(db, surplus.latitude, surplus.longitude, radius_km)
        nearby_ids = {row.id for row in nearby}

        for shortage in shortage_items:
            if shortage.commodity_id != surplus.commodity_id:
                continue
            if shortage.village_id not in nearby_ids:
                continue

            available = calculate_available_surplus(surplus)
            needed = calculate_shortage_amount(shortage)
            match_qty = min(available, needed)
            if match_qty <= 0:
                continue

            distance = next((row.distance_km for row in nearby if row.id == shortage.village_id), 0)
            profit = estimate_profit(surplus.unit_price, match_qty, distance)

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
                distance_km=round(distance, 2),
                estimated_profit=profit,
                priority_score=0,  # set by ranker
                perishability=surplus.perishability,
            ))

    ranked = rank_recommendations(matches, max_recommendations)
    logger.info(f"Generated {len(ranked)} recommendations from {len(matches)} candidates")
    return ranked
```

## Task 7.4: AI API Routes

**File: `services/ai/app/api/v1/recommendations.py`**
```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.engine.rule_engine import generate_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/generate")
async def create_recommendations(
    max_results: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI supply-demand recommendations."""
    results = await generate_recommendations(db, max_recommendations=max_results)
    return {
        "total": len(results),
        "generated_at": str(datetime.utcnow()),
        "recommendations": [
            {
                "from_village": r.from_village_name,
                "to_village": r.to_village_name,
                "commodity": r.commodity_name,
                "match_qty": r.match_qty,
                "distance_km": r.distance_km,
                "estimated_profit": r.estimated_profit,
                "priority_score": r.priority_score,
            }
            for r in results
        ],
    }


@router.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-engine", "version": "0.1.0"}
```

## Task 7.5: Register Routes in Main App

**File: `services/ai/app/main.py`**
```python
from fastapi import FastAPI
from app.api.v1.recommendations import router as reco_router
from datetime import datetime

app = FastAPI(title="KoperasiLink AI Service", version="0.2.0")
app.include_router(reco_router, prefix="/api/v1")
```

## Task 7.6: Test the Engine

```bash
cd services/ai
source venv/bin/activate
python -m pytest tests/ -v
```

**File: `services/ai/tests/test_rule_engine.py`**
```python
import pytest
from app.engine.surplus_match import classify_inventory, calculate_available_surplus, calculate_shortage_amount

def test_classify_surplus():
    assert classify_inventory(800, 1000) == "surplus"

def test_classify_shortage():
    assert classify_inventory(100, 1000) == "shortage"

def test_classify_balanced():
    assert classify_inventory(500, 1000) == "balanced"

def test_available_surplus():
    # surplus 800, capacity 1000, safe reserve 150, available = 650
    item = MockInventory(current_stock=800, capacity=1000)
    assert calculate_available_surplus(item) == 650.0

def test_shortage_amount():
    item = MockInventory(current_stock=100, capacity=1000, min_stock=300)
    assert calculate_shortage_amount(item) == 200.0

class MockInventory:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
```

## Validation Checklist

- [ ] `pip install -r requirements.txt` runs clean
- [ ] `uvicorn app.main:app` starts without error
- [ ] `GET /api/v1/recommendations/generate` returns match results
- [ ] Surplus villages matched with nearby shortage villages (same commodity)
- [ ] Distance calculated using PostGIS < radius threshold
- [ ] Priority scores computed and sorted descending
- [ ] Profit estimates calculated (20% margin - shipping)
- [ ] Unit tests pass: `pytest tests/ -v`
- [ ] Empty result returned when no surplus/shortage exists
- [ ] Logging works: `Generated N recommendations from M candidates`

## Git Checkpoint

```bash
git add .
git commit -m "phase-7: ai rule engine - surplus matching, priority scoring, profit estimation"
git tag phase-7
```
