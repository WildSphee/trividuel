import uuid
from datetime import datetime
from typing import Dict, List, Optional

from app.schemas.players import Player


class GameSession:
    """Represents a live 1‑vs‑1 game session."""

    def __init__(self, player1: Player, player2: Player):
        self.id: str = str(uuid.uuid4())
        self.players: List[Player] = [player1, player2]
        for p in self.players:
            p.state = "playing"
            p.session_id = self.id

    async def broadcast(self, payload: dict):
        for p in self.players:
            if p.websocket.client_state.name == "CONNECTED":
                await p.websocket.send_json(payload)

    async def start(self):
        await self.broadcast({"type": "game_start", "session_id": self.id})

    async def handle_disconnect(self, leaver_uid: str):
        """Called when a player disconnects (voluntarily or network)."""
        remaining = [p for p in self.players if p.uid != leaver_uid]
        if remaining:
            winner = remaining[0]
            await winner.websocket.send_json(
                {"type": "you_win", "reason": "opponent_left"}
            )
        # Clean player states
        for p in self.players:
            p.state = "idle"
            p.session_id = None

        # Persist result
        await self._record_result(leaver_uid)

    async def _record_result(self, loser_uid: str):
        winner, loser = None, None
        for p in self.players:
            if p.uid == loser_uid:
                loser = p
            else:
                winner = p
        if winner is None or loser is None:
            return

        # Basic ELO increment/decrement
        winner.elo += 25
        loser.elo = max(100, loser.elo - 25)

        # Update Firestore for each player
        batch = db.batch()
        for p in self.players:
            doc_ref = db.collection("players").document(p.uid)
            batch.set(
                doc_ref,
                {
                    "elo": p.elo,
                    "updated": datetime.utcnow(),
                    "recent": db.field_path("recent").array_union(
                        [op.uid for op in self.players if op.uid != p.uid]
                    ),
                },
                merge=True,
            )
        await batch.commit()


class GameSessionManager:
    """Registry of all active sessions."""

    def __init__(self):
        self._sessions: Dict[str, GameSession] = {}

    def add(self, session: GameSession):
        self._sessions[session.id] = session

    def get_by_player(self, uid: str) -> Optional[GameSession]:
        for s in self._sessions.values():
            if any(p.uid == uid for p in s.players):
                return s
        return None

    def remove(self, sid: str):
        self._sessions.pop(sid, None)
