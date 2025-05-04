import asyncio
import websockets
import json

async def test_websocket():
    url = "ws://localhost:5678/play?token=0987654321"

    try:
        async with websockets.connect(url) as websocket:
            print("Connected to WebSocket - player2")

            while True:
                reply = await websocket.recv()
                print(f"Received reply: {reply}")

    except Exception as e:
        print(f"Failed to connect or communicate: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
