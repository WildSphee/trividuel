from datetime import datetime
from math import pow
from typing import List, Tuple
from app.schemas.players import Player
from app.config import settings


async def elo_calculation(
    players: List[Player],
    winner_uid: str,
    k: int = settings.K_FACTOR_DEFAULT,
) -> Tuple[int, int]:
    """
    Update Elo ratings for two players (winner first) in Firestore.

    Args
    ----
    players : list[Player]
        players[0] must be the winner, players[1] the loser.
    k : int, optional
        K-factor for the Elo update (defaults to 32).

    Formula
    -------
        R' = R + K * (S - E)
        E  = 1 / (1 + 10 ** ((R_opp - R) / 400))
        S  = 1 for winner, 0 for loser
    """
    if len(players) != 2:
        raise ValueError("Exactly two players required (winner first, loser second).")

    if winner_uid == players[0]:
        winner: Player = players[0]
        loser: Player = players[1]
    else:
        winner: Player = players[1]
        loser: Player = players[0]


    # --- helper: expected probability winner beats loser -------------------
    def expected(r_a: int, r_b: int) -> float:
        return 1.0 / (1.0 + pow(10.0, (r_b - r_a) / 400.0))

    e_win = expected(winner.elo, loser.elo)
    e_los = 1.0 - e_win

    winner_new = max(settings.MIN_ELO, round(winner.elo + k * (1.0 - e_win)))
    loser_new  = max(settings.MIN_ELO, round(loser.elo  + k * (0.0 - e_los)))

    return winner_new, loser_new