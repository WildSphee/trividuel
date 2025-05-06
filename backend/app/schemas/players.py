from typing import Dict, Optional

from fastapi import WebSocket


class Player:
    """Represents a connected player."""

    def __init__(
        self,
        uid: str,
        ws: WebSocket,
        elo: int = 1200,
        name: Optional[str] = None,
    ):
        self.uid = uid
        self.websocket = ws
        self.elo = elo
        self.name = name
        self.session_id: Optional[str] = None

    def __repr__(self) -> str:
        return str(
            {
                "name": self.name,
                "elo": self.elo,
                "uid": self.uid,
            }
        )


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
