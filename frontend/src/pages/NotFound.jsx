import PixelSkyBackground from "@/components/backgrounds/PixelSkyBackground";

export default function NotFound() {
  return (
    <>
      <PixelSkyBackground
        items={[
          { src: "/pixelskybackground/cloud1.png", count: 2 },
          { src: "/pixelskybackground/cloud2.png", count: 2 },
          { src: "/pixelskybackground/cloud3.png", count: 2 },
          { src: "/pixelskybackground/hot_air_balloon.png", count: 1 },
        ]}
        minDuration={110}
        maxDuration={160}
        opacity={0.4}
        scaleRange={[0.3, 0.5]}
        seed={12345}
      />
      <div className="z-10 flex items-center justify-center min-h-screen px-4 sm:px-0">
        {/* Card */}
        <div className="bg-white usercard w-full max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 text-center rounded-lg shadow-md">
          <img
            src="notfound.png"
            alt="Not-found illustration"
            className="mx-auto mb-6 w-24 sm:w-32 md:w-36"
          />

          <h1 className="font-bubble text-2xl sm:text-3xl md:text-4xl font-bold mb-4"></h1>

          {/* Body text */}
          <p className="font-comic text-gray-600 mb-4 text-sm sm:text-base">
            Oops! The page you are looking for doesn't exist.
          </p>
          <p className="font-comic text-gray-600 mb-6 text-sm sm:text-base">
            If you think this is a mistake, feel free to contact our support
            team.
          </p>

          {/* Mail link */}
          <a
            href="mailto:sanguinaibot@gmail.com?subject=404%20Error"
            className="font-comic text-blue-600 hover:underline break-words"
          >
            sanguinaibot@gmail.com
          </a>
        </div>
      </div>{" "}
    </>
  );
}
