import { useEffect, useRef, useState } from "react";
import { useNavigate }           from "react-router-dom";
import toast                     from "react-hot-toast";
import { createMatchSocket }     from "@/api/ws";
import { auth }                  from "@/firebase";

import { setMatchSocket } from "@/api/matchSocketStore";


export default function useMatchmaking(onGameStart, onMatchWin) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("idle");            // idle | queuing | playing
  const navigate = useNavigate();

  const queue = async () => {
    try {
      const ws = await createMatchSocket();
      socketRef.current = ws;
      setMatchSocket(ws);                 // store for reuse
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

          case "game": {
            const { message, extra } = data;

            if (message === "found") {
              setStatus("playing");
              onGameStart?.(data);
              navigate(`/room/${extra.session_id}`, { replace: true });
              return;
            }

            if (message === "end") {
              const me = auth.currentUser?.uid;
              toast.success(extra.winner === me ? "You win! 🎉" : "You lose 😢");
              setStatus("idle");
              onMatchWin?.(data);
              ws.close();
              return;
            }
            break;
          }

          default:
            console.log("WS →", data);
        }
      };

      ws.onerror = (err) => {
        console.error(err);
        toast.error("Server down. Try again later");
        setStatus("idle");
      };

      ws.onclose = () => setStatus("idle");
    } catch (err) {
      console.error(err);
      toast.error("Server down. Try again later");
      setStatus("idle");
    }
  };

  /* auto‑cleanup when lobby unmounts (but socket stays open for match) */
  useEffect(() => () => {
    if (socketRef.current?.readyState === WebSocket.OPEN && status !== "playing") {
      socketRef.current.close();
      setMatchSocket(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return { status, queue };
}
