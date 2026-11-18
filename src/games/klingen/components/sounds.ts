/** Geräusche für „Klingenrad“ (echte Aufnahmen, CC0). */
import { getAudioSettings, setAudioSettings } from '../../../app/audio/engine';
import { playOneOf, playSfx, preloadSfx } from '../../../app/audio/sfx';

preloadSfx(['swish', 'thunk-1', 'thunk-2', 'thunk-3', 'clang', 'glass-break', 'level-up', 'count-tick', 'count-go', 'points', 'dun', 'fanfare', 'explosion', 'bonk', 'splash', 'boing', 'suspense']);

export const klingenSounds = {
  throw: () => playSfx('swish', { vol: 0.45, vary: 0.12 }),
  /** Messer steckt im Holz */
  stick: () => playOneOf(['thunk-1', 'thunk-2', 'thunk-3'], { vol: 0.9, vary: 0.06 }),
  /** Messer auf Messer */
  clang: () => playSfx('clang', { vol: 0.9 }),
  /** Stufe geschafft: Rad zerbricht */
  clear: () => {
    playSfx('glass-break', { vol: 0.5, rate: 0.8 });
    playSfx('level-up', { vol: 0.7, delay: 0.15 });
  },
  /** Bonus-Stern eingesammelt */
  star: () => playSfx('points', { vol: 0.8, vary: 0.05 }),
  /** Boss erscheint */
  bossIntro: () => {
    playSfx('dun', { vol: 0.8 });
    playSfx('suspense', { vol: 0.5, delay: 0.6 });
  },
  /** Boss besiegt */
  bossDown: () => {
    playSfx('explosion', { vol: 0.6 });
    playSfx('fanfare', { vol: 0.7, delay: 0.25 });
  },
  /** abgeprallt an Mond / Fangarm / Schild */
  blocked: (kind: string) =>
    kind === 'tentacle' ? playSfx('splash', { vol: 0.7 }) : kind === 'moon' ? playSfx('bonk', { vol: 0.8 }) : playSfx('clang', { vol: 0.8, rate: 0.8 }),
  /** Bombe geht hoch */
  bomb: () => playSfx('explosion', { vol: 0.9 }),
  beep: (high = false) => playSfx(high ? 'count-go' : 'count-tick', { vol: 0.7 }),
  isMuted: () => getAudioSettings().muted,
  setMuted: (m: boolean) => setAudioSettings({ muted: m }),
};
