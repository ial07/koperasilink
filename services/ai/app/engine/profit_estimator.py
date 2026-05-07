"""
Profit estimation for supply-demand matches.
"""
import math
from app.core.config import settings


def estimate_profit_and_shipping(
    unit_price: float,
    match_qty: float,
    distance_km: float,
) -> tuple[float, float]:
    """
    Estimate profit and shipping cost for a match.

    Returns:
        (profit, shipping_cost) both in IDR

    Model:
        buy_price  = unit_price * match_qty
        sell_price = unit_price * (1 + margin) * match_qty
        shipping   = distance_km * match_qty * cost_per_km_per_kg
        profit     = sell_price - buy_price - shipping
    """
    if match_qty <= 0 or unit_price <= 0:
        return 0.0, 0.0

    buy_price = unit_price * match_qty
    sell_price = unit_price * (1 + settings.profit_margin_pct) * match_qty
    shipping_cost = distance_km * match_qty * settings.shipping_cost_per_km_per_kg

    profit = sell_price - buy_price - shipping_cost
    return round(max(profit, 0.0), 2), round(shipping_cost, 2)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth (in km).
    Used as fallback when PostGIS is not available.
    """
    R = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)
