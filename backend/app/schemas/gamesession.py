import asyncio
import uuid
from contextlib import suppress
from datetime import datetime
from typing import Dict, List, Optional

from google.cloud.firestore_v1 import AsyncClient
from starlette.websockets import WebSocketState

from app.db import create_doc_ref
from app.schemas.players import Player
from app.utils.elo import elo_calculation
from app.utils.prepare_questions import Question, get_random_questions


class GameSession:
    PLAYER_STARTING_LIFE = 3
    START_GAME_DELAY = 3
    QUESTION_TIMEOUT = 20
    REVEAL_TIME = 3
    QUESTION_COUNT = 10

    def __init__(self, p1: Player, p2: Player, db: AsyncClient):
        self.id = str(uuid.uuid4())
        self.players: List[Player] = [p1, p2]
        for p in self.players:
            p.session_id = self.id

        self.questions: List[Question] = get_random_questions(self.QUESTION_COUNT)
        self.ans_his: List[Dict] = []
        self.current_index: int = -1
        self.db = db
        self.timer_task: Optional[asyncio.Task] = None

        # if a player disconnects the other one will disconnect as well, so we store the first msg
        # of disconnect to bypass subsequent disconnect messages
        self.leaver_uid: str = ""

    # ------------------------------------------------------------------ utils
    async def _safe_send(self, player: Player, payload: Dict):
        if player.ws.application_state is not WebSocketState.DISCONNECTED:
            with suppress(RuntimeError):
                await player.ws.send_json(payload)

    async def broadcast(self, payload: Dict):
        for p in self.players:
            await self._safe_send(p, payload)

    async def _delayed_next_question(self, delay: int):
        await asyncio.sleep(delay)
        await self.next_question()

    # ------------------------------------------------------- session lifecycle
    async def start(self):
        # set players lifes
        for p in self.players:
            p.lifes = self.PLAYER_STARTING_LIFE

        # notify both players that game found - for useMatchmaking.js
        await self.broadcast(
            {
                "type": "game",
                "message": "found",
                "extra": {
                    "session_id": self.id,
                },
            }
        )
        # sleep to await players redirect to room first
        await asyncio.sleep(1)
        # notify both players that game starts - for GameRoom.jsx
        await self.broadcast(
            {
                "type": "game",
                "message": "start",
                "extra": {
                    "players": [p.to_dict() for p in self.players],
                    "lifes": {p.uid: [p.name, p.lifes] for p in self.players},
                },
            }
        )
        # wait 3s then send first question
        asyncio.create_task(self._delayed_next_question(self.START_GAME_DELAY))

    async def next_question(self):
        # reset answers
        for p in self.players:
            p.current_answer = None
        self.current_index += 1
        if self.current_index >= len(self.questions):
            # out of questions – choose winner by remaining lifes
            await self._end_game("No More Questions")
            return

        q = self.questions[self.current_index]
        await self.broadcast(
            {
                "type": "game",
                "message": "question",
                "extra": {
                    "index": self.current_index,
                    "question": q.question,
                    "choices": q.choices,
                    "question_timeout": self.QUESTION_TIMEOUT,
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
        correct = q.answer
        # update lifes
        for p in self.players:
            if p.current_answer != correct:
                p.lifes -= 1
        # build stats
        extra = {
            "correct": correct,
            "answers": {p.uid: p.current_answer for p in self.players},
            "lifes": {p.uid: [p.name, p.lifes] for p in self.players},
        }
        await self.broadcast({"type": "game", "message": "reveal", "extra": extra})
        self.ans_his.append(
            {
                "index": self.current_index,
                "question:": q.question,
                "correct_ans": q.choices[correct],
                "player_correct": {
                    p.uid: p.current_answer == correct for p in self.players
                },
            }
        )

        # determine if someone lost
        losers = [p for p in self.players if p.lifes <= 0]
        if losers:
            await asyncio.sleep(self.REVEAL_TIME)
            await self._end_game("Ran Out of Lifes")
            return

        # else schedule next question
        asyncio.create_task(self._delayed_next_question(self.REVEAL_TIME))

    async def handle_disconnect(self, leaver_uid: str):
        # if this returns true, means we know the leaver already
        if self.leaver_uid:
            return
        self.leaver_uid = leaver_uid

        winner: Player = next(p for p in self.players if p.uid != leaver_uid)
        loser: Player = next(p for p in self.players if p.uid == leaver_uid)

        winner_new, loser_new, winner_delta, loser_delta = elo_calculation(
            winner, loser
        )

        await self.broadcast(
            {
                "type": "game",
                "message": "end",
                "extra": {
                    "winner": next(p.uid for p in self.players if p.uid != leaver_uid),
                    "reason": "Opponent Left",
                    "elo_delta": (winner_delta, loser_delta),
                    "questions": self.ans_his,
                },
            }
        )

        await self._record_result(winner, loser, winner_new, loser_new)

        await self._cleanup_states()

    async def _record_result(
        self, winner: Player, loser: Player, winner_new: int, loser_new: int
    ):
        batch = self.db.batch()

        # calculate the ELO and set winner and loser respectively
        async def set_elo_and_wins(player, new_elo, win_increment: int = 0):
            doc = await create_doc_ref(player.uid)
            payload = {"elo": new_elo, "updated": datetime.utcnow()}
            if win_increment:
                payload.update({"total_won": player.total_won + 1})
            batch.set(doc, payload, merge=True)

        await set_elo_and_wins(winner, winner_new, 1)
        await set_elo_and_wins(loser, loser_new)

        await batch.commit()

    async def _end_game(self, reason: str):
        # check for tie first
        if self.players[0].lifes == self.players[1].lifes:
            await self.broadcast(
                {
                    "type": "game",
                    "message": "end",
                    "extra": {
                        "winner": None,
                        "reason": "Tie In Lifes",
                        "elo_delta": (0, 0),
                        "questions": self.ans_his,
                    },
                }
            )
            await self._cleanup_states()
            return

        winner: Player = max(self.players, key=lambda p: (p.lifes))
        loser: Player = next(p for p in self.players if p.uid != winner.uid)

        winner_new, loser_new, winner_delta, loser_delta = elo_calculation(
            winner, loser
        )

        await self._record_result(winner, loser, winner_new, loser_new)

        await self.broadcast(
            {
                "type": "game",
                "message": "end",
                "extra": {
                    "winner": winner.uid,
                    "reason": reason,
                    "elo_delta": (winner_delta, loser_delta),
                    "questions": self.ans_his,
                },
            }
        )
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
