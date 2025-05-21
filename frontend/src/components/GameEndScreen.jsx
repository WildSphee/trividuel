import { useNavigate } from "react-router-dom";
import UserCard from "@/components/UserCard";
import { CheckCircle, XCircle } from "lucide-react";
import SlidingBackground from "@/components/backgrounds/SlidingBackground";
import EloDelta from "@/components/EloDelta";

export default function GameEndScreen({
  playerData,
  myUid,
  questions,
  isWinner,
  eloDelta,
  reason,
}) {
  if (!playerData?.extra?.players || !playerData?.extra?.lifes) return null;

  /* ——— basic data mapping ——— */
  const { players, lifes } = playerData.extra;
  const uids = Object.keys(lifes);
  const paired = players.map((p, i) => ({ ...p, uid: uids[i] }));
  const me = paired.find((p) => p.uid === myUid) ?? paired[0];
  const myDelta = isWinner ? eloDelta[0] : -Math.abs(eloDelta[1]);
  const nav = useNavigate();
  const qText = (o) => o.question ?? o["question:"] ?? "—";

  return (
    <>
      <SlidingBackground />

      <div className="relative z-10 min-h-screen flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
        {/* ——— left panel ——— */}
        <div className="sm:w-1/3 w-full">
          <div className="pixel-panel p-4 h-full flex flex-col gap-4">
            <h1 className="font-block text-3xl text-center">
              {isWinner ? "🏆 You Win!" : "Game Over"}
            </h1>

            {reason && (
              <p className="font-comic text-center text-lg">{reason}</p>
            )}

            {/* card + elo – row on mobile, column on desktop  */}
            <div className="flex flex-row sm:flex-col items-center gap-8">
              <UserCard
                name={me.name}
                elo={me.elo}
                type={me.type}
                total_won={me.total_won}
                country={me.country}
                size="md"
                className="w-full max-w-full"
                showChangeTypeButton={false}
              />

              <EloDelta delta={myDelta} />
            </div>
          </div>
        </div>

        {/* ——— question recap + back btn ——— */}
        <div className="sm:w-2/3 w-full flex flex-col">
          <div className="pixel-panel flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q) => {
              const ok = q.player_correct?.[me.uid] ?? false;
              return (
                <div
                  key={q.index}
                  className={`rounded-sm p-3 border-2 ${
                    ok
                      ? "border-green-600 bg-green-50"
                      : "border-red-600 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {ok ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                    <p className="font-comic break-words">{qText(q)}</p>
                  </div>

                  <p className="mt-2 text-sm break-words">
                    <span className="font-comic font-bold">Correct Ans: </span>
                    {q.correct_ans}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => nav("/game")}
            className="mt-4 pixel-start-button font-block px-6 py-3
                       bg-green-600 text-white text-2xl shadow hover:bg-green-700"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </>
  );
}
