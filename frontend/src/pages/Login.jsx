import {
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
  } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
const navigate = useNavigate();

const handleGoogleSignIn = async () => {
    try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    console.log("Google sign‑in success");
    navigate("/game");
    } catch (error) {
    console.error("Google sign‑in error", error);
    }
};

const handleGithubSignIn = async () => {
    try {
    await signInWithPopup(auth, new GithubAuthProvider());
    console.log("GitHub sign‑in success");
    navigate("/game");
    } catch (error) {
    console.error("GitHub sign‑in error", error);
    }
};

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
        onClick={handleGoogleSignIn}
        >
        Sign in with Google
        </button>
        <button
        className="px-6 py-3 rounded-md shadow-md bg-gray-800 text-white hover:bg-gray-900 transition"
        onClick={handleGithubSignIn}
        >
        Sign in with GitHub
        </button>
    </div>
    </div>
);
}
