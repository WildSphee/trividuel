import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import VolumePanel from "./VolumePanel";
import { useAudio } from "@/audio/AudioProvider";

export default function SoundControlButton() {
  const [open, setOpen] = useState(false);
  const { volume } = useAudio();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <>
      <button className="sound-launch" onClick={() => setOpen((o) => !o)}>
        {volume === 0 ? (
          <VolumeX className="w-7 h-7 text-white" />
        ) : (
          <Volume2 className="w-7 h-7 text-white" />
        )}
      </button>

      {open && <VolumePanel />}
    </>
  );
}
