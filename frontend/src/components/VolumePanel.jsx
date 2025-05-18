import { useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';

export default function VolumePanel() {
  const { volume, setVolume } = useAudio();

  // Remember last non-zero level so we can restore it after un-muting
  const lastVolRef = useRef(volume || 0.2);

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(lastVolRef.current);
    } else {
      lastVolRef.current = volume;
      setVolume(0);
    }
  };

  const changeVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (v !== 0) lastVolRef.current = v;
  };

  return (
    <div
      className="sound-panel"
      onPointerDown={(e) => e.stopPropagation()}   // keep clicks inside from bubbling
    >
      <button className="mute-btn" onClick={toggleMute} aria-label="mute / un-mute">
        {volume === 0
          ? <VolumeX className="w-6 h-6 text-black" />
          : <Volume2 className="w-6 h-6 text-black" />}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={changeVolume}
        className="volume-slider"
        aria-label="volume"
      />
    </div>
  );
}
