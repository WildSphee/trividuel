import client from "./client";

export async function login() {
  const res = await client.post("/login");
  return res.data;
}
