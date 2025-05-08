import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase";
import { getMatchSocket, clearMatchSocket } from "@/api/ws";


export default function useMatchmaking(onGameStart, onMatchWin) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("idle");            // idle | queueing | playing
  const navigate = useNavigate();

  const queue = async () => {
    try {
      const ws = await getMatchSocket();
      socketRef.current = ws;

      setStatus("queueing");

      ws.onopen = () => console.log("WS open, status:", status);

      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data);

        switch (data.type) {
          case "queue":
            toast.success("Searching for opponent…");
            break;

          case "ping":
            socketRef.current.send(JSON.stringify({ type: "pong" }));

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

      ws.onclose = (ev) => {
        toast.error("ws onclose:", ev.code, ev.reason);
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server down. Try again later");
      setStatus("idle");
    }
  };

  /* clean up when player no longer playing */
  useEffect(() => {
    if (status === "idle") {
      toast.error("idle")
      clearMatchSocket();
    }
  }, [status]);

  return { status, queue };
}
