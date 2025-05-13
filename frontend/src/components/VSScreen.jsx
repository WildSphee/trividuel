import UserCard from "@/components/UserCard";

export default function VSScreen({ payload, myUid, size = "lg", className = "" }) {
  if (!payload?.extra?.players || !payload?.extra?.lifes) return null;

  const { players, lifes } = payload.extra;
  const uids = Object.keys(lifes);
  const paired = players.map((p, i) => ({ ...p, uid: uids[i] }));

  const me = paired.find(p => p.uid === myUid) ?? paired[0];
  const opponent = paired.find(p => p.uid !== myUid) ?? paired[1] ?? null;

  return (
    <div
      className={`
        relative h-screen overflow-hidden
        flex items-center justify-center gap-6 sm:gap-20
        flex-col-reverse sm:flex-row             /* 🔑  mobile = stacked (reversed) */
        ${className}
      `}
    >
      {/* SPINNING STRIPES */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="min-w-[200vw] min-h-[200vh] animate-spotlight-spin
                        bg-[repeating-conic-gradient(black_0deg,black_10deg,white_10deg,white_20deg)]
                        opacity-20 rounded-full mask-hole" />
      </div>

      {/* ME (left on desktop → bottom on mobile) */}
      <div className="animate-fade-pop-delay opacity-0 sm:scale-100 scale-90">
        <UserCard
          name={me.name}
          elo={me.elo}
          type={me.type}
          total_won={me.total_won}
          size={size === "lg" ? "md" : size}   /* lg → md on phones */
          showChangeTypeButton={false}
        />
      </div>

      {/* VS TEXT */}
      <div className="z-10 select-none font-block font-extrabold tracking-wider
                      text-4xl sm:text-5xl text-black">
        VS
      </div>

      {/* OPPONENT (right on desktop → top on mobile) */}
      {opponent && (
        <div className="animate-fade-pop-delay2 opacity-0 sm:scale-100 scale-90">
          <UserCard
            name={opponent.name}
            elo={opponent.elo}
            type={opponent.type}
            total_won={opponent.total_won}
            size={size === "lg" ? "md" : size}
            showChangeTypeButton={false}
            flipAvatar={true}
          />
        </div>
      )}
    </div>
  );
}
