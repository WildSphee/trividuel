import { useState, useEffect } from "react";
import { getMe } from "@/api/player";
import UserCard from "@/components/UserCard";
import useMatchmaking from "@/hooks/useMatchmaking";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import StartButton from "@/components/StartButton";
import PixelSkyBackground from "@/components/backgrounds/PixelSkyBackground";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import SoundControlButton from "@/components/SoundControlButton";
import DiscordButton from "@/components/DiscordButton";

export default function Game() {
  const nav = useNavigate();

  /* player profile */
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  /* always call your hooks in the same order */
  const { status, queue } = useMatchmaking((payload) => {
    const sid = payload.extra?.session_id;
    if (sid) nav(`/room/${sid}`, { replace: true });
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getMe();
        if (cancelled) return;

        if (!data) {
          // unauth -> go to login
          nav("/", { replace: true });
        } else {
          setMe(data); // logged in -> store profile
        }
      } catch {
        nav("/", { replace: true }); // network / 401
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  if (loading) return <Loader />;

  if (!me) return null;

  return (
    <>
      <PixelSkyBackground
        items={[
          { src: "/pixelskybackground/cloud1.webp", count: 2 },
          { src: "/pixelskybackground/cloud2.webp", count: 3 },
          { src: "/pixelskybackground/cloud3.webp", count: 3 },
          { src: "/pixelskybackground/hot_air_balloon.webp", count: 1 },
          { src: "/pixelskybackground/birds.webp", count: 1 },
        ]}
        minDuration={110}
        maxDuration={160}
        opacity={0.4}
        scaleRange={[0.3, 0.5]}
        seed={me.uid}
      />

      {/* ─── Leaderboard – fixed button (expands internally) ── */}
      <div className="flex flex-col fixed top-3 right-3 sm:top-5 sm:right-5 z-50"
      style= {{
        gap: "clamp(0.6rem,1.2vh,4rem)"
      }}>
        <LeaderboardPanel currentPlayer={me} />
        <SoundControlButton />
        <DiscordButton />
      </div>

      <div
        className="p-12 sm:p-12 flex flex-col items-center overflow-y-auto"
        style={{
          /* gap collapses from 3 rem → 1 rem between 1000 px and 350 px height */
          gap: "clamp(0rem,6vh,3rem)",
          /* below ~550 px height start shrinking everything proportionally */
          transformOrigin: "top center",
          transform: "scale(min(1, (100vh - 150px)/550))",
        }}
      >
        <h1 className="font-block text-5xl font-semibold mb-5">Game Lobby</h1>

        <UserCard
          name={me.display_name}
          elo={me.elo}
          type={me.type}
          country={me.country}
          total_won={me.total_won}
          showChangeTypeButton
          onTypeChanged={async () => setMe(await getMe())}
        />

        {status === "idle" && (
          <StartButton onClick={queue}>Find Opponent</StartButton>
        )}
        {status === "queueing" && (
          <p className="font-comic italic text-xl text-gray-500">
            Searching for opponent…
          </p>
        )}
        {status === "playing" && (
          <p className="font-comic text-xl text-gray-500">
            Match found — brain it on!
          </p>
        )}
      </div>
    </>
  );
}
