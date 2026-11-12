/** Synthetische Soundeffekte für „Klingenrad“. */
let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (muted) return null;
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

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol: number, cutoff: number, delay = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const klingenSounds = {
  throw: () => noise(0.08, 0.12, 4000),
  /** Messer steckt: dumpfes „Tock“ */
  stick: () => {
    tone(180, 0.09, 'triangle', 0.25, 90);
    noise(0.05, 0.25, 900);
  },
  /** Messer auf Messer: Klirren */
  clang: () => {
    tone(1800, 0.35, 'square', 0.06, 1200);
    tone(2600, 0.25, 'triangle', 0.05, 1900, 0.02);
    noise(0.15, 0.15, 6000);
  },
  /** Stufe geschafft */
  clear: () => {
    noise(0.4, 0.3, 1500);
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, undefined, 0.05 + i * 0.08));
  },
  beep: (high = false) => tone(high ? 880 : 520, 0.12, 'sine', 0.1),
  isMuted: () => muted,
  setMuted: (m: boolean) => {
    muted = m;
  },
};
