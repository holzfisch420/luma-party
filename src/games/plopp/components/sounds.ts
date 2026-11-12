/** Geräusche für „Plopp!“ (echte Aufnahmen, CC0). */
import { getAudioSettings, setAudioSettings } from '../../../app/audio/engine';
import { playOneOf, playSfx, preloadSfx } from '../../../app/audio/sfx';

preloadSfx(['clock-tick', 'bubble-1', 'bubble-2', 'bubble-3', 'buzzer', 'question', 'cork', 'splash', 'steel-round']);

export const ploppSounds = {
  /** Ticken – schneller und höher, je praller der Fisch */
  tick: (tension: number) => playSfx('clock-tick', { vol: 0.25 + tension * 0.45, rate: 1 + tension * 0.35 }),
  /** Antwort gilt: Blubb */
  pass: () => playOneOf(['bubble-1', 'bubble-2', 'bubble-3'], { vol: 0.9, vary: 0.08 }),
  /** schon genannt / unbekannt */
  nope: () => playSfx('buzzer', { vol: 0.45 }),
  /** Abstimmung startet */
  vote: () => playSfx('question', { vol: 0.8 }),
  /** PLOPP! */
  pop: () => {
    playSfx('cork', { vol: 1, rate: 0.85 });
    playSfx('splash', { vol: 0.7, delay: 0.08 });
  },
  /** neue Runde */
  round: () => playSfx('steel-round', { vol: 0.7 }),
  isMuted: () => getAudioSettings().muted,
  setMuted: (m: boolean) => setAudioSettings({ muted: m }),
};
