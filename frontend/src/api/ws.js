import { auth } from "@/firebase";

let matchSocket = null;

export function clearMatchSocket() {
  if (matchSocket?.readyState === WebSocket.OPEN) matchSocket.close();
  matchSocket = null;
}

export async function getMatchSocket() {
  // 👉 reuse if it already exists
  if (matchSocket && matchSocket.readyState === WebSocket.OPEN)
    return matchSocket;

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Auth token not ready");

  const socket = new WebSocket(
    import.meta.env.VITE_BACKEND_WS + `/play?token=${token}`
  );

  socket.sendJson = (obj) => {
    const msg = JSON.stringify(obj);
    if (socket.readyState === WebSocket.OPEN) socket.send(msg);
    else
      socket.addEventListener("open", () => socket.send(msg), { once: true });
  };

  matchSocket = socket;
  return socket;
}
