import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [volume, setVolume] = useState(() => {
        const v = localStorage.getItem('bgm-volume');
        // default volume is on mute :')
        return v !== null ? Number(v) : 0;
    });

    const bgmRef = useRef(null);

    useEffect(() => {
        bgmRef.current = new Howl({
            src: ['/audio/bgm.mp3'],
            loop: true,
            volume,
            html5: true
        });
        // only run once on first user guesture
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const s = bgmRef.current;
        if (!s) return;

        if (volume === 0) {
            // pause mobile audio notification
            s.pause();
            if ('mediaSession' in navigator)
                navigator.mediaSession.playbackState = 'none';
        } else {
            s.volume(volume);
            if (!s.playing()) s.play();
            if ('mediaSession' in navigator)
                navigator.mediaSession.playbackState = 'playing';
        }
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
