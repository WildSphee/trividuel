import React, { useMemo } from "react";

/**
 * PixelSkyBackground
 *
 * Props:
 *  - items: Array<{ src: string; count?: number }>
 *      Example: [
 *        { src: "/images/cloud.png", count: 6 },
 *        { src: "/images/balloon.png", count: 3 },
 *        { src: "/images/bird.png", count: 10 }
 *      ]
 *  - minDuration (seconds)
 *  - maxDuration (seconds)
 *  - monochrome (boolean)
 *  - opacity (0‑1)
 *  - scaleRange: [minScale, maxScale]
 *
 * Each image instance is cloned `count` times and assigned its own random
 * starting delay, duration, vertical position, scale and direction. All
 * movement is handled with pure CSS key‑frame animations, so React only needs
 * to generate the markup once (no re‑renders or JS timers at runtime).
 */
const PixelSkyBackground = ({
  items = [],
  minDuration = 30,
  maxDuration = 60,
  monochrome = true,
  opacity = 0.5,
  scaleRange = [0.05, 0.25],
}) => {
  // Helper for random numbers
  const rng = (min, max) => Math.random() * (max - min) + min;

  const { layers, keyframesCSS } = useMemo(() => {
    let index = 0;
    const frames = [];

    const imgs = items.flatMap((item) =>
      Array.from({ length: item.count || 1 }).map(() => {
        const id = index++;
        const duration = rng(minDuration, maxDuration);
        const delay = rng(0, maxDuration);
        const top = rng(10, 90); // use the full height of the viewport
        const scale = rng(scaleRange[0], scaleRange[1]);

        // Randomised direction → also flip X so sprites face forward
        const goRight = Math.random() > 0.5;
        const flip = goRight ? "" : " scaleX(-1)";
        const baseTransform = `translateY(-50%)${flip} scale(${scale})`;
        const fromX = goRight ? "-120vw" : "120vw";
        const toX = goRight ? "120vw" : "-120vw";

        // Key‑frames embed scale + optional flip so size & orientation persist
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
              left: "50%", // centre the sprite, X handled via translateX()
              transform: `translateX(${fromX}) ${baseTransform}`,
              animation: `flyAcross-${id} ${duration}s linear ${delay}s infinite`,
              imageRendering: "pixelated",
              filter: monochrome ? "grayscale(100%)" : "none",
              opacity,
            }}
          />
        );
      })
    );

    return { layers: imgs, keyframesCSS: frames.join("\n") };
  }, [items, minDuration, maxDuration, monochrome, opacity, scaleRange]);

  if (!items.length) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Inject the per‑sprite key‑frames */}
      <style>{keyframesCSS}</style>
      {layers}
    </div>
  );
};

export default PixelSkyBackground;
