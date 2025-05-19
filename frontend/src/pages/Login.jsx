import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PixelSkyBackground from "@/components/backgrounds/PixelSkyBackground";

export default function Login() {
  const { loginGoogle, loginGithub, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/game", { replace: true });
    }
  }, [user, navigate]);

  return (
    <>
      <PixelSkyBackground
        items={[
          { src: "/pixelskybackground/cloud1.png", count: 2 },
          { src: "/pixelskybackground/cloud2.png", count: 2 },
          { src: "/pixelskybackground/cloud3.png", count: 2 },
          { src: "/pixelskybackground/hot_air_balloon.png", count: 1 },
        ]}
        minDuration={95}
        maxDuration={140}
        opacity={0.4}
        scaleRange={[0.3, 0.5]}
        seed={12345}
      />
      <div className="z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <img src="/titlescreen.png" className="w-11/12 max-w-lg mb-8" />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center items-center mx-auto">
          <button
            className="pixel-start-button font-block w-full sm:w-auto px-6 py-3 rounded-md shadow-md bg-blue-600 text-white hover:bg-blue-700 transition"
            onClick={() =>
              loginGoogle().then(() => navigate("/game")).catch(console.error)
            }
          >
            Sign in with Google
          </button>

          <button
            className="pixel-start-button font-block w-full sm:w-auto px-6 py-3 rounded-md shadow-md bg-gray-800 text-white hover:bg-gray-900 transition"
            onClick={() =>
              loginGithub().then(() => navigate("/game")).catch(console.error)
            }
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    </>
  );
}