import asyncio
import os

import firebase_admin
from dotenv import load_dotenv
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import auth, credentials
from google.cloud.firestore_v1 import AsyncClient

from app.schemas.gamesession import GameSession, GameSessionManager
from app.schemas.matchmaking import MatchmakingQueue
from app.schemas.players import Player, PlayerManager

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
project_id = os.getenv("FIREBASE_PROJECT_ID")

if not cred_path or not project_id:
    raise RuntimeError(
        "GOOGLE_APPLICATION_CREDENTIALS and FIREBASE_PROJECT_ID must be set in .env"
    )

# Initialise Firebase Admin SDK
firebase_admin.initialize_app(
    credentials.Certificate(cred_path), {"projectId": project_id}
)

db = AsyncClient(project=project_id)


player_manager = PlayerManager()

match_queue = MatchmakingQueue()

session_manager = GameSessionManager()


async def matchmaker_loop():
    """Background coroutine that continually pairs players."""
    while True:
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


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    """Primary WebSocket endpoint. Client must supply ?token=ID_TOKEN."""
    print('new connection')
    
    if os.getenv("ENVIRONMENT") == "TEST" and token == "1234567890":
        decoded = {"uid": "1234567890", "name": "Tester"}
        print("New connection via test account")
    else:
        try:
            decoded = auth.verify_id_token(token)
        except Exception:
            await ws.close(code=4401)  # Unauthorized
            return

    uid = decoded["uid"]
    display_name = decoded.get("name", "Anonymous")

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

    player = Player(uid, ws, elo, recent)
    player_manager.add(player)

    # Notify client auth successful
    await ws.send_json({"type": "auth_ok", "elo": elo, "display_name": display_name})

    # Automatically enqueue for matchmaking
    await match_queue.add(player)
    await ws.send_json({"type": "queued"})

    try:
        # Listen for messages
        while True:
            data = await ws.receive_json()
            # Route in‑game messages to opponent if in session
            session = session_manager.get_by_player(uid)
            if session:
                for p in session.players:
                    if p.uid != uid and p.websocket.client_state.name == "CONNECTED":
                        await p.websocket.send_json({"type": "relay", "payload": data})
    except WebSocketDisconnect:
        # Remove from queue if still waiting
        await match_queue.remove(player)
        session = session_manager.get_by_player(uid)
        if session:
            await session.handle_disconnect(uid)
            session_manager.remove(session.id)
        player_manager.remove(uid)
