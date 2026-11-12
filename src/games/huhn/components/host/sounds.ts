/** Geräusche für „Hühnerjagd“ (echte Aufnahmen, CC0). Musik kommt über das Spielmodul. */
import { getAudioSettings, setAudioSettings } from '../../../../app/audio/engine';
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';

preloadSfx(['boing', 'bonk', 'slide-down', 'honk-toy', 'whistle', 'siren', 'count-tick', 'count-go', 'win']);

let lastSiren = 0;

export const huhnSounds = {
  /** Schwerkraft umdrehen */
  flip: (up: boolean) => playSfx('boing', { vol: 0.35, rate: up ? 1.25 : 0.95, vary: 0.05 }),
  /** zwei Hühner rempeln sich */
  bump: () => playSfx('bonk', { vol: 0.5, vary: 0.1 }),
  /** abgestürzt */
  fall: () => playSfx('slide-down', { vol: 0.7 }),
  /** geschnappt */
  caught: () => {
    playSfx('honk-toy', { vol: 0.8 });
    playSfx('whistle', { vol: 0.6, delay: 0.12 });
  },
  /** Blaulicht in der Nähe */
  siren: () => {
    const now = performance.now();
    if (now - lastSiren < 2200) return;
    lastSiren = now;
    playSfx('siren', { vol: 0.25 });
  },
  beep: (high = false) => playSfx(high ? 'count-go' : 'count-tick', { vol: 0.7 }),
  fanfare: () => playSfx('win', { vol: 0.8 }),
  /** Musik läuft jetzt über das Spielmodul (FreePD) */
  startMusic: (_speed?: number) => {},
  stopMusic: () => {},
  setMuted: (m: boolean) => setAudioSettings({ muted: m }),
  isMuted: () => getAudioSettings().muted,
};
