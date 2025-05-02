export const socket = new WebSocket("ws://localhost:8765/ws");

export function sendMessage(msg) {
  if (socket.readyState === WebSocket.OPEN) socket.send(msg);
  else
    socket.addEventListener("open", () => {
      socket.send(msg);
    });
}
