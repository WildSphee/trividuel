import { useEffect, useState } from "react";


function useCountUp(target, dur = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let id;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      setV(Math.round(p * target));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, dur]);
  return v;
}

export default function EloDelta({ delta }) {
  const n = useCountUp(Math.abs(delta));
  const sign = delta > 0 ? "+" : "-";
  return (
    <span
      className={`elo-text ${
        delta > 0 ? "elo-positive-text" : "elo-negative-text"
      }`}
    >
      {`${sign}${n}`}
    </span>
  );
}
