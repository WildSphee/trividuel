import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";

import { createMatchSocket } from "@/api/ws";
import { getMatchSocket, setMatchSocket } from "@/api/matchSocketStore";

export default function GameRoom() {
  const nav = useNavigate();
  const auth = getAuth();

  /* ------------ runtime refs & state ------------ */
  const wsRef = useRef(null);
  const [question, setQuestion] = useState(null);
  const [lives, setLives] = useState({});
  const [answered, setAnswered] = useState(false);

  /* ------------- open / reuse WebSocket ------------- */
  useEffect(() => {
    let createdHere = false;

    (async () => {
      wsRef.current = getMatchSocket();
      if (!wsRef.current) {
        wsRef.current = await createMatchSocket();
        setMatchSocket(wsRef.current);
        createdHere = true;
      }

      wsRef.current.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type !== "game") return;

        const { message, extra } = data;

        switch (message) {
          case "found":
            setLives({});
            setAnswered(false);
            setQuestion(null);
            toast.success("Opponent found – get ready!");
            break;

          case "question":
            setQuestion(extra);
            setAnswered(false);
            break;

          case "reveal": {
            setLives(extra.lives);
            const me = auth.currentUser?.uid;
            const ok = extra.answers[me] === extra.correct;
            toast(ok ? "Correct 🎉" : "Wrong ❌");
            break;
          }

          case "end": {
            const me = auth.currentUser?.uid;
            toast.success(extra.winner === me ? "You win! 🏆" : "You lose 😢");
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

  /* ---------------- send answer ---------------- */
  function sendAnswer(idx) {
    if (answered || !wsRef.current) return;
    // backend now expects this simple payload
    wsRef.current.send(JSON.stringify({ type: "answer", choice: idx }));
    setAnswered(true);
  }

  /* -------------------- UI -------------------- */
  if (!question) {
    return (
      <div className="flex items-center justify-center h-screen">
        Waiting for the first question…
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      {/* lives display */}
      <div className="flex justify-between text-xl mb-8">
        {Object.entries(lives).map(([uid, hp]) => (
          <span key={uid}>
            {uid.slice(0, 4)}…  💖 {hp}
          </span>
        ))}
      </div>

      {/* question */}
      <h2 className="text-2xl mb-6">{question.question}</h2>

      {/* choices */}
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