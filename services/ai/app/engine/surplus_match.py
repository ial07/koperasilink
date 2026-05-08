from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class VillageInventory:
    village_id: str
    village_name: str
    subdistrict: str
    district: str
    latitude: float
    longitude: float
    commodity_id: str
    commodity_name: str
    perishability: str  # "high", "medium", "low"
    current_stock: Decimal
    capacity: Decimal
    min_stock: Decimal
    surplus_threshold: Decimal
    unit_price: Decimal


@dataclass
class MatchResult:
    source_village_id: str
    source_village_name: str
    target_village_id: str
    target_village_name: str
    commodity_id: str
    commodity_name: str
    surplus_amount: Decimal
    shortage_amount: Decimal
    matched_quantity: Decimal
    distance_km: float


def classify_inventory(inv: VillageInventory) -> str:
    """Classify inventory status based on stock levels.

    Returns:
        - "surplus": current_stock > surplus_threshold
        - "normal": min_stock <= current_stock <= surplus_threshold
        - "shortage": current_stock < min_stock
    """
    if inv.current_stock > inv.surplus_threshold:
        return "surplus"
    elif inv.current_stock >= inv.min_stock:
        return "normal"
    else:
        return "shortage"


def calculate_available_surplus(inv: VillageInventory) -> Decimal:
    """Calculate how much surplus stock is available for redistribution.

    Surplus = current_stock - surplus_threshold (only if surplus).
    Returns 0 if not in surplus state.
    """
    if classify_inventory(inv) == "surplus":
        available = inv.current_stock - inv.surplus_threshold
        return max(available, Decimal("0"))
    return Decimal("0")


def calculate_shortage_amount(inv: VillageInventory) -> Decimal:
    """Calculate how much stock is needed to cover the shortage.

    Shortage = min_stock - current_stock (only if shortage).
    Returns 0 if not in shortage state.
    """
    if classify_inventory(inv) == "shortage":
        needed = inv.min_stock - inv.current_stock
        return max(needed, Decimal("0"))
    return Decimal("0")
