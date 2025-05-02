from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS – allow everything during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in‑memory connection pool
connections: set[WebSocket] = set()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connections.add(ws)
    try:
        while True:
            data = await ws.receive_text()
            # For now just echo
            for conn in connections:
                await conn.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        connections.remove(ws)

if __name__ == "__main__":
    # 0.0.0.0 so Docker/VM can hit it, port 8765
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=True)
