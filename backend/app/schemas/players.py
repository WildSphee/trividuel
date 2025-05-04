from typing import Dict, List, Literal, Optional

from fastapi import WebSocket


class Player:
    """Represents a connected player."""

    def __init__(
        self,
        uid: str,
        ws: WebSocket,
        elo: int = 1200,
        recent: Optional[List[str]] = None,
    ):
        self.uid = uid
        self.websocket = ws
        self.elo = elo
        self.recent_opponents: List[str] = recent or []
        self.state: Literal["queueing", "playing", "idle"] = "queueing"
        self.session_id: Optional[str] = None

    def __repr__(self):
        return f"Player:{self.uid}\n elo:{self.elo}"


class PlayerManager:
    """Keeps a registry of online players."""

    def __init__(self):
        self._players: Dict[str, Player] = {}

    def add(self, player: Player):
        self._players[player.uid] = player

    def remove(self, uid: str):
        self._players.pop(uid, None)

    def get(self, uid: str) -> Optional[Player]:
        return self._players.get(uid)
