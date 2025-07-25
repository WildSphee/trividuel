import "../styles/animation.css";

export default function StartButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="pixel-start-button font-block px-6 py-3 bg-green-600 text-white text-2xl shadow hover:bg-green-700"
    >
      {children}
    </button>
  );
}
