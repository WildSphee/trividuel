import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  // restore user-saved volume or fall back to 50 %
  const [volume, setVolume] = useState(() => {
    const v = localStorage.getItem('bgm-volume');
    return v !== null ? Number(v) : 0.5;
  });

  const bgmRef = useRef(null);

  useEffect(() => {
    bgmRef.current = new Howl({
      src: ['/public/audio/bgm'],
      loop: true,
      volume,
      html5: true          // stream long tracks, keeps bundle light
    });

    // try to autoplay after the *first* user gesture (Chrome / Safari rule)
    const tryPlay = () => {
      const sound = bgmRef.current;
      if (!sound) return;

      const id = sound.play();
      sound.once('playerror', () => {
        sound.once('unlock', () => sound.play(id));
      });

      window.removeEventListener('pointerdown', tryPlay);
    };

    window.addEventListener('pointerdown', tryPlay, { once: true });

    return () => bgmRef.current?.unload();
  }, []);

  // keep Howler + localStorage in sync when the user moves the slider
  useEffect(() => {
    bgmRef.current?.volume(volume);
    localStorage.setItem('bgm-volume', String(volume));
  }, [volume]);

  return (
    <AudioContext.Provider value={{ volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
