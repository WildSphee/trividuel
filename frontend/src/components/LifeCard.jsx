import { Heart } from "lucide-react";

/**
 * LifeCard
 * ────────────────────────────────────────────────────────────
 * Displays a player's name and current hit-points as either
 * hearts or a smooth health bar, depending on `variant`.
 *
 * Props
 * • entry     – result of Object.entries(lifes)[i]
 *               expected shape:  [ uid, [ name, hp ] ]
 * • maxHp     – maximum life points (default 3)
 * • variant   – "hearts" | "bar"  (default "hearts")
 * • size      – "sm" | "md" | "lg" (affects width / icon size)
 */
export default function LifeCard({ entry, maxHp = 3, variant = "hearts", size = "md" }) {
  if (!entry) return null;
  const [uid, [name, hp]] = entry;

  /* size map */
  const sizes = {
    sm: { bar: "w-24 h-2", heart: "h-3 w-3 text-red-500" },
    md: { bar: "w-32 h-3", heart: "h-4 w-4 text-red-500" },
    lg: { bar: "w-40 h-4", heart: "h-5 w-5 text-red-500" },
  }[size];

  return (
    <div key={uid} className="inline-flex items-center gap-2 select-none">
      {/* name (truncate to 10 chars) */}
      <span className="font-medium max-w-[7rem] truncate">{name.slice(0, 10)}</span>

      {variant === "hearts" ? (
        /* heart icons variant */
        <div className="flex gap-0.5">
          {Array.from({ length: maxHp }).map((_, i) => (
            <Heart
              key={i}
              fill={i < hp ? "currentColor" : "none"}
              className={`${sizes.heart} ${i < hp ? "text-red-500" : "text-gray-300"}`}
              strokeWidth={1.5}
            />
          ))}
        </div>
      ) : (
        /* smooth bar variant */
        <div className={`relative rounded-full bg-gray-200 overflow-hidden ${sizes.bar}`}>
          <div
            className="absolute inset-0 bg-gradient-to-r from-red-500 to-green-500 transition-all"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}