import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

let bgm;  // module-level singleton
const sfxCache = {};  // Map<key, Howl>

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [volume, setVolume] = useState(() => {
        const v = localStorage.getItem('bgm-volume');
        return v !== null ? Number(v) : 0;
    });

    const mounted = useRef(false);

    useEffect(() => {
        if (!bgm) {
            bgm = new Howl({
                src: ['/audio/bgm.mp3'],
                loop: true,
                volume: 0,  // always start muted
                html5: true,
            });
        }

        // first user gesture unlock 
        const tryPlay = () => {
            if (!bgm || bgm.playing() || volume === 0) return; // don’t start if muted
            const id = bgm.play();

            bgm.once('playerror', () => {
                bgm.once('unlock', () => bgm.play(id));
            });
            window.removeEventListener('pointerdown', tryPlay);
        };

        window.addEventListener('pointerdown', tryPlay, { once: true });
        mounted.current = true;
        return () => window.removeEventListener('pointerdown', tryPlay);
    }, []);

    useEffect(() => {
        if (!bgm || !mounted.current) return;

        if (volume === 0) {
            bgm.pause();
            if ('mediaSession' in navigator)
                navigator.mediaSession.playbackState = 'none';
        } else {
            bgm.volume(volume);
            if (!bgm.playing()) bgm.play();
            if ('mediaSession' in navigator)
                navigator.mediaSession.playbackState = 'playing';
        }
        localStorage.setItem('bgm-volume', String(volume));
    }, [volume]);

    /* helper for short sound-effects ************************************ */
    const playSfx = (key, { volume: vol = 1 } = {}) => {
        if (!key) return;
        if (volume === 0) return;
        if (!sfxCache[key]) {
            sfxCache[key] = new Howl({
                src: [`/audio/${key}.mp3`],
                html5: false,
                volume: vol,
            });
        }
        sfxCache[key].play();
    };

    return (
        <AudioContext.Provider value={{ volume, setVolume, playSfx }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const ctx = useContext(AudioContext);
    if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
    return ctx;
}
