import asyncio
import websockets
import json

async def test_websocket():
    url = "ws://localhost:5678/ws?token=1234567890"

    try:
        async with websockets.connect(url) as websocket:
            print("Connected to WebSocket.")

            # Example: Wait for server initial message
            response = await websocket.recv()
            print(f"Received: {response}")

            # Example: Send a dummy message
            await websocket.send(json.dumps({"type": "test_message", "payload": {"message": "Hello Server!"}}))
            print("Sent a test message.")

            # Example: Wait for server reply
            reply = await websocket.recv()
            print(f"Received reply: {reply}")

            # Keep it open for a few seconds to manually test
            await asyncio.sleep(5)

    except Exception as e:
        print(f"Failed to connect or communicate: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
