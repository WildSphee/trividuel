from app.schemas.players import Player
from app.utils.elo import elo_calculation


class DummyState:
    """Mimic websockets state enum with .name = 'CONNECTED'"""

    def __init__(self, name="CONNECTED"):
        self.name = name


class DummyWebSocket:
    def __init__(self):
        self.sent = []
        self.client_state = DummyState()

    async def send_json(self, payload):
        self.sent.append(payload)


def make_player(elo: int) -> Player:
    """Return a mock player obj"""

    return Player(
        uid="1234567890",
        ws=DummyWebSocket(),
        type="businessman",
        elo=elo,
        country=None,
        name="Tester",
    )


# TESTS


def test_elo_calculation_output_type():
    """calculate the correct elo output type int"""
    p1: Player = make_player(1200)
    p2: Player = make_player(1500)

    winner_new, loser_new = elo_calculation(p1, p2, k=32)

    assert isinstance(winner_new, int)
    assert isinstance(loser_new, int)


def test_elo_calculation_exact_num():
    """calculate the correct elo output given the k"""
    p1: Player = make_player(1200)
    p2: Player = make_player(1500)

    winner_new, loser_new = elo_calculation(p1, p2, k=32)

    assert winner_new == 1232  # gained 34
    assert loser_new == 1475  # loss 22


def test_elo_bias():
    """If players are under the global average - win will always be more than loss
    vice versa
    """

    def find_delta(wp, lp):
        p1: Player = make_player(wp)
        p2: Player = make_player(lp)

        winner_new, loser_new = elo_calculation(p1, p2, k=32)

        winner_delta = winner_new - wp
        loser_delta = lp - loser_new

        return winner_delta, loser_delta

    # these two players under global average
    winner_delta, loser_delta = find_delta(1200, 1200)
    assert winner_delta > loser_delta

    # If players are ABOVE global average, loss will always be more than win
    winner_delta, loser_delta = find_delta(2400, 2400)
    assert winner_delta < loser_delta

    # If players are SAME distance away from average, loss and gain will be the same
    winner_delta, loser_delta = find_delta(1200, 2400)
    assert winner_delta == loser_delta
