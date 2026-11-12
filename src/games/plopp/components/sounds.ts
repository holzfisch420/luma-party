/** Synthetische Soundeffekte für „Plopp!“ (Web Audio, keine Dateien nötig). */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
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

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.12, slideTo?: number, delay = 0) {
  const a = audio();
  if (!a || !master) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.2, cutoff = 1200, delay = 0) {
  const a = audio();
  if (!a || !master) return;
  const t0 = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

export const ploppSounds = {
  /** Ticken der Zündschnur – höher, je praller der Fisch */
  tick: (tension: number) => tone(900 + tension * 700, 0.03, 'square', 0.025 + tension * 0.03),
  /** Antwort gilt: Blubb nach oben */
  pass: () => {
    tone(320, 0.12, 'sine', 0.12, 720);
    tone(520, 0.1, 'sine', 0.08, 1000, 0.07);
  },
  /** schon genannt / unbekannt */
  nope: () => {
    tone(180, 0.16, 'sawtooth', 0.06, 140);
    tone(150, 0.2, 'sawtooth', 0.05, 110, 0.12);
  },
  /** Abstimmung startet */
  vote: () => {
    tone(660, 0.1, 'triangle', 0.07);
    tone(880, 0.14, 'triangle', 0.07, undefined, 0.11);
  },
  /** PLOPP! */
  pop: () => {
    noise(0.55, 0.55, 2400);
    tone(140, 0.45, 'sine', 0.3, 40);
    tone(1200, 0.25, 'sine', 0.05, 300, 0.05);
  },
  /** neue Runde */
  round: () => {
    [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.07, undefined, i * 0.09));
  },
  isMuted: () => muted,
  setMuted: (m: boolean) => {
    muted = m;
  },
};
