import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createMatchSocket } from "@/api/ws";
import { useNavigate } from "react-router-dom";


export default function useMatchmaking(onGameStart, onMatchWin) {
    const socketRef = useRef(null);
    const [status, setStatus] = useState("lobby");
    const navigate = useNavigate();

    const queue = async () => {
        try {
            const ws = await createMatchSocket();
            socketRef.current = ws;
            setStatus("queuing");

            ws.onopen = () => console.log("WS open");

            ws.onmessage = (ev) => {
                const data = JSON.parse(ev.data);
                switch (data.type) {
                    case "auth_ok":
                        break;
                    case "queue":
                        toast.success("Searching for opponent…");
                        break;
                    case "game":
                        setStatus("playing");
                        onGameStart?.(data);
                        break;
                    case "game":
                        switch (data.message) {
                            case "found":
                                session_id = data.extra.session_id;
                                console.log('game found, navigate to /session id');
                                navigate(`/${data.extra.session_id}`, { replace: true });
                                break
                            case "end":
                                if data.extra.winner == <myself></myself>
                                toast.success("You win! 🎉");
                                setStatus("idle");
                                onMatchWin?.(data);
                                ws.close();
                                break;

                        }
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
