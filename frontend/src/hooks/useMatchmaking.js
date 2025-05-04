import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createMatchSocket } from "@/api/ws";

export default function useMatchmaking(onGameStart, onMatchWin) {
    const socketRef = useRef(null);
    const [status, setStatus] = useState("idle");
    const queue = async () => {
        try {
            const ws = await createMatchSocket();
            socketRef.current = ws;
            setStatus("queuing");

            ws.onopen = () => console.log("WS open");

            ws.onmessage = (ev) => {
                const data = JSON.parse(ev.data);
                switch (data.type) {
                    case "auth_ok":
                        break;
                    case "queued":
                        toast.success("Searching for opponent…");
                        break;
                    case "game_start":
                        setStatus("in‑game");
                        onGameStart?.(data);
                        break;
                    case "match_win":
                        toast.success("You win! 🎉");
                        setStatus("idle");
                        onMatchWin?.(data);
                        ws.close();
                        break;
                    default:
                        console.log("WS →", data);
                }
            };

            ws.onerror = (err) => {
                console.error(err);
                toast.error("Server down. Try again later");
                setStatus("idle");
            };
            ws.onclose = () => {
                if (status !== "idle") setStatus("idle");
            };
        } catch (err) {
            toast.error("Server down. Try again later");
            console.log("Server down, Error:", err);
        }
    };

    useEffect(() => () => socketRef.current?.close(), []);

    return { status, queue };
}
