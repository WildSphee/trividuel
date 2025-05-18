import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import VolumePanel from './VolumePanel';


export default function SoundControlButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <>
      <button className="sound-launch" onClick={() => setOpen((o) => !o)}>
        <Volume2
          className={`w-7 h-7 text-white`}
        />
      </button>

      {open && <VolumePanel />}
    </>
  );
}
