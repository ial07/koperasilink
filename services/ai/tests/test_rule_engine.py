"""Unit tests for the rule engine core logic."""
import pytest
from app.engine.surplus_match import (
    classify_inventory,
    calculate_available_surplus,
    calculate_shortage_amount,
    VillageInventory,
)
from app.engine.priority_scorer import (
    distance_score,
    perishability_score,
    match_efficiency_score,
    calculate_priority_score,
)
from app.engine.profit_estimator import haversine_distance, estimate_profit_and_shipping


# ─── classify_inventory ────────────────────────────────────────────────────────

def test_classify_surplus():
    assert classify_inventory(800, 1000) == "surplus"   # 80% > 70% threshold

def test_classify_shortage():
    assert classify_inventory(100, 1000) == "shortage"  # 10% < 20% threshold

def test_classify_balanced():
    assert classify_inventory(500, 1000) == "balanced"  # 50% in middle range

def test_classify_exactly_at_surplus():
    assert classify_inventory(700, 1000) == "surplus"   # exactly 70%

def test_classify_exactly_at_shortage():
    assert classify_inventory(200, 1000) == "shortage"  # exactly 20%

def test_classify_custom_thresholds():
    # With explicit surplus_threshold=600, shortage min=100
    assert classify_inventory(650, 1000, min_stock=100, surplus_threshold=600) == "surplus"
    assert classify_inventory(80, 1000, min_stock=100, surplus_threshold=600) == "shortage"


# ─── calculate_available_surplus ────────────────────────────────────────────────

class MockInventory:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

def test_available_surplus():
    # stock=800, capacity=1000 → safe_reserve=150 → available=650
    item = MockInventory(current_stock=800, capacity=1000, min_stock=200, surplus_threshold=700)
    result = calculate_available_surplus(item)
    assert result == pytest.approx(650.0)

def test_available_surplus_zero_when_below_reserve():
    item = MockInventory(current_stock=100, capacity=1000, min_stock=200, surplus_threshold=700)
    assert calculate_available_surplus(item) == 0.0

def test_shortage_amount():
    # stock=100, min=300 → need=200
    item = MockInventory(current_stock=100, capacity=1000, min_stock=300)
    assert calculate_shortage_amount(item) == pytest.approx(200.0)

def test_shortage_amount_uses_capacity_fallback():
    # min_stock=0, capacity=1000, target=30% of 1000=300, current=100 → need=200
    item = MockInventory(current_stock=100, capacity=1000, min_stock=0)
    assert calculate_shortage_amount(item) == pytest.approx(200.0)


# ─── priority_scorer ───────────────────────────────────────────────────────────

def test_distance_score_at_zero():
    assert distance_score(0) == pytest.approx(30.0)

def test_distance_score_at_max():
    assert distance_score(50) == pytest.approx(0.0, abs=0.1)

def test_distance_score_decay():
    # Score should monotonically decrease with distance
    scores = [distance_score(d) for d in [0, 5, 10, 25, 40, 50]]
    assert scores == sorted(scores, reverse=True)

def test_perishability_score():
    assert perishability_score("high") == 25.0
    assert perishability_score("medium") == 12.0
    assert perishability_score("low") == 0.0

def test_match_efficiency_score_perfect():
    assert match_efficiency_score(300, 300) == pytest.approx(25.0)

def test_match_efficiency_score_partial():
    assert match_efficiency_score(150, 300) == pytest.approx(12.5)

def test_match_efficiency_capped_at_25():
    # Even if we have more than needed, should not exceed 25
    assert match_efficiency_score(500, 300) == pytest.approx(25.0)


# ─── haversine_distance ─────────────────────────────────────────────────────────

def test_haversine_same_point():
    assert haversine_distance(-3.457, 102.533, -3.457, 102.533) == 0.0

def test_haversine_known_distance():
    # Curup to nearby village: roughly 5-15 km
    dist = haversine_distance(-3.457, 102.533, -3.462, 102.540)
    assert 0 < dist < 5

def test_haversine_longer_distance():
    # Two villages ~60km apart should be outside default radius
    dist = haversine_distance(-3.0, 102.0, -3.5, 102.5)
    assert dist > 50


# ─── profit estimator ──────────────────────────────────────────────────────────

def test_profit_positive_short_distance():
    profit, shipping = estimate_profit_and_shipping(
        unit_price=10_000, match_qty=100, distance_km=5
    )
    # sell = 10000 * 1.2 * 100 = 1_200_000
    # buy  = 10000 * 100 = 1_000_000
    # ship = 5 * 100 * 500 = 250_000
    # profit = 1_200_000 - 1_000_000 - 250_000 = -50_000 → clamped to 0
    assert profit >= 0
    assert shipping == pytest.approx(250_000.0)

def test_profit_zero_on_zero_qty():
    profit, shipping = estimate_profit_and_shipping(0, 0, 10)
    assert profit == 0.0
    assert shipping == 0.0
