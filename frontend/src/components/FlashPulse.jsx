import { useEffect } from "react";

/**
 * FlashPulse
 * Props
 * • color      – "green" | "red" | any CSS rgb() you like
 * • intensity  – 0-1   → max-opacity on the outer edge
 * • innerGap   – 0-1   → width of the clear band at centre
 * • duration   – ms    → fade-out time
 * • coverage   – 0-1   → overlay width *relative to screen*
 * • onDone     – callback when fade finishes
 */
export default function FlashPulse({
  color,
  intensity = 0.6,
  innerGap = 0.4,
  duration = 400,
  coverage = 1,
  onDone,
}) {
  /* auto-dispose after fade */
  useEffect(() => {
    const id = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(id);
  }, [duration, onDone]);

  /* work out rgba() with variable alpha */
  const col = (a) =>
    color === "green"
      ? `rgba(0,255,0,${a})`
      : color === "red"
      ? `rgba(255,0,0,${a})`
      : color.includes("rgb")
      ? color.replace(/[\d.]+\)$/g, `${a})`) // crude replace last num
      : color; // fallback

  /* gradient directions *************************************************** */
  let bg;
  /* symmetrical – clear in the middle */
  const gapStart = (50 - innerGap * 50).toFixed(1);
  const gapEnd = (50 + innerGap * 50).toFixed(1);
  bg = `linear-gradient(to right,
            ${col(intensity)} 0%,
            ${col(0)} ${gapStart}%,
            ${col(0)} ${gapEnd}%,
            ${col(intensity)} 100%)`;

  /* overlay sizing ******************************************************** */
  const width = `${coverage * 100}vw`;

  return (
    <div
      className="pointer-events-none fixed top-0 bottom-0 z-0"
      style={{
        width,
        background: bg,
        animation: `flashFade ${duration}ms ease-out forwards`,
      }}
    />
  );
}
