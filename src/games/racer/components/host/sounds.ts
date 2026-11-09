/** Kurze synthetische Rennsounds (Web Audio, keine Dateien). Bewusst sparsam – kein Dauer-Motorengeräusch. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  const unlock = () => audio();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.08, slideTo?: number, delay = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const last: Record<string, number> = {};
const throttle = (k: string, ms: number, fn: () => void) => {
  const n = performance.now();
  if ((last[k] ?? 0) + ms > n) return;
  last[k] = n;
  fn();
};

export const raceSounds = {
  beep: (go: boolean) => tone(go ? 880 : 440, go ? 0.5 : 0.18, 'square', 0.06),
  checkpoint: () => throttle('cp', 120, () => tone(1046, 0.12, 'triangle', 0.05)),
  lap: () => {
    tone(784, 0.12, 'triangle', 0.06);
    tone(1046, 0.18, 'triangle', 0.06, undefined, 0.1);
  },
  bump: () => throttle('bump', 150, () => tone(140, 0.12, 'sawtooth', 0.05, 70)),
  fall: () => tone(700, 0.8, 'sine', 0.06, 120),
  finish: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'square', 0.05, undefined, i * 0.1)),
};
