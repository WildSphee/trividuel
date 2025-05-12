import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { changeType } from "../api/player"; // adjust the path if needed

/**
 * UserCard component
 * Shows avatar, player name, type, total wins and ELO rating.
 * Size prop (sm | md | lg) scales the card.
 * Optional recycle icon button (showChangeTypeButton) triggers type change.
 * Icon spins CCW for 0.6 s on click and button is disabled for 1 s to prevent spam.
 */
export default function UserCard({
  name,
  elo,
  type,
  total_won,
  size = "lg",
  showChangeTypeButton = false,
  onTypeChanged = () => { },
  flipAvatar = false,
}) {
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // Tailwind size map (icon slightly smaller)
  const sizeClasses = {
    sm: {
      card: "w-48 p-4",
      img: "h-16 w-16",
      name: "text-lg",
      meta: "text-xs",
      icon: "h-3 w-3",
    },
    md: {
      card: "w-56 p-5",
      img: "h-20 w-20",
      name: "text-xl",
      meta: "text-sm",
      icon: "h-3.5 w-3.5",
    },
    lg: {
      card: "w-64 p-6",
      img: "h-24 w-24",
      name: "text-2xl",
      meta: "text-base",
      icon: "h-4 w-4",
    },
  }[size];

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setSpinning(true);
    try {
      await changeType();
      onTypeChanged();
    } catch (err) {
      console.error(err);
    } finally {
      // stop spin after .6s
      setTimeout(() => setSpinning(false), 600);
      // unlock button after 1s
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <div
      className={`flex flex-col z-10 items-center rounded-2xl shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 ${sizeClasses.card}`}
    >
      <img
        src={`/${type}.png`}
        alt="avatar"
        className={`${sizeClasses.img} grid mb-4 object-cover ${flipAvatar ? "transform -scale-x-100" : ""
          }`}
      />
      {/* Player name */}
      <p className={`font-bubble ${sizeClasses.name}`}>{name}</p>

      {/* Player type with optional change button */}
      <div className="flex items-center gap-1">
        <p className={`font-comic capitalize text-gray-500 ${sizeClasses.meta}`}>{type}</p>
        {showChangeTypeButton && (
          <button
            aria-label="Change type"
            onClick={handleClick}
            disabled={loading}
            className="rounded-full p-1 transition hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw
              className={`${sizeClasses.icon} ${spinning ? "animate-spin [animation-direction:reverse]" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Wins & ELO in one row */}
      <div className="flex items-center gap-4 mt-1">
        <span className={`font-medium ${sizeClasses.meta}`}>🏆 {total_won}</span>
        <span className={`font-comic text-gray-600 ${sizeClasses.meta}`}>ELO {elo}</span>
      </div>
    </div>
  );
}
