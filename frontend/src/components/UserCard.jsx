import React from "react";

/**
 * UserCard
 *
 * Props:
 * ─ name       (string)  – username to display (required)
 * ─ elo        (number)  – ELO rating (required)
 * ─ avatar     (string)  – optional URL for the user’s avatar
 * ─ size       ("sm" | "md" | "lg") – how big the card should be (default: "lg")
 *
 * If no `avatar` prop is provided the component falls back to the local
 *   businessman.png that lives next to the compiled assets.
 */
export default function UserCard({
  name,
  elo,
  avatar = "businessman.png",
  size = "lg",
}) {
  // Map each size to a set of Tailwind classes
  const sizeClasses = {
    sm: {
      card: "w-48 p-4",
      img: "h-16 w-16",
      name: "text-base",
      elo: "text-sm",
    },
    md: {
      card: "w-56 p-5",
      img: "h-20 w-20",
      name: "text-lg",
      elo: "text-sm",
    },
    lg: {
      card: "w-64 p-6",
      img: "h-24 w-24",
      name: "text-xl",
      elo: "text-base",
    },
  }[size];

  return (
    <div
      className={`flex flex-col items-center rounded-2xl shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 ${sizeClasses.card}`}
    >
      <img
        src={avatar}
        alt="avatar"
        className={`${sizeClasses.img} rounded-full mb-4 object-cover`}
      />
      <p className={`font-semibold ${sizeClasses.name}`}>{name}</p>
      <p className={`text-gray-600 ${sizeClasses.elo}`}>ELO {elo}</p>
    </div>
  );
}
