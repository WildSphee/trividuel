import random
from typing import Dict

import firebase_admin
import httpx
from fastapi import Request, WebSocket
from firebase_admin import credentials
from google.cloud.firestore_v1 import AsyncClient

from app.config import settings
from app.schemas import player_types

# Initialise Firebase Admin SDK
firebase_admin.initialize_app(
    credentials.Certificate(settings.google_application_credentials),
    {"projectId": settings.firebase_project_id},
)

db = AsyncClient(project=settings.firebase_project_id, database="trividuel-db")


async def create_doc_ref(document: str, collection: str = "players"):
    return db.collection(collection).document(document)


def extract_client_ip(obj: Request | WebSocket) -> str:
    """
    Works for both `Request` and `WebSocket`.
    Returns first public IPv4/IPv6 it finds.
    Order of preference:
      1. X-Forwarded-For (added by Nginx / any L7 proxy)
      2. X-Real-IP         (fallback older header)
      3. direct peer addr  (request.client.host / websocket.client[0])
    """
    # Both Request & WebSocket expose `.headers`
    xff = obj.headers.get("x-forwarded-for")
    if xff:
        # Extract first hop and strip spaces
        return xff.split(",")[0].strip()

    x_real = obj.headers.get("x-real-ip")
    if x_real:
        return x_real.strip()

    # Direct connection
    if isinstance(obj, Request):
        return obj.client.host
    else:  # WebSocket
        return obj.client[0]


async def find_country_by_ip(client_ip: str) -> str:
    if client_ip.startswith("127."):
        return "DEV"

    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://ipapi.co/{client_ip}/json/")
        data = response.json()
        country_code = data.get("country")  # e.g., "US", "IN", etc.

    return str(country_code) or "Unknown"


async def fetch_or_create_player(user, client_ip) -> Dict:
    uid = user["uid"]
    doc_ref = await create_doc_ref(uid)
    snapshot = await doc_ref.get()

    if snapshot.exists:
        pdata = snapshot.to_dict()
    else:
        pdata = {
            "uid": uid,
            "elo": 1200,
            "display_name": user["name"],
            "type": random.choice(player_types),
            "total_won": 0,
            "country": await find_country_by_ip(client_ip),
        }
        await doc_ref.set(pdata)

    # adding new fields for Player
    for field, default in {
        "country": await find_country_by_ip(client_ip),
        "total_won": 0,
    }.items():
        if not pdata.get(field):
            pdata[field] = default

    await doc_ref.set(pdata)

    return pdata
