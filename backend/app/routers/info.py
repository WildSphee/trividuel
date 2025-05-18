import asyncio
import time
from typing import Dict, List

import pandas as pd
from fastapi import APIRouter, Depends, Request

from app.db import db
from app.dependencies.auth import get_current_user
from app.routers.player import extract_client_ip
from app.utils.country_search import find_country_by_ip
from app.schemas import player_manager

router = APIRouter(
    tags=["info"],
)

global global_df
global_df = []
leaderboard_lock = asyncio.Lock()
last_updated_ts = 0


async def get_snapshot() -> pd.DataFrame:
    """
    Safe read-only copy for request handlers.
    Starts an immediate fetch if snapshot is still None (cold start).
    """
    global global_df
    async with leaderboard_lock:
        if global_df is None:
            global_df = await fetch_global_stats()
        return global_df.copy()


def build_response(df: pd.DataFrame, uid: str, country: str) -> Dict:
    # Global ranking
    df["rank"] = range(1, len(df) + 1)
    top10 = df.head(10)[
        ["uid", "display_name", "elo", "country", "rank", "total_won"]
    ].to_dict("records")
    me_row = df.loc[df["uid"] == uid]
    my_global_rank = int(me_row["rank"].iloc[0]) if not me_row.empty else None

    # Regional ranking
    regional_df = df.loc[df["country"] == country]
    regional_df = regional_df.reset_index(drop=True)
    regional_df["rank"] = range(1, len(regional_df) + 1)
    top10_reg = regional_df.head(10)[
        ["uid", "display_name", "elo", "rank", "total_won"]
    ].to_dict("records")
    my_reg_rank = (
        int(regional_df.loc[regional_df["uid"] == uid]["rank"].iloc[0])
        if uid in regional_df["uid"].values
        else None
    )

    return {
        "global_top10": top10,
        "global_rank": my_global_rank,
        "regional_top10": top10_reg,
        "regional_rank": my_reg_rank,
        "region": country,
        "last_update": int((time.time() - last_updated_ts) // 60),
    }


async def fetch_global_stats() -> pd.DataFrame:
    """
    Pull every player document into a DataFrame.
    Expected fields in each doc: uid, display_name, elo, country (ISO-2 or 'IDK')
    """
    docs = db.collection("players").stream()
    players: List[Dict] = [doc.to_dict() | {"uid": doc.id} async for doc in docs]
    df = pd.DataFrame(players)

    # basic hygiene
    df["elo"] = pd.to_numeric(df["elo"], errors="coerce").fillna(0).astype(int)
    df["country"] = df["country"].str.upper().fillna("IDK")
    return df.sort_values("elo", ascending=False).reset_index(drop=True)


@router.get("/leaderboard")
async def get_leaderboard(request: Request, user=Depends(get_current_user)) -> Dict:
    """
    Returns cached leaderboards plus the caller's ranks.
    Refresh happens asynchronously every 10 min in the background task.
    """
    uid = user["uid"]

    # infer or remember country
    ip = extract_client_ip(request)
    country = find_country_by_ip(ip) or "IDK"

    df = await get_snapshot()
    return build_response(df, uid, country)


@router.get("/ingamecount")
async def get_ingamecount(_=Depends(get_current_user)) -> Dict:
    """
    Count and return the amount of players in game (queueing + playing)
    """
    return {"total": len(player_manager._players)}
