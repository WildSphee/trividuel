import random
from typing import Dict

import firebase_admin
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
    return db.collection("players").document(document)


async def fetch_or_create_player(user) -> Dict:
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
        }
        await doc_ref.set(pdata)

    # # adding new fields for Player
    # for field, default in {"type": random.choice(player_types), "total_won": 0}.items():
    #     if not pdata.get(field):
    #         pdata[field] = default

    await doc_ref.set(pdata)

    return pdata
