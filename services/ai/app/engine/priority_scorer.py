"""
Priority scoring system for recommendation ranking.

Scoring model (0–100 scale):
    - Distance proximity:   0–30 pts  (continuous decay, not step function)
    - Perishability urgency: 0–25 pts
    - Match efficiency:     0–25 pts  (how well qty satisfies demand)
    - Profit potential:     0–20 pts
"""
import math
from typing import List
from app.engine.surplus_match import MatchResult


def distance_score(distance_km: float, max_km: float = 50.0) -> float:
    """
    Continuous exponential decay: max 30 pts at 0 km, decaying to 0 at max_km.
    Uses e^(-k*d) where k is chosen so score ≈ 0 at max_km.
    Avoids the cliff-edge problem of discrete step scoring.
    """
    if distance_km <= 0:
        return 30.0
    if distance_km >= max_km:
        return 0.0
    # k = -ln(0.01) / max_km → score is 1% of max at boundary
    k = -math.log(0.01) / max_km
    return round(30.0 * math.exp(-k * distance_km), 2)


def perishability_score(perishability: str) -> float:
    """Higher perishability = more urgent = higher priority."""
    scores = {"high": 25.0, "medium": 12.0, "low": 0.0}
    return scores.get(perishability, 0.0)


def match_efficiency_score(match_qty: float, requested_qty: float) -> float:
    """How well the available supply covers the actual demand (0–25 pts)."""
    if requested_qty <= 0:
        return 0.0
    efficiency = min(match_qty / requested_qty, 1.0)
    return round(efficiency * 25.0, 2)


def profit_potential_score(estimated_profit: float, cap_at: float = 1_000_000) -> float:
    """Normalize profit against a realistic ceiling (0–20 pts)."""
    if estimated_profit <= 0:
        return 0.0
    return round(min(estimated_profit / cap_at, 1.0) * 20.0, 2)


def calculate_priority_score(match: MatchResult, max_km: float = 50.0) -> float:
    """Composite priority score (0–100)."""
    score = (
        distance_score(match.distance_km, max_km)
        + perishability_score(match.perishability)
        + match_efficiency_score(match.match_qty, match.requested_qty)
        + profit_potential_score(match.estimated_profit)
    )
    return round(min(score, 100.0), 1)


def rank_recommendations(
    matches: List[MatchResult],
    top_n: int = 10,
    max_km: float = 50.0,
) -> List[MatchResult]:
    """
    Score, rank, and return top N matches by priority.
    Also attaches the score breakdown to the explanation field for observability.
    """
    for match in matches:
        d_score = distance_score(match.distance_km, max_km)
        p_score = perishability_score(match.perishability)
        e_score = match_efficiency_score(match.match_qty, match.requested_qty)
        prof_score = profit_potential_score(match.estimated_profit)

        match.priority_score = round(d_score + p_score + e_score + prof_score, 1)
        match.explanation = {
            "distance_score": d_score,
            "perishability_score": p_score,
            "match_efficiency_score": e_score,
            "profit_potential_score": prof_score,
            "total_score": match.priority_score,
            "reasoning": (
                f"Selected because: {match.perishability} perishability "
                f"({p_score:.0f}pts), {match.distance_km:.1f}km proximity "
                f"({d_score:.0f}pts), {match.match_qty:.0f}kg fills "
                f"{min(match.match_qty / max(match.requested_qty, 1) * 100, 100):.0f}% of demand."
            ),
        }

    matches.sort(key=lambda m: m.priority_score, reverse=True)
    return matches[:top_n]
