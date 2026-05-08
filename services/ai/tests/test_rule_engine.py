import pytest
from decimal import Decimal

from app.engine.surplus_match import (
    VillageInventory,
    classify_inventory,
    calculate_available_surplus,
    calculate_shortage_amount,
)
from app.engine.priority_scorer import calculate_priority_score, apply_perishability_score
from app.engine.profit_estimator import estimate_profit
from app.engine.surplus_match import MatchResult


@pytest.fixture
def surplus_inventory():
    return VillageInventory(
        village_id="v1",
        village_name="Desa Surplus",
        subdistrict="Subur",
        district="Makmur",
        latitude=-3.5,
        longitude=102.5,
        commodity_id="c1",
        commodity_name="Beras",
        perishability="low",
        current_stock=Decimal("1500"),
        capacity=Decimal("2000"),
        min_stock=Decimal("500"),
        surplus_threshold=Decimal("1000"),
        unit_price=Decimal("12000"),
    )


@pytest.fixture
def normal_inventory():
    return VillageInventory(
        village_id="v2",
        village_name="Desa Normal",
        subdistrict="Sejahtera",
        district="Aman",
        latitude=-3.6,
        longitude=102.6,
        commodity_id="c1",
        commodity_name="Beras",
        perishability="low",
        current_stock=Decimal("750"),
        capacity=Decimal("1000"),
        min_stock=Decimal("500"),
        surplus_threshold=Decimal("1000"),
        unit_price=Decimal("12000"),
    )


@pytest.fixture
def shortage_inventory():
    return VillageInventory(
        village_id="v3",
        village_name="Desa Kekurangan",
        subdistrict="Kurang",
        district="Pasokan",
        latitude=-3.7,
        longitude=102.7,
        commodity_id="c1",
        commodity_name="Beras",
        perishability="low",
        current_stock=Decimal("200"),
        capacity=Decimal("1000"),
        min_stock=Decimal("500"),
        surplus_threshold=Decimal("1000"),
        unit_price=Decimal("12000"),
    )


class TestClassifyInventory:
    def test_classify_surplus(self, surplus_inventory):
        assert classify_inventory(surplus_inventory) == "surplus"

    def test_classify_normal(self, normal_inventory):
        assert classify_inventory(normal_inventory) == "normal"

    def test_classify_shortage(self, shortage_inventory):
        assert classify_inventory(shortage_inventory) == "shortage"

    def test_edge_surplus_exact(self):
        inv = VillageInventory(
            village_id="v4", village_name="Test", subdistrict="", district="",
            latitude=0, longitude=0, commodity_id="c1", commodity_name="Beras",
            perishability="low", current_stock=Decimal("1000"), capacity=Decimal("2000"),
            min_stock=Decimal("500"), surplus_threshold=Decimal("1000"),
            unit_price=Decimal("12000"),
        )
        # current_stock == surplus_threshold => not surplus
        assert classify_inventory(inv) == "normal"

    def test_edge_shortage_exact(self):
        inv = VillageInventory(
            village_id="v5", village_name="Test", subdistrict="", district="",
            latitude=0, longitude=0, commodity_id="c1", commodity_name="Beras",
            perishability="low", current_stock=Decimal("500"), capacity=Decimal("1000"),
            min_stock=Decimal("500"), surplus_threshold=Decimal("800"),
            unit_price=Decimal("12000"),
        )
        # current_stock == min_stock => not shortage
        assert classify_inventory(inv) == "normal"


class TestCalculateAvailableSurplus:
    def test_surplus_available(self, surplus_inventory):
        available = calculate_available_surplus(surplus_inventory)
        # 1500 - 1000 = 500
        assert available == Decimal("500")

    def test_normal_no_surplus(self, normal_inventory):
        available = calculate_available_surplus(normal_inventory)
        assert available == Decimal("0")

    def test_shortage_no_surplus(self, shortage_inventory):
        available = calculate_available_surplus(shortage_inventory)
        assert available == Decimal("0")

    def test_zero_available_when_equal(self):
        inv = VillageInventory(
            village_id="v6", village_name="Test", subdistrict="", district="",
            latitude=0, longitude=0, commodity_id="c1", commodity_name="Beras",
            perishability="low", current_stock=Decimal("1000"), capacity=Decimal("1000"),
            min_stock=Decimal("500"), surplus_threshold=Decimal("1000"),
            unit_price=Decimal("12000"),
        )
        assert calculate_available_surplus(inv) == Decimal("0")


