from random import choice
from typing import Dict

from fastapi import APIRouter, Depends, Request, status

from app.db import create_doc_ref, extract_client_ip, fetch_or_create_player
from app.dependencies.auth import get_current_user
from app.schemas import player_manager, player_types

router = APIRouter(
    tags=["player"],
)


@router.get("/me")
async def get_me(request: Request, user=Depends(get_current_user)) -> Dict:
    """REST endpoint for the player to fetch their profile."""

    ip = extract_client_ip(request)
    return await fetch_or_create_player(user, ip)


@router.post("/type", status_code=status.HTTP_200_OK)
async def change_type(request: Request, user: dict = Depends(get_current_user)) -> dict:
    """
    Set the current player's `type` to 'skeleton'.
    Returns 200 on success, 404 if the player document is missing.
    """
    uid = user["uid"]
    doc_ref = await create_doc_ref(uid)

    # Check that the player doc exists
    ip = extract_client_ip(request)
    pdata = await fetch_or_create_player(user, ip)

    # change player to another random type
    types_choices = player_types.copy()
    types_choices.remove(pdata["type"])
    new_type = choice(types_choices)

    # if the player is currently queueing, change their type
    if current_player := player_manager.get(uid):
        current_player.type = new_type

    # Update only the `type` field
    await doc_ref.update({"type": new_type})
    return {"message": new_type}
