from fastapi import HTTPException, Query
from firebase_admin import auth

from app.config import settings


async def get_current_user(token: str = Query(...)):
    """Dependency that verifies Firebase ID token and returns user info."""
    if settings.environment == "TEST" and token in ["1234567890", "0987654321"]:
        return {"uid": token, "name": "Tester"}

    try:
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token["uid"],
            "name": decoded_token.get("name", "Anonymous"),
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
