import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import { getMatchSocket } from "@/api/ws";
import CountdownTimer from "../components/Timer";
import LifeCard from "../components/LifeCard";
import VSScreen from "@/components/VSScreen"

export default function GameRoom() {
  const nav = useNavigate();
  const auth = getAuth();
  const me = auth.currentUser?.uid;

  const wsRef = useRef(null);
  const [question, setQuestion] = useState(null);
  const [lifes, setLifes] = useState({});
  const [data, setData] = useState({});
  const [answered, setAnswered] = useState(false);

  const [questionTimeout, setQuestionTimeout] = useState(0);

  const { myLife, opponentLife } = useMemo(() => {
    const entries = Object.entries(lifes);
    return {
      myLife: entries.find(([uid]) => uid === me) ?? [me, 0],
      opponentLife: entries.find(([uid]) => uid !== me) ?? [null, 0],
    };
  }, [lifes, me]);

  // button colours
  const colours = ["yellow", "blue", "red", "green", "purple", "cyan"];

  useEffect(() => {
    let socket;

    const handleMessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type !== "game") return;

      const { message, extra } = data;

      switch (message) {
        case "start":
          setLifes(extra.lifes);
          setAnswered(false);
          setQuestion(null);
          toast.success("Match Start - get ready!");
          setData(data);
          break;

        case "question":
          setQuestion(extra);
          setAnswered(false);
          setQuestionTimeout(extra.question_timeout);
          break;

        case "reveal": {
          setLifes(extra.lifes);
          // to hide the timer
          setAnswered(true);
          const ok = extra.answers[me] === extra.correct;
          if (ok) {
            toast.success("Correct 🎉");
          } else {
            toast.error("Wrong ❌");
          }
          break;
        }

        case "end": {
          const { winner, reason } = extra;

          if (reason === "tie in life") {
            toast("Game Tied - No Winners 🤝");
          } else if (winner) {
            toast[winner === me ? "success" : "error"](
              winner === me ? "You Win! 🏆" : "You Lost 😢"
            );
          }

          setTimeout(() => nav("/game", { replace: true }), 1500);
          break;
        }

        default:
          console.log("WS →", data);
      }
    };

    (async () => {
      try {
        socket = await getMatchSocket();

        if (!socket) {
          toast.error("Game lost socket, redirecting back to game");
          nav("/game", { replace: true });
          return;
        }

        wsRef.current = socket;
        socket.addEventListener("message", handleMessage);
      } catch (err) {
        console.error(err);
        toast.error("Could not open game socket");
        nav("/game", { replace: true });
      }
    })();

    // cleanup when component unmounts
    return () => {
      if (socket) socket.removeEventListener("message", handleMessage);
    };
  }, [me, auth, nav]);

  function sendAnswer(idx) {
    if (answered || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "answer", choice: idx }));
    setAnswered(true);
  }

  if (!question) {
    return (
      <VSScreen payload={data} myUid={auth.currentUser.uid} />
    );
  }

  return (
    <div className="p-6 text-center">
      {/* name + lifes display */}
      <div className="flex items-center text-xl mb-8">
        <div className="flex-1 text-left">
          <LifeCard entry={myLife} size="lg" />
        </div>

        <div className="flex-none">
          {!answered && (
            <CountdownTimer seconds={questionTimeout} key={question.index} />
          )}
        </div>

        <div className="flex-1 text-right">
          <LifeCard entry={opponentLife} size="lg" />
        </div>
      </div>

      {/* question */}
      <h2 className="font-bubble text-2xl mb-6">{question.question}</h2>

      {/* choices */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => sendAnswer(i)}
            disabled={answered}
            className={`font-comic text-gray-700 pixel-choice-button p-5 bg-${colours[i % colours.length]}-500 hover:bg-${colours[i % colours.length]}-400 disabled:opacity-50`}
          >
            {c}
          </button>
        ))}
      </div>

      {answered && (
        <p className="font-comic mt-6 italic text-gray-500">Waiting for opponent…</p>
      )}
    </div>
  );
}