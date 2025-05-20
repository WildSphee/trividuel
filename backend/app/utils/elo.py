from math import pow
from typing import Tuple

from app.config import settings
from app.schemas.players import Player


def elo_calculation(
    winner: Player,
    loser: Player,
    *,
    k: int = settings.K_FACTOR_DEFAULT,  # base K (e.g. 32)
    mean_elo: int = 1800,  # “global average” you want ratings to orbit
    alpha: float = 0.50,  # 0 = classic Elo, 1 = very aggressive bias
    min_k: int = 16,  # floor / ceiling to avoid extreme jumps
    max_k: int = 64,
) -> Tuple[int, int]:
    """
    Elo with mean-reverting bias.

    R' = R + K_adj * (S - E)
    K_adj_winner = k * (1 + alpha * (mean_elo - R_winner) / mean_elo)
    K_adj_loser  = k * (1 + alpha * (R_loser - mean_elo) / mean_elo)

    *  K_adj is clamped to [min_k, max_k].
    *  mean_elo, alpha, min_k, max_k are all tunable without code changes.
    """

    def expected(r_a: int, r_b: int) -> float:
        # score that A beats B
        return 1.0 / (1.0 + pow(10.0, (r_b - r_a) / 400.0))

    e_win = expected(winner.elo, loser.elo)
    e_los = 1.0 - e_win

    # rating-dependent K-factors
    k_win = k * (1 + alpha * (mean_elo - winner.elo) / mean_elo)
    k_los = k * (1 + alpha * (loser.elo - mean_elo) / mean_elo)

    # clamp to sensible limits
    k_win = max(min_k, min(max_k, k_win))
    k_los = max(min_k, min(max_k, k_los))

    # apply the updates
    winner_new = max(settings.MIN_ELO, round(winner.elo + k_win * (1.0 - e_win)))
    loser_new = max(settings.MIN_ELO, round(loser.elo + k_los * (0.0 - e_los)))

    # TODO LOGGING
    print(
        f"{winner.name:>10}: {winner.elo} -> {winner_new}  "
        f"(K={k_win:.1f},  Δ={winner_new - winner.elo:+})"
    )
    print(
        f"{loser.name:>10}: {loser.elo} -> {loser_new}   "
        f"(K={k_los:.1f},  Δ={loser_new - loser.elo:+})"
    )

    return winner_new, loser_new
