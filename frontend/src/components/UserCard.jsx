import React, { useState, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { changeType } from "../api/player";

/**
 * UserCard component
 * Shows avatar, player name, type, total wins and ELO rating.
 * NEW: `country` prop renders a responsive flag icon (including special "DEV" flag).
 * Size prop (sm | md | lg) scales the whole card.
 * Optional recycle icon button (showChangeTypeButton) triggers type change.
 * Icon spins CCW for 0.6s on click and button is disabled for 1s to prevent spam.
 */
export default function UserCard({
  name,
  elo,
  type,
  total_won,
  country = "",
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
      card: "w-55 p-5",
      img: "h-26 w-26",
      name: "text-lg",
      type: "text-lg",
      meta: "text-base",
      icon: "h-4 w-4",
      flag: "h-3 w-6",
    },
    md: {
      card: "w-60 p-6",
      img: "h-30 w-30",
      name: "text-2xl",
      type: "text-lg",
      meta: "text-base",
      icon: "h-4.5 w-4.5",
      flag: "h-4 w-7",
    },
    lg: {
      card: "w-68 p-7",
      img: "h-33 w-33",
      name: "text-3xl",
      type: "text-xl",
      meta: "text-lg",
      icon: "h-5 w-5",
      flag: "h-5 w-8",
    },
  }[size];

  const flagUrl = useMemo(() => {
    if (!country) return null;
    if (country.toUpperCase() === "DEV") {
      return "/devflag.svg";
    }
    return `https://flagcdn.com/${country.toLowerCase()}.svg`;
  }, [country]);

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
      className={`flex flex-col z-10 items-center usercard ${sizeClasses.card}`}
    >

      {/* Player Pic */}
      <img
        src={`/${type}.png`}
        alt="avatar"
        className={`${sizeClasses.img} grid mb-4 object-cover ${flipAvatar ? "transform -scale-x-100" : ""
          }`}
      />

      <div className="flex items-center gap-1">
        {/* Player name */}
        <p className={`font-bubble usercard-name mb-1 ${sizeClasses.name}`}>{name}</p>
      </div>

      {/* Player type with change button */}
      <div className="flex items-center gap-0.5">
        <p className={`font-comic capitalize text-gray-700 ${sizeClasses.type}`}>{type}</p>
        {showChangeTypeButton && (
          <button
            aria-label="Change type"
            onClick={handleClick}
            disabled={loading}
            className="usercard-button"
          >
            <RotateCcw
              className={`${sizeClasses.icon} ${spinning ? "animate-spin [animation-direction:reverse]" : ""
                }`}
            />
          </button>
        )}
      </div>

      {/* Wins & ELO in one row */}
      <div className="flex items-center gap-4 mt-1">
        <span className={`font-medium ${sizeClasses.meta}`}>🏆 {total_won}</span>
        <span className={`font-comic text-gray-600 ${sizeClasses.meta}`}>ELO {elo}</span>
      
        {/* country flag */}
        {flagUrl && (
          <img
            src={flagUrl}
            alt={`${country} flag`}
            className={`${sizeClasses.flag} object-cover select-none flag`}
          />
        )}
      </div>
    </div>
  );
}
