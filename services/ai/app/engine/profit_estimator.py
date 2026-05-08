from decimal import Decimal
from dataclasses import dataclass


@dataclass
class ProfitEstimate:
    estimated_profit: Decimal
    estimated_revenue: Decimal
    estimated_shipping_cost: Decimal
    margin_rate: Decimal
    shipping_km: float
    shipping_kg: Decimal


def estimate_profit(
    quantity_kg: Decimal,
    unit_price: Decimal,
    distance_km: float,
    margin_rate: float = 0.20,
    shipping_cost_per_km_kg: float = 500.0,
) -> ProfitEstimate:
    """Estimate profit for a redistribution recommendation.

    Formula:
        revenue = quantity_kg * unit_price
        shipping_cost = shipping_cost_per_km_kg * distance_km * quantity_kg
        estimated_profit = (revenue * margin_rate) - shipping_cost

    Returns ProfitEstimate dataclass with breakdown.
    """
    qty = Decimal(str(quantity_kg))
    price = Decimal(str(unit_price))
    margin = Decimal(str(margin_rate))
    shipping_rate = Decimal(str(shipping_cost_per_km_kg))
    dist = Decimal(str(distance_km))

    revenue = qty * price
    shipping_cost = shipping_rate * dist * qty
    estimated_profit = (revenue * margin) - shipping_cost

    return ProfitEstimate(
        estimated_profit=estimated_profit,
        estimated_revenue=revenue,
        estimated_shipping_cost=shipping_cost,
        margin_rate=margin,
        shipping_km=distance_km,
        shipping_kg=quantity_kg,
    )
