import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getMatchSocket, clearMatchSocket } from "@/api/ws";

export default function useMatchmaking(onGameStart) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | queueing | playing
  const navigate = useNavigate();

  const queue = async () => {
    try {
      const ws = await getMatchSocket();
      socketRef.current = ws;

      setStatus("queueing");

      ws.onopen;

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
              setStatus("idle");
              return;
            }
            break;
          }
          case "zombie":
            break;

          default:
            console.log("WS →", data);
        }
      };

      ws.onerror = (err) => {
        console.error(err);
        toast.error("Server down. Try again later");
        setStatus("idle");
      };

      ws.onclose = () => {
        setStatus("idle");
      };
    } catch (err) {
      console.error(err);
      toast.error("Server down. Try again later");
      setStatus("idle");
    }
  };

  /* clean up when player no longer playing */
  useEffect(() => {
    if (status === "idle") {
      clearMatchSocket();
    }
  }, [status]);

  return { status, queue };
}
