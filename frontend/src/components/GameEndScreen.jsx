import { useNavigate } from "react-router-dom";
import UserCard from "@/components/UserCard";
import { CheckCircle, XCircle } from "lucide-react";
import SlidingBackground from "@/components/backgrounds/SlidingBackground";

export default function GameEndScreen({
  playerData,
  myUid,
  questions,
  isWinner,
}) {
  if (!playerData?.extra?.players || !playerData?.extra?.lifes) return null;

  const { players, lifes } = playerData.extra;
  const uids = Object.keys(lifes);
  const paired = players.map((p, i) => ({ ...p, uid: uids[i] }));

  const me = paired.find((p) => p.uid === myUid) ?? paired[0];
  //   const opponent = paired.find(p => p.uid !== myUid) ?? paired[1] ?? null;

  const nav = useNavigate();

  const qText = (obj) => obj.question ?? obj["question:"] ?? "—";

  return (
    <>
      <SlidingBackground />
      <div
        className="relative z-10 min-h-screen flex flex-col sm:flex-row gap-4
                p-4 sm:p-6"
      >
        {/* ── user panel ─────────────────────────────────────────── */}
        <div className="sm:w-1/3 w-full">
          <div className="pixel-panel p-4 h-full">
            <h1 className="font-block text-2xl mb-3 text-center">
              {isWinner ? "🏆 You Win!" : "Game Over"}
            </h1>

            <UserCard
              name={me.name}
              elo={me.elo}
              type={me.type}
              total_won={me.total_won}
              country={me.country}
              size="md"
              showChangeTypeButton={false}
            />
          </div>
        </div>

        {/* ── question recap ─────────────────────────────────────── */}
        <div className="sm:w-2/3 w-full flex flex-col">
          <div className="pixel-panel flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q) => {
              const wasRight = q.player_correct?.[me.uid] ?? false;
              return (
                <div
                  key={q.index}
                  className={`rounded-sm p-3 border-2 ${
                    wasRight
                      ? "border-green-600 bg-green-50"
                      : "border-red-600 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {wasRight ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                    <p className="font-comic">{qText(q)}</p>
                  </div>

                  <p className="mt-2 text-sm">
                    <span className="font-comic bold">Correct Ans: </span>
                    {q.correct_ans}
                  </p>
                </div>
              );
            })}
          </div>

          {/* back button */}
          <button
            onClick={() => nav("/game")}
            className="mt-4 pixel-start-button font-block px-6 py-3 bg-green-600 text-white text-2xl shadow hover:bg-green-700"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </>
  );
}
