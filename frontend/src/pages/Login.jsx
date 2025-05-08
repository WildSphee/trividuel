import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Login() {
  const { loginGoogle, loginGithub, user } = useAuth();
  const navigate = useNavigate();

  // When a user is already logged‑in (e.g. page refresh) → skip login screen
  useEffect(() => {
    console.log("currently login as:", user)
    if (user) {
      navigate("/game", { replace: true });
      return null;
    }
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <img
        src="/titlescreen.png"
        alt="TriviaDual Title"
        className="w-11/12 max-w-lg mb-8"
      />
      <div className="flex gap-4">
        <button
          className="px-6 py-3 rounded-md shadow-md bg-blue-600 text-white hover:bg-blue-700 transition"
          onClick={() =>
            loginGoogle().then(() => navigate("/game")).catch(console.error)
          }
        >
          Sign in with Google
        </button>

        <button
          className="px-6 py-3 rounded-md shadow-md bg-gray-800 text-white hover:bg-gray-900 transition"
          onClick={() =>
            loginGithub().then(() => navigate("/game")).catch(console.error)
          }
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
