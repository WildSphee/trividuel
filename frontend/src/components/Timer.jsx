import { useEffect, useState } from "react";

export default function CountdownTimer({ seconds }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  // reset whenever the question (and its timeout) changes
  useEffect(() => setTimeLeft(seconds), [seconds]);

  // tick down
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const danger = timeLeft <= 3;

  return (
    <div
      className={`relative flex items-center justify-center w-12 h-12 ${
        danger ? "text-red-600" : "text-black"
      }`}
    >
      {/* spinning ring */}
      <div className="absolute inset-0 rounded-full border-4 border-current border-t-transparent animate-spin" />
      {/* number */}
      <span className="font-slab text-lg">{timeLeft}</span>
    </div>
  );
}
