import pytest
from app.schemas.players import Player, PlayerManager

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

# TESTS 

def test_create_player():
    """The player creation successful"""
    _ = Player('1234567890', None)
    _ = Player('1234567890', DummyWebSocket(), 1200, "Tester")


def test_repr_player():
    """correctly displaying the player objection"""
    a = Player('1234567890', None)
    b = Player('1234567890', DummyWebSocket(), 1200, "Tester")

    assert str(a) == "{'name': None}"
    assert repr(a) == "{'name': None}"

    assert str(b) == "{'name': 'Tester'}"
    assert repr(b) == "{'name': 'Tester'}"

def test_player_manager_add():
    """player manager can add a new player to its args"""
    pm = PlayerManager()
    p1 = Player('1234567890', None)

    pm.add(p1)

    assert len(pm._players) == 1
    assert list(pm._players.keys())[0] == '1234567890'
    assert list(pm._players.values())[0] == p1
    

def test_player_manager_remove():
    """player manager can remove players"""
    pm = PlayerManager()
    p1 = Player('1234567890', None)

    pm.add(p1)
    pm.remove('1234567890')

    assert len(pm._players) == 0

def test_player_manager_get():
    """player manager get player base on their uid"""
    pm = PlayerManager()
    p1 = Player('1234567890', None)

    pm.add(p1)
    res = pm.get('1234567890')

    assert isinstance(res, Player)
    assert res == p1