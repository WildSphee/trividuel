import client from "./client";

export async function getLeaderboard() {
  const res = await client.get("/leaderboard");
  return res.data;
}
