import asyncio
from types import SimpleNamespace

import pytest

from app.schemas.gamesession import GameSession, SessionManager


# ---------------------------------------------------------------------------
# Helper fakes / stubs
# ---------------------------------------------------------------------------
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


class DummyBatch:
    def set(self, *args, **kwargs):
        pass

    async def commit(self):
        pass


class DummyDB:
    def batch(self):
        return DummyBatch()

    # Firestore chaining: db.collection("players").document(uid)
    def collection(self, *_):
        return self

    def document(self, *_):
        return self

    def set(self, *_, **__):
        pass


async def make_player(uid: str):
    """Return a very small stand-in that has every attribute GameSession touches."""

    return SimpleNamespace(
        uid=uid,
        websocket=DummyWebSocket(),
        lifes=2,
        session_id=None,
        current_answer=None,
        elo=1000,
    )


# ---------------------------------------------------------------------------
# pytest fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def event_loop():
    """Use a fresh loop per test (pytest-asyncio builtin override)."""

    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def session(monkeypatch):
    p1 = await make_player("p1")
    p2 = await make_player("p2")

    # Speed up wait times live during unit tests
    monkeypatch.setattr(GameSession, "QUESTION_TIMEOUT", 0)
    monkeypatch.setattr(GameSession, "REVEAL_TIME", 0)

    s = GameSession(p1, p2, DummyDB())
    SessionManager.add(s)
    yield s
    # ensure cleanup
    SessionManager.remove(s.id)


# ---------------------------------------------------------------------------
# Tests for internal helpers
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_safe_send_connected(session):
    player = session.players[0]
    payload = {"hello": "world"}

    await session._safe_send(player, payload)
    assert player.websocket.sent == [payload]
