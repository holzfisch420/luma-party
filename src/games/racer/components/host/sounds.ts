/** Geräusche für „Kurvenrausch“ (echte Aufnahmen, CC0). */
import { playSfx, preloadSfx } from '../../../../app/audio/sfx';

preloadSfx(['count-tick', 'count-go', 'checkpoint', 'lap', 'crash', 'slide-down', 'cheer', 'win']);

export const raceSounds = {
  beep: (go = false) => playSfx(go ? 'count-go' : 'count-tick', { vol: 0.8 }),
  checkpoint: () => playSfx('checkpoint', { vol: 0.4 }),
  lap: () => playSfx('lap', { vol: 0.6 }),
  bump: () => playSfx('crash', { vol: 0.35, vary: 0.1 }),
  fall: () => playSfx('slide-down', { vol: 0.6 }),
  finish: () => {
    playSfx('win', { vol: 0.8 });
    playSfx('cheer', { vol: 0.5, delay: 0.2 });
  },
};
