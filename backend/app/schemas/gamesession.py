import asyncio
import random
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from google.cloud.firestore_v1 import AsyncClient

from app.schemas.players import Player
from app.utils.elo import elo_calculation

SAMPLE_QUESTIONS = [
    {
        "question": "What is the capital of France?",
        "choices": ["Berlin", "Madrid", "Paris", "Rome"],
        "answer": 2,
    },
    {
        "question": "2 + 2 = ?",
        "choices": ["3", "4", "5", "22"],
        "answer": 1,
    },
    {
        "question": "Which planet is known as the Red Planet?",
        "choices": ["Earth", "Mars", "Venus", "Jupiter"],
        "answer": 1,
    },
]


class GameSession:
    QUESTION_TIMEOUT = 10
    REVEAL_TIME = 3

    def __init__(self, p1: Player, p2: Player, db: AsyncClient):
        self.id = str(uuid.uuid4())
        self.players: List[Player] = [p1, p2]
        for p in self.players:
            p.session_id = self.id

        self.questions = random.sample(SAMPLE_QUESTIONS, k=len(SAMPLE_QUESTIONS))
        self.current_index = -1
        self.db = db
        self.timer_task: Optional[asyncio.Task] = None

    # ------------------------------------------------------------------ utils
    async def _safe_send(self, player: Player, payload: Dict):
        if player.websocket.client_state.name == "CONNECTED":
            await player.websocket.send_json(payload)

    async def broadcast(self, payload: Dict):
        for p in self.players:
            await self._safe_send(p, payload)

    async def _delayed_next_question(self, delay: int):
        await asyncio.sleep(delay)
        await self.next_question()

    # ------------------------------------------------------- session lifecycle
    async def start(self):
        # notify both players that opponent was found
        await self.broadcast(
            {
                "type": "game",
                "message": "found",
                "extra": {
                    "session_id": self.id,
                    "players": [p.uid for p in self.players],
                    "lifes": {p.uid: p.lifes for p in self.players},
                },
            }
        )
        # wait 3s then send first question
        asyncio.create_task(self._delayed_next_question(3))

        # set players lifes to 4
        for p in self.players:
            p.lifes = 2

    async def next_question(self):
        # reset answers
        for p in self.players:
            p.current_answer = None
        self.current_index += 1
        if self.current_index >= len(self.questions):
            # out of questions – choose winner by remaining lifes
            await self._end_game("no_more_questions")
            return

        q = self.questions[self.current_index]
        await self.broadcast(
            {
                "type": "game",
                "message": "question",
                "extra": {
                    "index": self.current_index,
                    "question": q["question"],
                    "choices": q["choices"],
                },
            }
        )
        # start timeout reveal task
        self.timer_task = asyncio.create_task(self._reveal_after_timeout())

    async def _reveal_after_timeout(self):
        await asyncio.sleep(self.QUESTION_TIMEOUT)
        await self.reveal()

    async def receive_answer(self, uid: str, choice_idx: int):
        # record answer
        for p in self.players:
            if p.uid == uid:
                p.current_answer = choice_idx
                break
        # if both answered early, cancel timer and reveal
        if all(p.current_answer is not None for p in self.players):
            if self.timer_task:
                self.timer_task.cancel()
            await self.reveal()

    async def reveal(self):
        q = self.questions[self.current_index]
        correct = q["answer"]
        # update lifes
        for p in self.players:
            if p.current_answer != correct:
                p.lifes -= 1
        # build stats
        extra = {
            "correct": correct,
            "answers": {p.uid: p.current_answer for p in self.players},
            "lifes": {p.uid: p.lifes for p in self.players},
        }
        await self.broadcast({"type": "game", "message": "reveal", "extra": extra})

        # determine if someone lost
        losers = [p for p in self.players if p.lifes <= 0]
        if losers:
            await asyncio.sleep(self.REVEAL_TIME)
            await self._end_game("life_zero")
            return

        # else schedule next question
        asyncio.create_task(self._delayed_next_question(self.REVEAL_TIME))

    async def handle_disconnect(self, leaver_uid: str):
        await self.broadcast(
            {
                "type": "game",
                "message": "end",
                "extra": {
                    "winner": next(p.uid for p in self.players if p.uid != leaver_uid),
                    "reason": "opponent_left",
                },
            }
        )
        await self._cleanup_states()

    async def _record_result(self, winner_uid: str, loser_uid: str):
        batch = self.db.batch()
        winner_new, loser_new = elo_calculation(self.players, winner_uid)

        # calculate the ELO and set winner and loser respectively
        for p in self.players:
            if p.uid == winner_uid:
                new_elo = winner_new
            else:
                new_elo = loser_new

            doc = self.db.collection("players").document(p.uid)
            batch.set(doc, {"elo": new_elo, "updated": datetime.utcnow()}, merge=True)

        await batch.commit()

    async def _end_game(self, reason: str):
        winner = max(self.players, key=lambda p: (p.lifes, p.elo)).uid
        await self.broadcast(
            {
                "type": "game",
                "message": "end",
                "extra": {"winner": winner, "reason": reason},
            }
        )
        # persist
        loser = next(p.uid for p in self.players if p.uid != winner)
        await self._record_result(winner, loser)
        await self._cleanup_states()

    async def _cleanup_states(self):
        # reset state for all players
        for p in self.players:
            p.session_id = None
        # TODO: persist stats / ELO if desired
        SessionManager.remove(self.id)

    async def handle_client_message(self, uid: str, data: Dict) -> None:
        """handle all the client json from the ws will be routed here if they're in a game"""

        msg_type = data.get("type")

        # --------------------------------------------------------
        # 1.  The player answered the current question
        # --------------------------------------------------------
        if msg_type == "answer":
            # Expected: { "type": "answer", "choice": <int> }
            choice = data.get("choice")
            if isinstance(choice, int):
                await self.receive_answer(uid, choice)
            return

        # --------------------------------------------------------
        # 2.  The player voluntarily quits the match
        # --------------------------------------------------------
        if msg_type == "quit":
            # Expected: { "type": "quit" }
            await self.handle_disconnect(leaver_uid=uid)
            return

        # --------------------------------------------------------
        # 3.  Keep-alive ping  (optional but useful on mobile)
        # --------------------------------------------------------
        if msg_type == "ping":
            # { "type": "ping", "id": <any> }
            sender = next((p for p in self.players if p.uid == uid), None)
            if sender:
                await self._safe_send(sender, {"type": "pong", "id": data.get("id")})
            return
        if msg_type == "pong":
            return
        # --------------------------------------------------------
        # 4.  Simple chat relay (optional)
        # --------------------------------------------------------
        if msg_type == "chat":
            # { "type": "chat", "text": "hello" }
            text = (data.get("text") or "")[:500]  # truncate to 500 chars
            await self.broadcast({"type": "chat", "from": uid, "text": text})
            return

        # --------------------------------------------------------
        # 5.  Unknown message type end an error back to sender
        # --------------------------------------------------------
        sender = next((p for p in self.players if p.uid == uid), None)
        if sender:
            await self._safe_send(
                sender,
                {
                    "type": "error",
                    "message": f"Unknown message type: {msg_type!r}",
                },
            )


class SessionManager:
    _sessions: Dict[str, GameSession] = {}

    @classmethod
    def add(cls, s: GameSession):
        cls._sessions[s.id] = s

    @classmethod
    def get_by_player(cls, uid: str) -> Optional[GameSession]:
        for s in cls._sessions.values():
            if any(p.uid == uid for p in s.players):
                return s
        return None

    @classmethod
    def remove(cls, sid: str):
        cls._sessions.pop(sid, None)
