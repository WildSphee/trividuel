import { useRef } from "react";

const PixelSkyBackground = ({
  items = [],
  minDuration = 30,
  maxDuration = 60,
  monochrome = false,
  opacity = 0.8,
  scaleRange = [0.05, 0.25],
  seed = 0,
  bgClass = "bg-sky-200",
}) => {
  const generated = useRef({ seed: null, layers: null, keyframesCSS: "" });

  const rng = (min, max) => Math.random() * (max - min) + min;

  if (generated.current.seed !== seed) {
    let index = 0;
    const frames = [];

    const imgs = items.flatMap((item) =>
      Array.from({ length: item.count || 1 }).map(() => {
        const id = index++;
        const duration = rng(minDuration, maxDuration);
        const delay = -rng(0, duration); // negative → sprite starts mid-flight
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
    <div className={`fixed inset-0 -z-10 overflow-hidden ${bgClass}`}>
      {" "}
      {/* apply background class */}
      <style>{keyframesCSS}</style>
      {layers}
    </div>
  );
};

export default PixelSkyBackground;
