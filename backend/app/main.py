import asyncio

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

from app.config.config import settings
from app.dependencies.auth import get_current_user
from app.schemas.gamesession import GameSession, SessionManager
from app.schemas.matchmaking import MatchmakingQueue
from app.schemas.players import Player, PlayerManager

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


async def matchmaker_loop():
    """Background coroutine that continually pairs players."""
    while True:
        print(f"{session_manager._sessions=}")
        print(f"{match_queue._queue=}")
        pair = await match_queue.pop_pair()
        if pair:
            p1, p2 = pair
            session = GameSession(p1, p2, db)
            session_manager.add(session)
            await session.start()
        await asyncio.sleep(2)  # matchmaking tick


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

    # Kick off the asynchronous matchmaker.
    asyncio.create_task(matchmaker_loop())


@app.get("/me")
async def get_me(user=Depends(get_current_user)):
    """REST endpoint for the player to fetch their profile."""
    uid = user["uid"]

    doc_ref = db.collection("players").document(uid)
    snapshot = await doc_ref.get()

    if snapshot.exists:
        pdata = snapshot.to_dict()
    else:
        pdata = {
            "elo": 1200,
            "recent": [],
            "display_name": user["name"],
        }
        await doc_ref.set(pdata)

    return {"uid": uid, **pdata}


@app.websocket("/play")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    """Primary WebSocket endpoint. Client must supply ?token=ID_TOKEN."""

    try:
        user = await get_current_user(token)
    except HTTPException:
        await ws.close(code=4401)
        return

    uid = user["uid"]
    display_name = user["name"]
    print(f"new connection from {display_name}")

    await ws.accept()

    # Fetch or create player profile
    doc_ref = db.collection("players").document(uid)
    snapshot = await doc_ref.get()
    if snapshot.exists:
        pdata = snapshot.to_dict()
        elo = pdata.get("elo", 1200)
        recent = pdata.get("recent", [])
    else:
        elo = 1200
        recent = []
        await doc_ref.set({"elo": elo, "recent": recent, "display_name": display_name})

    player = Player(uid, ws, elo, display_name, recent)
    player_manager.add(player)

    # Automatically enqueue for matchmaking
    await match_queue.add(player)
    await ws.send_json({"type": "queue", "message": "start"})

    try:
        while True:
            data = await ws.receive_json()
            # Route in‑game messages to opponent if in session
            if session := session_manager.get_by_player(uid):
                for p in session.players:
                    if p.uid != uid:
                        await p.websocket.send_json({"type": "relay", "payload": data})

    except WebSocketDisconnect:
        # Remove from queue if still waiting
        await match_queue.remove(player)
        session = session_manager.get_by_player(uid)
        if session:
            await session.handle_disconnect(uid)
            session_manager.remove(session.id)
        player_manager.remove(uid)
