import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAuth } from "firebase/auth";

export default function GameRoom() {
  const { sessionId } = useParams();          // from /:sessionId route
  const nav = useNavigate();
  const wsRef = useRef(null);

  const [lives, setLives] = useState({});     // { uid: 3, ... }
  const [question, setQuestion] = useState(null);   // {question, choices, index}
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    auth.currentUser.getIdToken(true).then(token => {
      wsRef.current = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws?token=${token}`);

      wsRef.current.onopen = () => console.log("game socket open");

      wsRef.current.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type !== "game") return;

        switch (data.message) {
          case "question":
            setQuestion(data.extra);
            setAnswered(false);
            break;
          case "reveal":
            setLives(data.extra.lives);
            toast(
              data.extra.correct === data.extra.answers[auth.currentUser.uid]
                ? "Correct!"
                : "Wrong!",
              { icon: data.extra.correct === data.extra.answers[auth.currentUser.uid] ? "✅" : "❌" }
            );
            break;
          case "end":
            toast.success(
              data.extra.winner === auth.currentUser.uid ? "You win! 🎉" : "You lose 😢"
            );
            nav("/lobby", { replace: true });
            break;
          default:
            console.log("game msg", data);
        }
      };
    });

    return () => wsRef.current?.close();
  }, []);

  const sendAnswer = (idx) => {
    if (answered) return;
    setAnswered(true);
    wsRef.current?.send(
      JSON.stringify({ type: "game", message: "answer", extra: { choice: idx } })
    );
  };

  if (!question) return <div className="flex items-center justify-center h-screen">Waiting…</div>;

  return (
    <div className="p-6 text-center">
      {/* lives heads‑up display */}
      <div className="flex justify-between text-xl mb-8">
        {Object.entries(lives).map(([uid, hp]) => (
          <span key={uid}>
            {uid.slice(0, 4)}… 💖 {hp}
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
    </div>
  );
}
