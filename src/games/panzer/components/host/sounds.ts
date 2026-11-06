/** Kleine synthetische Soundeffekte (Web Audio, keine Dateien nötig). */
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

// Browser erlauben Ton erst nach einer Interaktion
if (typeof window !== 'undefined') {
  const unlock = () => audio();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.15, slideTo?: number) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur: number, vol = 0.3, cutoff = 900) {
  const a = audio();
  if (!a) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const panzerSounds = {
  shot: () => tone(420, 0.08, 'square', 0.06, 160),
  boom: (s = 1) => noise(0.35 + 0.25 * s, 0.35 * Math.min(1.4, s), 700),
  laser: () => tone(1400, 0.35, 'sawtooth', 0.08, 180),
  pickup: () => {
    tone(660, 0.09, 'triangle', 0.12);
    setTimeout(() => tone(990, 0.12, 'triangle', 0.12), 80);
  },
  honk: () => {
    tone(330, 0.18, 'square', 0.08);
    setTimeout(() => tone(262, 0.22, 'square', 0.08), 160);
  },
  pop: () => tone(900, 0.15, 'sine', 0.12, 300),
  beep: (high = false) => tone(high ? 880 : 520, high ? 0.35 : 0.15, 'square', 0.07),
  setMuted(m: boolean) {
    muted = m;
  },
  isMuted: () => muted,
};
