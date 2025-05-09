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


@pytest.mark.asyncio
async def test_safe_send_disconnected(monkeypatch, session):
    player = session.players[0]
    player.websocket.client_state.name = "CLOSED"

    payload = {"x": 1}
    await session._safe_send(player, payload)
    # nothing sent when not CONNECTED
    assert player.websocket.sent == []


# ---------------------------------------------------------------------------
# public helpers
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_broadcast(session):
    payload = {"foo": "bar"}
    await session.broadcast(payload)

    for p in session.players:
        assert p.websocket.sent[-1] == payload


# ---------------------------------------------------------------------------
# Game flow
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_start_sends_found_and_schedules_first_question(session, monkeypatch):
    # monkeypatch the next_question to check it is called after the 3-second scheduled task
    called = asyncio.Event()

    async def fake_next_question():
        called.set()

    monkeypatch.setattr(session, "next_question", fake_next_question)

    await session.start()

    # Expect a "found" packet broadcast immediately
    for p in session.players:
        assert p.websocket.sent[-1]["message"] == "found"

    # Fast-forward scheduled 3-second sleep
    await asyncio.wait_for(called.wait(), timeout=0.1)


@pytest.mark.asyncio
async def test_next_question_sends_question(session):
    await session.next_question()

    # Each player should have a question payload
    for p in session.players:
        packet = p.websocket.sent[-1]
        assert packet["message"] == "question"
        assert packet["extra"]["question_timeout"] == session.QUESTION_TIMEOUT


@pytest.mark.asyncio
async def test_receive_answer_triggers_reveal_early(session, monkeypatch):
    # Move to first question
    await session.next_question()

    # Replace reveal with spy
    revealed = asyncio.Event()

    async def fake_reveal():
        revealed.set()

    monkeypatch.setattr(session, "reveal", fake_reveal)

    # Both players answer
    for p in session.players:
        await session.receive_answer(p.uid, 0)

    await asyncio.wait_for(revealed.wait(), timeout=0.1)


@pytest.mark.asyncio
async def test_reveal_updates_life(session):
    await session.next_question()

    # force both to give wrong answer (index 99)
    for p in session.players:
        p.current_answer = 99

    await session.reveal()

    for p in session.players:
        assert p.lifes == 1  # lost one life


@pytest.mark.asyncio
async def test_handle_disconnect(session):
    leaver = session.players[0]
    stay = session.players[1]

    await session.handle_disconnect(leaver.uid)

    # stay websocket should get an end message with winner == stay.uid
    end_packet = stay.websocket.sent[-1]
    assert end_packet["message"] == "end"
    assert end_packet["extra"]["winner"] == stay.uid


# ---------------------------------------------------------------------------
# handle_client_message router
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_handle_client_message_answer(monkeypatch, session):
    await session.next_question()

    spy = asyncio.Event()

    async def fake_receive_answer(uid, choice_idx):
        spy.set()

    monkeypatch.setattr(session, "receive_answer", fake_receive_answer)

    await session.handle_client_message("p1", {"type": "answer", "choice": 1})

    await asyncio.wait_for(spy.wait(), timeout=0.1)


@pytest.mark.asyncio
async def test_handle_client_message_quit(monkeypatch, session):
    spy = asyncio.Event()

    async def fake_disconnect(uid):
        spy.set()

    monkeypatch.setattr(session, "handle_disconnect", fake_disconnect)
    await session.handle_client_message("p1", {"type": "quit"})
    await asyncio.wait_for(spy.wait(), timeout=0.1)


@pytest.mark.asyncio
async def test_handle_client_message_ping(session):
    sender = session.players[0]
    await session.handle_client_message(sender.uid, {"type": "ping", "id": 42})

    # should get a pong on same websocket
    assert sender.websocket.sent[-1] == {"type": "pong", "id": 42}


@pytest.mark.asyncio
async def test_handle_client_message_chat(session):
    await session.handle_client_message("p1", {"type": "chat", "text": "hello"})

    # every player gets the chat relay
    for p in session.players:
        pkt = p.websocket.sent[-1]
        assert pkt["type"] == "chat"
        assert pkt["from"] == "p1"
        assert pkt["text"] == "hello"


@pytest.mark.asyncio
async def test_handle_client_message_unknown(session):
    sender = session.players[0]
    await session.handle_client_message(sender.uid, {"type": "doesnotexist"})

    pkt = sender.websocket.sent[-1]
    assert pkt["type"] == "error"
    assert "Unknown message type" in pkt["message"]


# ---------------------------------------------------------------------------
# SessionManager utility
# ---------------------------------------------------------------------------


def test_session_manager_add_get_remove(session):
    # Already added via fixture.
    got = SessionManager.get_by_player("p1")
    assert got is session

    SessionManager.remove(session.id)
    assert SessionManager.get_by_player("p1") is None
