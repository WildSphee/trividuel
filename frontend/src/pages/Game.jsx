import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/player";
import Loader from "../components/Loader";
import UserCard from "@/components/UserCard";
import useMatchmaking from "@/hooks/useMatchmaking";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const navigate = useNavigate();

  // Load player profile
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });

  // Hook that handles WebSocket + status
  const { status, queue } = useMatchmaking(
    (gameStart) => {
      console.log("Game started:", gameStart);
      // future: navigate to /battle/<session_id>
    },
    () => navigate("/game"),  // on match win → reload lobby
  );

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-semibold">Game Lobby</h1>

      <UserCard name={me.display_name} elo={me.elo} />

      {status === "idle" && (
        <button
          className="px-6 py-3 rounded-xl bg-green-600 text-white shadow hover:bg-green-700"
          onClick={queue}
        >
          Find opponent
        </button>
      )}

      {/* 5️⃣  Queuing */}
      {status === "queuing" && (
        <p className="italic text-gray-500">Searching for opponent…</p>
      )}

      {/* 6️⃣  In‑game (simple placeholder) */}
      {status === "in‑game" && (
        <p className="text-xl font-medium">Match in progress… good luck!</p>
      )}
    </div>
  );
}
