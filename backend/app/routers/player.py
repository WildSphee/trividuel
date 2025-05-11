from random import choice
from typing import Dict

from fastapi import APIRouter, Depends, status

from app.db import create_doc_ref, fetch_or_create_player
from app.dependencies.auth import get_current_user
from app.schemas.type import player_types

router = APIRouter(
    tags=["player"],
)


@router.get("/me")
async def get_me(user=Depends(get_current_user)) -> Dict:
    """REST endpoint for the player to fetch their profile."""

    return await fetch_or_create_player(user)


@router.post("/type", status_code=status.HTTP_200_OK)
async def change_type(user: dict = Depends(get_current_user)) -> dict:
    """
    Set the current player's `type` to 'skeleton'.
    Returns 200 on success, 404 if the player document is missing.
    """
    uid = user["uid"]
    doc_ref = await create_doc_ref(uid)

    # Check that the player doc exists
    pdata = await fetch_or_create_player(user)

    # change player to another random type
    types_choices = player_types.copy()
    types_choices.remove(pdata["type"])
    new_type = choice(types_choices)

    # Update only the `type` field
    await doc_ref.update({"type": new_type})
    return {"message": new_type}
