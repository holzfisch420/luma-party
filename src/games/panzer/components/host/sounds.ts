/** Geräusche für „Kettenchaos“ (echte Aufnahmen, CC0). */
import { getAudioSettings, setAudioSettings } from '../../../../app/audio/engine';
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';

preloadSfx(['shot', 'explosion', 'explosion-small', 'laser', 'powerup', 'horn', 'pop', 'count-tick', 'count-go']);

export const panzerSounds = {
  shot: () => playSfx('shot', { vol: 0.35, vary: 0.12 }),
  /** Explosion – s: Größe (0–1) */
  boom: (s = 1) => (s > 0.6 ? playSfx('explosion', { vol: 0.5 + s * 0.4, vary: 0.08 }) : playSfx('explosion-small', { vol: 0.5, vary: 0.1 })),
  laser: () => playSfx('laser', { vol: 0.5 }),
  pickup: () => playSfx('powerup', { vol: 0.6 }),
  honk: () => playSfx('horn', { vol: 0.5 }),
  pop: () => playSfx('pop', { vol: 0.6, vary: 0.1 }),
  beep: (high = false) => playSfx(high ? 'count-go' : 'count-tick', { vol: 0.7 }),
  setMuted(m: boolean) {
    setAudioSettings({ muted: m });
  },
  isMuted: () => getAudioSettings().muted,
};
