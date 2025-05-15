from typing import Dict, Optional

from fastapi import WebSocket


class Player:
    """Represents a connected player."""

    def __init__(
        self,
        uid: str,
        ws: WebSocket,
        type: str,
        total_won=0,
        elo: int = 1200,
        name: str = "Unknown",
        country: Optional[str] = None,
    ):
        self.uid = uid
        self.ws = ws
        self.type = type
        self.total_won = total_won
        self.elo = elo
        self.name = name
        self.country = country
        self.session_id: Optional[str] = None

    def __str__(self):
        return f"{self.name}-{self.elo}"

    def __repr__(self) -> str:
        return str(self.to_dict())

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "type": self.type,
            "elo": self.elo,
            "country": self.country,
            "total_won": self.total_won,
        }


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
