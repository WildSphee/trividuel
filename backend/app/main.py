import asyncio
from typing import Dict

import firebase_admin
from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials
from google.cloud.firestore_v1 import AsyncClient
from starlette.websockets import WebSocketState

from app.config import settings
from app.dependencies.auth import get_current_user
from app.schemas.gamesession import GameSession, SessionManager
from app.schemas.matchmaking import MatchmakingQueue
from app.schemas.players import Player, PlayerManager

HEARTBEAT_INTERVAL = 20

cred_path = settings.google_application_credentials
project_id = settings.firebase_project_id

# Initialise Firebase Admin SDK
firebase_admin.initialize_app(
    credentials.Certificate(cred_path), {"projectId": project_id}
)

db = AsyncClient(project=project_id, database="trividuel-db")


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
        _debug_print()
        pair = await match_queue.pop_pair()
        if pair:
            p1, p2 = pair
            session = GameSession(p1, p2, db)
            session_manager.add(session)
            await session.start()

        # matchmaking tick
        await asyncio.sleep(settings.game_queueing_tick)


async def _fetch_or_create_player(user) -> Dict:
    uid = user["uid"]
    doc_ref = db.collection("players").document(uid)
    snapshot = await doc_ref.get()

    if snapshot.exists:
        pdata = snapshot.to_dict()
    else:
        pdata = {
            "uid": uid,
            "elo": 1200,
            "display_name": user["name"],
        }
        await doc_ref.set(pdata)

    return pdata


app = FastAPI()

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

    asyncio.create_task(matchmaker_loop())


@app.get("/me")
async def get_me(user=Depends(get_current_user)) -> Dict:
    """REST endpoint for the player to fetch their profile."""

    return await _fetch_or_create_player(user)


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

    pdata = await _fetch_or_create_player(user)

    player = Player(uid, ws, pdata["elo"], display_name)

    # add player to the player manager
    player_manager.add(player)

    # Automatically enqueue for matchmaking
    await match_queue.add(player)
    await ws.send_json({"type": "queue", "message": "start"})

    async def heartbeat():
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)
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
        if ws.application_state is not WebSocketState.DISCONNECTED:
            await ws.close()

    # Start heartbeat in background
    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        while True:
            data = await ws.receive_json()
            print("received:", display_name, data)
            # send user message to the game if the user sends
            session = session_manager.get_by_player(uid)
            if session:
                await session.handle_client_message(uid, data)

    except WebSocketDisconnect:
        await disconnect()
    except Exception as e:
        print(f"Unexpected error: {e}")
        await disconnect()
    finally:
        heartbeat_task.cancel()
