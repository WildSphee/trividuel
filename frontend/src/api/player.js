import client from "./client";

export async function getMe() {
  const res = await client.get("/me");
  return res.data;
}
