import { useState, useEffect } from "react";
import { getMe }   from "@/api/player";
import Loader      from "@/components/Loader";
import UserCard    from "@/components/UserCard";
import useMatchmaking from "@/hooks/useMatchmaking";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const nav = useNavigate();

  /** ─── player profile ─────────────────────────────── */
  const [me, setMe]       = useState(null);
  const [isLoading, setLoading] = useState(true);

  const fetchMe = async () => {
    setLoading(true);
    try {
      const data = await getMe();
      setMe(data);
    } finally {
      setLoading(false);
    }
  };

  /* load once on mount */
  useEffect(() => {
    fetchMe();
  }, []);

  /** ─── matchmaking (unchanged) ────────────────────── */
  const { status, queue } = useMatchmaking(
    (payload) => {
      const sid = payload.extra?.session_id;
      if (sid) nav(`/room/${sid}`, { replace: true });
    },
    () => nav("/game") // back to lobby after winning
  );

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-semibold">Game Lobby</h1>

      {/* pass fetchMe so UserCard can refresh profile after change */}
      <UserCard
        name={me.display_name}
        elo={me.elo}
        type={me.type}
        total_won={me.total_won}
        showChangeTypeButton={true}
        onTypeChanged={fetchMe}
      />

      {status === "idle" && (
        <button
          onClick={queue}
          className="px-6 py-3 rounded-xl bg-green-600 text-white shadow hover:bg-green-700"
        >
          Find opponent
        </button>
      )}

      {status === "queueing" && (
        <p className="italic text-gray-500">Searching for opponent…</p>
      )}

      {status === "playing" && (
        <p className="text-xl font-medium">Match found — brain it on!</p>
      )}
    </div>
  );
}
