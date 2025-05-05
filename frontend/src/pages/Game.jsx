import { useQuery }     from "@tanstack/react-query";
import { getMe }        from "@/api/player";
import Loader           from "@/components/Loader";
import UserCard         from "@/components/UserCard";
import useMatchmaking   from "@/hooks/useMatchmaking";
import { useNavigate }  from "react-router-dom";

export default function Game() {
  const nav = useNavigate();

  // load player profile
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn : getMe,
  });

  // matchmaking 
  const { status, queue } = useMatchmaking(
    (payload) => {
      console.log("Match-found payload:", payload);
      const sid = payload.extra?.session_id;
      if (sid) nav(`/room/${sid}`, { replace: true });
    },
    () => nav("/game")          // back to lobby after winning
  );

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-semibold">Game Lobby</h1>

      <UserCard name={me.display_name} elo={me.elo} />

      {status === "idle" && (
        <button
          onClick={queue}
          className="px-6 py-3 rounded-xl bg-green-600 text-white shadow hover:bg-green-700"
        >
          Find opponent
        </button>
      )}

      {/* queuing → searching message */}
      {status === "queuing" && (
        <p className="italic text-gray-500">Searching for opponent…</p>
      )}

      {/* playing → quick placeholder until GameRoom mounts */}
      {status === "playing" && (
        <p className="text-xl font-medium">Match found — brain it on!</p>
      )}
    </div>
  );
}