class TestCalculateShortageAmount:
    def test_shortage_needed(self, shortage_inventory):
        needed = calculate_shortage_amount(shortage_inventory)
        # 500 - 200 = 300
        assert needed == Decimal("300")

    def test_normal_no_shortage(self, normal_inventory):
        needed = calculate_shortage_amount(normal_inventory)
        assert needed == Decimal("0")

    def test_surplus_no_shortage(self, surplus_inventory):
        needed = calculate_shortage_amount(surplus_inventory)
        assert needed == Decimal("0")

    def test_zero_needed_when_equal(self):
        inv = VillageInventory(
            village_id="v7", village_name="Test", subdistrict="", district="",
            latitude=0, longitude=0, commodity_id="c1", commodity_name="Beras",
            perishability="low", current_stock=Decimal("500"), capacity=Decimal("1000"),
            min_stock=Decimal("500"), surplus_threshold=Decimal("800"),
            unit_price=Decimal("12000"),
        )
        assert calculate_shortage_amount(inv) == Decimal("0")


class TestPriorityScorer:
    def test_calculate_priority_score_close_distance(self):
        match = MatchResult(
            source_village_id="v1", source_village_name="A",
            target_village_id="v2", target_village_name="B",
            commodity_id="c1", commodity_name="Beras",
            surplus_amount=Decimal("500"), shortage_amount=Decimal("300"),
            matched_quantity=Decimal("300"), distance_km=5.0,
        )
        score = calculate_priority_score(match)
        assert score == 30  # within 10km

    def test_calculate_priority_score_medium_distance(self):
        match = MatchResult(
            source_village_id="v1", source_village_name="A",
            target_village_id="v2", target_village_name="B",
            commodity_id="c1", commodity_name="Beras",
            surplus_amount=Decimal("500"), shortage_amount=Decimal("300"),
            matched_quantity=Decimal("300"), distance_km=30.0,
        )
        score = calculate_priority_score(match)
        assert score == 10  # within 25-50km => 10 pts


class TestProfitEstimator:
    def test_estimate_profit_positive(self):
        result = estimate_profit(
            quantity_kg=Decimal("300"),
            unit_price=Decimal("12000"),
            distance_km=25.0,
        )
        # revenue = 300 * 12000 = 3_600_000
        # margin (20%) = 720_000
        # shipping = 500 * 25 * 300 = 3_750_000
        # profit = 720_000 - 3_750_000 = -3_030_000 (negative due to shipping cost)
        assert result.estimated_revenue == Decimal("3600000")
        assert result.estimated_shipping_cost == Decimal("3750000")
        assert result.estimated_profit == Decimal("-3030000")
        assert result.margin_rate == Decimal("0.20")

    def test_estimate_profit_short_distance(self):
        result = estimate_profit(
            quantity_kg=Decimal("100"),
            unit_price=Decimal("15000"),
            distance_km=5.0,
        )
        # revenue = 100 * 15000 = 1_500_000
        # margin = 300_000
        # shipping = 500 * 5 * 100 = 250_000
        # profit = 300_000 - 250_000 = 50_000
        assert result.estimated_revenue == Decimal("1500000")
        assert result.estimated_shipping_cost == Decimal("250000")
        assert result.estimated_profit == Decimal("50000")

    def test_estimate_profit_custom_margin(self):
        result = estimate_profit(
            quantity_kg=Decimal("50"),
            unit_price=Decimal("10000"),
            distance_km=10.0,
            margin_rate=0.30,
            shipping_cost_per_km_kg=1000.0,
        )
        # revenue = 500000, margin 30% = 150000
        # shipping = 1000 * 10 * 50 = 500000
        # profit = 150000 - 500000 = -350000
        assert result.estimated_profit == Decimal("-350000")
        assert result.margin_rate == Decimal("0.30")
