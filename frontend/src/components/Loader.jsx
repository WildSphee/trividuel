export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Pixelated spinning loader */}
      <div className="relative w-20 h-20 bg-blue-500 border-[0.5rem] border-black box-shadow-pixelated animate-spin pixel-loader"></div>

      {/* Pixelated loading text */}
      <p className="font-block mt-4 text-black text-[2rem] font-bold box-shadow-pixelated-blocky px-4 py-2">
        LOADING...
      </p>
    </div>
  );
}
