import { Heart } from "lucide-react";
import clsx from "clsx";

/**
 * LifeCard
 * ────────────────────────────────────────────────────────────
 * Displays a player's name plus hearts or a bar.
 *
 *  • entry      – [ uid, [ name, hp ] ]
 *  • maxHp      – default 3
 *  • variant    – "hearts" | "bar"   (default "hearts")
 *  • size       – "sm" | "md" | "lg" (default "md")
 */
export default function LifeCard({
  entry,
  maxHp = 3,
  variant = "hearts",
  size = "md",
}) {
  if (!entry) return null;
  const [uid, [name, hp]] = entry;

  /* sizing for bar & heart icons */
  const sizes = {
    sm: { bar: "w-32 h-3", heart: "h-5 w-5" },
    md: { bar: "w-40 h-4", heart: "h-6 w-6" },
    lg: { bar: "w-52 h-5", heart: "h-7 w-7" },
  }[size];

  return (
    <div
      key={uid}
      /* flex-wrap lets hearts ride to next line when cramped */
      className={clsx(
        "inline-flex flex-wrap items-center",
        "gap-x-1 gap-y-1 select-none"
      )}
      style={{ maxWidth: "100%" }} /* don’t overflow parent */
    >
      {/* player name – truncate but don’t hide hearts */}
      <span
        className={clsx(
          "font-bubble truncate",
          "text-lg sm:text-xl md:text-2xl leading-none",
          "max-w-[12ch]"           /* ≈ 12 characters */
        )}
        title={name}               /* full name on hover */
      >
        {name}
      </span>

      {variant === "hearts" ? (
        /* ♥ icons (pixel-style) */
        <div className="flex gap-0.5">
          {Array.from({ length: maxHp }).map((_, i) => (
            <Heart
              key={i}
              strokeWidth={1.5}
              /* use currentColor so we can flip filled vs empty */
              className={clsx(
                sizes.heart,
                "stroke-black drop-shadow-[2px_2px_0_rgba(0,0,0,1)]",
                i < hp ? "text-red-500 fill-current" : "text-gray-300"
              )}
              fill={i < hp ? "currentColor" : "none"}
            />
          ))}
        </div>
      ) : (
        /* smooth bar variant */
        <div
          className={clsx(
            "relative rounded-full bg-gray-200 overflow-hidden",
            sizes.bar
          )}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-red-500 to-green-500 transition-all"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
