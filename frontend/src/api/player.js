import client from "./client";

export async function getMe() {
  const res = await client.get("/me");
  return res.data;
}

export async function changeType(type) {
  const res = await client.post("/type");
  return res.data;
}