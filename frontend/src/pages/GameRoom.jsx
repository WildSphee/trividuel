import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";
import { getMatchSocket } from "@/api/ws";
import VSScreen from "@/components/VSScreen";
import ChoiceButton from "@/components/ChoiceButton";
import GameTopBar from "@/components/GameTopBar";
import FlashPulse from "@/components/FlashPulse";
import GameEndScreen from "@/components/GameEndScreen";
import GridBackground from "@/components/backgrounds/GridBackground";

export default function GameRoom() {
  const navigate = useNavigate();
  const auth = getAuth();
  const me = auth.currentUser?.uid;

  const wsRef = useRef(null);
  const [question, setQuestion] = useState(null);
  const [lifes, setLifes] = useState({});
  const [data, setData] = useState({});

  const [answered, setAnswered] = useState(false);
  const [questionTimeout, setQuestionTimeout] = useState(0);
  const [flash, setFlash] = useState(null);
  const [endPayload, setEndPayload] = useState(null);

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
          setFlash({
            color: ok ? "green" : "red",
            intensity: 0.3,      // 0-1
            innerGap: 0.3,    // 0 = no gap
            coverage: 1,      // still usable
            duration: 700,
          });
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

          setEndPayload(extra);
          break;
        }

        case "zombie": break;

        default:
          console.log("Unexpected message →", data);
      }
    };

    (async () => {
      try {
        socket = await getMatchSocket();

        if (!socket) {
          toast.error("Game lost socket, redirecting back to game");
          navigate("/game", { replace: true });
          return;
        }

        wsRef.current = socket;
        socket.addEventListener("message", handleMessage);
      } catch (err) {
        console.error(err);
        toast.error("Connection to Server Interrupted");
        navigate("/game", { replace: true });
      }
    })();

    // cleanup when component unmounts
    return () => {
      if (socket) socket.removeEventListener("message", handleMessage);
    };
  }, [me, auth, navigate]);

  function sendAnswer(idx) {
    if (answered || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "answer", choice: idx }));
    setAnswered(true);
  }


  // on game start
  if (!question) {
    return (
      <VSScreen payload={data} myUid={auth.currentUser?.uid} />
    );
  }
  // on game end
  if (endPayload) {
    return (
      <GameEndScreen
        playerData={data}
        myUid={me}
        questions={endPayload.questions}
        isWinner={endPayload.winner === me}
      />
    );
  }
  // during game
  return (
    <>
      <GridBackground />
      <div className="flex flex-col min-h-screen p-4 sm:p-6 text-center">
        {flash && (
          <FlashPulse
            {...flash}
            onDone={() => setFlash(null)}
          />
        )}
        {/* Names + lifes + timer */}
        <GameTopBar
          myLifeEntry={myLife}
          opponentLifeEntry={opponentLife}
          answered={answered}
          questionTimeout={questionTimeout}
          questionIndex={question.index}
        />

        {/* Question */}
        <h2 className=" font-bubble mb-4 sm:mb-10 text-[clamp(1.5rem,4.8vw,2rem)] leading-tight break-words line-clamp-4 animate-fade-pop-quick">
          {question.question}
        </h2>

        {/* Choice buttons */}
        <div className=" grid w-full gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto animate-fade-pop-quick">
          {question.choices.map((c, i) => (
            <ChoiceButton
              key={i}
              text={c}
              onClick={() => sendAnswer(i)}
              disabled={answered}
              color={colours[i % colours.length]}
              hoverColor={colours[i % colours.length]}
            />
          ))}
        </div>

        {/* waiting text */}
        {answered && (
          <p className="font-comic italic text-gray-500 text-base sm:text-lg mt-auto pt-6">
            Waiting for opponent…
          </p>
        )}
      </div>
    </>
  )
}