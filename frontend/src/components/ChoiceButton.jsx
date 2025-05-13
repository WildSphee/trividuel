export default function ChoiceButton({ text, onClick, disabled, color, hoverColor }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-comic text-gray-700 pixel-choice-button w-full bg-${color}-500 hover:bg-${hoverColor}-400 
        disabled:opacity-50 transition-all text-[1.25rem] py-[3rem]`}
    >
      {text}
    </button>
  );
}