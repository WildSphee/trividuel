import React, { useRef } from "react";

/**
 * PixelSkyBackground ─ single‑render, GPU‑only animation.
 *
 * Props
 *  -------
 *  items         Array<{ src: string; count?: number }>
 *  minDuration   Seconds (shorter ⇒ faster)
 *  maxDuration   Seconds (longer  ⇒ slower)
 *  monochrome    true ⇒ grayscale
 *  opacity       0‑1 transparency so layers can overlap
 *  scaleRange    [min, max] – scale multipliers
 *  seed          Any value ⇒ changing it forces a full re‑randomise
 *
 * Why **useRef** instead of **useMemo**?
 * -------------------------------------
 * Parent re‑renders used to create a new `items` array on every click, making
 * `useMemo` recompute.  By storing the generated layers in a ref, we guarantee
 * that sprites are only generated **once per mount**.  Pass a new `seed` prop
 * if you ever need to intentionally reshuffle the sky.
 */
const PixelSkyBackground = ({
  items = [],
  minDuration = 30,
  maxDuration = 60,
  monochrome = false,
  opacity = 0.5,
  scaleRange = [0.05, 0.25],
  seed = 0,
}) => {
  const generated = useRef({ seed: null, layers: null, keyframesCSS: "" });

  const rng = (min, max) => Math.random() * (max - min) + min;

  // (re)generate only when `seed` changes
  if (generated.current.seed !== seed) {
    let index = 0;
    const frames = [];

    const imgs = items.flatMap((item) =>
      Array.from({ length: item.count || 1 }).map(() => {
        const id = index++;
        const duration = rng(minDuration, maxDuration);
        const delay = -rng(0, duration); // negative → sprite starts mid‑flight
        const top = rng(10, 90);
        const scale = rng(scaleRange[0], scaleRange[1]);

        // Direction & sprite orientation
        const goRight = Math.random() > 0.5;
        const flip = goRight ? "" : " scaleX(-1)";
        const baseTransform = `translateY(-50%)${flip} scale(${scale})`;
        const fromX = goRight ? "-120vw" : "120vw";
        const toX = goRight ? "120vw" : "-120vw";

        frames.push(
          `@keyframes flyAcross-${id} {\n` +
          `  0%   { transform: translateX(${fromX}) ${baseTransform}; }\n` +
          `  100% { transform: translateX(${toX})   ${baseTransform}; }\n` +
          `}`
        );

        return (
          <img
            key={`bg-${id}`}
            src={item.src}
            alt=""
            draggable={false}
            className="pointer-events-none select-none"
            style={{
              position: "absolute",
              top: `${top}%`,
              left: "50%", // X handled by translateX()
              animation: `flyAcross-${id} ${duration}s linear ${delay}s infinite`,
              imageRendering: "pixelated",
              filter: monochrome ? "grayscale(100%)" : "none",
              opacity,
            }}
          />
        );
      })
    );

    generated.current = {
      seed,
      layers: imgs,
      keyframesCSS: frames.join("\n"),
    };
  }

  if (!items.length) return null;

  const { layers, keyframesCSS } = generated.current;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <style>{keyframesCSS}</style>
      {layers}
    </div>
  );
};

export default PixelSkyBackground;
