import asyncio
from typing import List, Optional

from schemas.players import Player


class MatchmakingQueue:
    """Simple priority queue ordered roughly by ELO."""

    def __init__(self):
        self._queue: List[Player] = []
        self._lock = asyncio.Lock()

    async def add(self, player: Player):
        async with self._lock:
            self._queue.append(player)
            # keep queue sorted by elo for quick nearest‑neighbour matching
            self._queue.sort(key=lambda p: p.elo)

    async def remove(self, player: Player):
        async with self._lock:
            if player in self._queue:
                self._queue.remove(player)

    async def pop_pair(self) -> Optional[tuple]:
        """Return two players that satisfy matching rules, or None."""
        async with self._lock:
            if len(self._queue) < 2:
                return None

            # iterate pairs until find non‑repeat opponents with closest elo
            for idx in range(1, len(self._queue)):
                p1 = self._queue[0]
                p2 = self._queue[idx]
                if p2.uid in p1.recent_opponents or p1.uid in p2.recent_opponents:
                    continue
                # found a pair
                self._queue.pop(idx)
                self._queue.pop(0)
                return p1, p2

            # fallback to first two players (will re‑match repeated opponents if nothing else)
            p1 = self._queue.pop(0)
            p2 = self._queue.pop(0)
            return p1, p2
