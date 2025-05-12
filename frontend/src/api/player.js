import client from "./client";

export async function getMe() {
  const res = await client.get("/me");
  return res.data;
}

export async function changeType() {
  const res = await client.post("/type");
  return res.data;
}