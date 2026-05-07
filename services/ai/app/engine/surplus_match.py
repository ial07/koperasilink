"""
Surplus-shortage classification and quantity calculation logic.
"""
from dataclasses import dataclass, field
from typing import Optional
from app.core.config import settings


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
    perishability: str
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
    unit_price: float
    estimated_profit: float
    estimated_shipping_cost: float
    priority_score: float
    perishability: str
    explanation: dict = field(default_factory=dict)


def classify_inventory(
    current_stock: float,
    capacity: float,
    min_stock: Optional[float] = None,
    surplus_threshold: Optional[float] = None,
) -> str:
    """Classify inventory status based on stock levels vs capacity."""
    effective_min = min_stock if min_stock is not None else capacity * settings.shortage_threshold_pct
    effective_surplus = surplus_threshold if surplus_threshold is not None else capacity * settings.surplus_threshold_pct

    if current_stock >= effective_surplus:
        return "surplus"
    if current_stock <= effective_min:
        return "shortage"
    return "balanced"


def calculate_available_surplus(item: VillageInventory) -> float:
    """
    How much can be sent while keeping a safety reserve.
    Safety reserve = 15% of capacity to ensure local stability.
    """
    safe_reserve = item.capacity * settings.safe_reserve_pct
    return max(0.0, item.current_stock - safe_reserve)


def calculate_shortage_amount(item: VillageInventory) -> float:
    """
    How much is needed to restore the village to a healthy minimum level.
    Target = min_stock or 30% of capacity (slightly above shortage threshold).
    """
    target = item.min_stock if item.min_stock > 0 else item.capacity * 0.30
    return max(0.0, target - item.current_stock)
