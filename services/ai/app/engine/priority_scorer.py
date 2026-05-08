from decimal import Decimal
from typing import Any

from app.engine.surplus_match import MatchResult


def calculate_priority_score(match: MatchResult) -> int:
    """Calculate a composite priority score (0-100) for a match recommendation.

    Scoring breakdown:
        - Distance up to 30 pts: closer = better
        - Perishability up to 20 pts: high perishability = higher score
        - Match efficiency up to 20 pts: higher matched_quantity vs surplus
        - Profit estimate up to 10 pts: weighted later
    """
    score = 0

    # Distance scoring (0-30 pts)
    if match.distance_km <= 10:
        score += 30
    elif match.distance_km <= 25:
        score += 20
    elif match.distance_km <= 50:
        score += 10
    elif match.distance_km <= 100:
        score += 5
    # beyond 100 = 0 pts

    # Perishability scoring (0-20 pts)
    # We need commodity perishability - infer from match data
    # Applied during recommendation generation, here we use a placeholder
    # The actual perishability is passed via context in rule_engine.py

    return score


def apply_perishability_score(
    match: MatchResult, perishability: str, profit_estimate: Decimal
) -> int:
    """Apply perishability and profit to the base score."""
    score = calculate_priority_score(match)

    # Perishability (0-20 pts)
    if perishability == "high":
        score += 20
    elif perishability == "medium":
        score += 10
    elif perishability == "low":
        score += 5

    # Match efficiency (0-20 pts)
    surplus_float = float(match.surplus_amount)
    matched_float = float(match.matched_quantity)
    if surplus_float > 0:
        efficiency = matched_float / surplus_float
        score += min(20, int(efficiency * 20))

    # Profit estimate (0-10 pts)
    profit_float = float(profit_estimate)
    if profit_float >= 1000000:
        score += 10
    elif profit_float >= 500000:
        score += 8
    elif profit_float >= 250000:
        score += 6
    elif profit_float >= 100000:
        score += 4
    elif profit_float >= 50000:
        score += 2

    return min(100, score)


def rank_recommendations(
    recommendations: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Sort recommendations by priority_score descending."""
    return sorted(
        recommendations,
        key=lambda r: r.get("priority_score", 0),
        reverse=True,
    )
