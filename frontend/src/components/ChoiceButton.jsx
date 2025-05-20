export default function ChoiceButton({
  text,
  onClick,
  disabled,
  color,
  hoverColor,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-comic text-gray-700 pixel-choice-button w-full bg-${color}-500 hover:bg-${hoverColor}-400 disabled:opacity-50 transition-all z-40`}
      style={{
        padding: "clamp(0.5rem, 4vh, 2rem) 0",
        fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
      }}
    >
      {text}
    </button>
  );
}
