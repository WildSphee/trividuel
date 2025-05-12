import UserCard from "@/components/UserCard";

/**
 * <VSScreen /> – full‑screen “versus” splash used right after the
 *   websocket sends { type: "game", message: "start", ... }.
 *
 * Props
 * ────────────────────────────────────────────────────────────
 * • payload  – the raw JSON object you receive from the socket.
 *              Must contain `extra.players`   (array of 2) and
 *              `extra.lifes`   (object keyed by uid → life).
 * • myUid    – Firebase UID of the local player.
 * • size     – optional UserCard size   ("sm" | "md" | "lg"),
 *              defaults to "lg".
 * • className – extra Tailwind classes to append to the wrapper.
 *
 * We assume the order of `extra.players` corresponds to the order
 * of keys in `extra.lifes`; we zip them together to associate a
 * UID with each player object. If that assumption ever breaks,
 * pass a stable mapping instead and tweak the pairing logic.
 */
export default function VSScreen({ payload, myUid, size = "lg", className = "" }) {
  if (!payload?.extra?.players || !payload?.extra?.lifes) {
    return null;
  }

  const { players, lifes } = payload.extra;

  // Pair each player object with its uid (assumes order matches)
  const uids = Object.keys(lifes);
  const paired = players.map((p, i) => ({ ...p, uid: uids[i] }));

  const me = paired.find((p) => p.uid === myUid) ?? paired[0];
  const opponent = paired.find((p) => p.uid !== myUid) ?? paired[1] ?? null;

  return (
    <div
      className={`flex items-center justify-center h-screen gap-10 bg-gradient-to-br from-white to-slate-50 ${className}`}
    >
      <UserCard
        name={me.name}
        elo={me.elo}
        type={me.type}
        total_won={me.total_won}
        size={size}
        showChangeTypeButton={false}
      />

      <div className="font-block text-5xl font-extrabold tracking-wider select-none">VS</div>

      {opponent && (
        <UserCard
          name={opponent.name}
          elo={opponent.elo}
          type={opponent.type}
          total_won={opponent.total_won}
          size={size}
          showChangeTypeButton={false}
          flipAvatar={true}
        />
      )}
    </div>
  );
}
