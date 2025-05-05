import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import { getAuth }    from "firebase/auth";
import toast          from "react-hot-toast";

import { createMatchSocket }          from "@/api/ws";
import { getMatchSocket, setMatchSocket } from "@/api/matchSocketStore";

export default function GameRoom() {
  const { sessionId } = useParams();        // not used - yet
  const nav           = useNavigate();
  const auth          = getAuth();

  /* runtime refs & state */
  const wsRef     = useRef(null);
  const [question, setQuestion] = useState(null);
  const [lives,    setLives]    = useState({});
  const [answered, setAnswered] = useState(false);

  /* ---------- establish / reuse WebSocket ---------- */
  useEffect(() => {
    let createdHere = false;

    (async () => {
      wsRef.current = getMatchSocket();
      if (!wsRef.current) {
        wsRef.current = await createMatchSocket();
        setMatchSocket(wsRef.current);
        createdHere = true;
      }

      // tell server we’re ready in case we missed the first broadcast
      wsRef.current.send(JSON.stringify({ type: "game", message: "ready" }));

      wsRef.current.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type !== "game") return;

        const { message, extra } = data;

        switch (message) {
          case "question":
            setQuestion(extra);
            setAnswered(false);
            break;

          case "reveal": {
            setLives(extra.lives);
            const me  = auth.currentUser?.uid;
            const ok  = extra.answers[me] === extra.correct;
            toast(ok ? "Correct!" : "Wrong!", { icon: ok ? "✅" : "❌" });
            break;
          }

          case "end": {
            const me = auth.currentUser?.uid;
            toast.success(extra.winner === me ? "You win! 🎉" : "You lose 😢");
            setTimeout(() => nav("/game", { replace: true }), 1500);
            break;
          }

          default:
            console.log("WS →", data);
        }
      };
    })();

    return () => {
      if (createdHere && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        setMatchSocket(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- send answer ---------- */
  const sendAnswer = (idx) => {
    if (answered || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({ type: "game", message: "answer", extra: { choice: idx } })
    );
    setAnswered(true);
  };

  /* ---------- UI ---------- */
  if (!question) {
    return (
      <div className="flex items-center justify-center h-screen">
        Waiting for the first question…
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <div className="flex justify-between text-xl mb-8">
        {Object.entries(lives).map(([uid, hp]) => (
          <span key={uid}>
            {uid.slice(0, 4)}…  💖 {hp}
          </span>
        ))}
      </div>

      <h2 className="text-2xl mb-6">{question.question}</h2>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => sendAnswer(i)}
            disabled={answered}
            className="border rounded-lg p-4 hover:bg-gray-100 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      {answered && (
        <p className="mt-6 italic text-gray-500">Waiting for opponent…</p>
      )}
    </div>
  );
}
