import { useState, useEffect, Children } from "react";
import { getMe } from "@/api/player";
import UserCard from "@/components/UserCard";
import useMatchmaking from "@/hooks/useMatchmaking";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import StartButton from "@/components/StartButton";
import PixelSkyBackground from "@/components/PixelSkyBackground";


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
    <>
      <PixelSkyBackground
        items={[
          { src: "/pixelskybackground/cloud1.png", count: 2 },
          { src: "/pixelskybackground/cloud2.png", count: 2 },
          { src: "/pixelskybackground/cloud3.png", count: 2 },
          { src: "/pixelskybackground/hot_air_balloon.png", count: 1 },
          { src: "/pixelskybackground/birds.png", count: 1 }
        ]}
        minDuration={95}
        maxDuration={140}
        opacity={0.4}
        scaleRange={[0.3, 0.5]}
        seed={me.uid}
      />
      <div className="p-8 flex flex-col items-center gap-12">
        <h1 className="font-block text-5xl font-semibold mb-5"> Game Lobby</h1>

        <UserCard
          name={me.display_name}
          elo={me.elo}
          type={me.type}
          total_won={me.total_won}
          showChangeTypeButton={true}
          onTypeChanged={fetchMe}
        />

        {status === "idle" && (
          <StartButton
            onClick={queue}
            children={"Find Opponent"}
          />
        )}

        {status === "queueing" && (
          <p className="font-comic italic text-xl text-gray-500">Searching for opponent…</p>
        )}

        {status === "playing" && (
          <p className="font-comic text-xl text-gray-500">Match found — brain it on!</p>
        )}
      </div>
    </>
  );
}
