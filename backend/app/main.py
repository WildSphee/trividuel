import asyncio
from contextlib import suppress

from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

from app.config import settings
from app.db import db, fetch_or_create_player
from app.dependencies.auth import get_current_user
from app.routers import player_router
from app.schemas.gamesession import GameSession, SessionManager
from app.schemas.matchmaking import MatchmakingQueue
from app.schemas.players import Player, PlayerManager
from app.utils.prepare_questions import load_questions_from_csv


player_manager = PlayerManager()

match_queue = MatchmakingQueue()

session_manager = SessionManager()


def _debug_print() -> None:
    if player_manager._players:
        print("Active Players:\n", player_manager._players.values())
    if session_manager._sessions:
        print("Active Sessions:\n", session_manager._sessions.keys())
    if match_queue._queue:
        print("Active Queueing:\n", match_queue._queue)


async def matchmaker_loop():
    """Background coroutine that continually pairs players."""
    while True:
        # _debug_print()
        pair = await match_queue.pop_pair()
        if pair:
            p1, p2 = pair
            session = GameSession(p1, p2, db)
            session_manager.add(session)
            await session.start()

        # matchmaking tick
        await asyncio.sleep(settings.game_queueing_tick)


app = FastAPI()
app.include_router(player_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    load_dotenv()

    print("Trividuel Starting")

    # load the start up questions
    asyncio.create_task(load_questions_from_csv(settings.QUESTION_SET_PATH))

    # start the queueing system for players to play
    asyncio.create_task(matchmaker_loop())


@app.websocket("/play")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    """Primary WebSocket endpoint. Client must supply ?token=ID_TOKEN."""

    try:
        user = await get_current_user(token)
    except HTTPException:
        await ws.send_text("Invalid query token.")
        await ws.close(code=4401)
        return

    # default data guarenteed to exist in firebase
    uid = user["uid"]
    display_name = user["name"]

    if player_manager.get(uid):
        await ws.send_text("You are already connected from another session.")
        await ws.close(code=4401)
        return

    await ws.accept()
    print(f"new connection from {display_name}")

    pdata = await fetch_or_create_player(user)

    player = Player(
        uid=uid,
        ws=ws,
        type=pdata["type"],
        total_won=pdata["total_won"],
        elo=pdata["elo"],
        name=display_name,
    )

    # add player to the player manager
    player_manager.add(player)

    # Automatically enqueue for matchmaking
    await match_queue.add(player)
    await ws.send_json({"type": "queue", "message": "start"})

    async def heartbeat():
        try:
            while True:
                await asyncio.sleep(settings.HEARTBEAT_INTERVAL)
                await ws.send_json({"type": "ping"})
        except Exception as e:
            print("ERROR:", e)
            await disconnect()

    async def disconnect():
        await match_queue.remove(player)
        session = session_manager.get_by_player(uid)
        if session:
            await session.handle_disconnect(uid)
            session_manager.remove(session.id)
        player_manager.remove(uid)
        heartbeat_task.cancel()
        # try to close the extra connection & suppress the logs to keep terminal clean
        if ws.application_state is not WebSocketState.DISCONNECTED:
            with suppress(RuntimeError):
                await ws.close()

    # Start heartbeat in background
    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        while True:
            data = await ws.receive_json()
            # send user message to the game if the user sends
            session = session_manager.get_by_player(uid)
            if session:
                await session.handle_client_message(uid, data)

    except WebSocketDisconnect:
        await disconnect()
    except Exception as e:
        print(f"Unexpected error: {e}")
        await disconnect()
