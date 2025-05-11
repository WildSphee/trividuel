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
        name="Tester",
    )


# TESTS


def test_elo_calculation():
    """calculate the correct elo output given the k"""
    p1: Player = make_player(1200)
    p2: Player = make_player(1500)

    winner_new, loser_new = elo_calculation(p1, p2, 32)

    assert winner_new == 1227
    assert loser_new == 1473
