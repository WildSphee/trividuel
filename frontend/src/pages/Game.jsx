import { useState, useEffect } from "react";
import { getMe } from "@/api/player";
import UserCard from "@/components/UserCard";
import useMatchmaking from "@/hooks/useMatchmaking";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";

export default function Game() {
  const nav = useNavigate();

  /** ─── player profile ─────────────────────────────── */
  const [me, setMe] = useState(null);

  const fetchMe = async () => {
    const data = await getMe();
    setMe(data);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const { status, queue } = useMatchmaking(
    (payload) => {
      const sid = payload.extra?.session_id;
      if (sid) nav(`/room/${sid}`, { replace: true });
    },
    () => nav("/game")
  );

  if (!me) {
    return <Loader />;
  }

  return (
    <div className="p-8 flex flex-col items-center gap-8">
      <h1 className="font-block text-4xl font-semibold">Game Lobby</h1>

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
          className="font-block px-6 py-3 rounded-xl bg-green-600 text-white shadow hover:bg-green-700"
        >
          Find opponent
        </button>
      )}

      {status === "queueing" && (
        <p className="font-comic italic text-gray-500">Searching for opponent…</p>
      )}

      {status === "playing" && (
        <p className="font-comic text-xl font-medium">Match found — brain it on!</p>
      )}
    </div>
  );
}
