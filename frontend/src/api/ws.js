import { auth } from "@/firebase";

export async function createMatchSocket() {
  // Always fetch a fresh token before hand‑shake
  const token = await auth.currentUser?.getIdToken();
  const url   = `ws://localhost:5678/play?token=${token}`;

  const socket = new WebSocket(url);

  // Optional helper for JSON messages
  socket.sendJson = (obj) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(obj));
    else socket.addEventListener("open", () => socket.send(JSON.stringify(obj)));
  };

  return socket;
}
