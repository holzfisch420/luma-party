/** Synthetische Soundeffekte und eine kleine Fluchtmelodie (Web Audio, keine Dateien nötig). */
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

function noise(dur: number, vol = 0.2, cutoff = 1200, delay = 0, type: BiquadFilterType = 'lowpass') {
  const a = audio();
  if (!a || !master) return;
  const t0 = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

/** Trillerpfeife: hoher Ton mit schnellem Vibrato */
function whistle(dur = 0.45, vol = 0.07, delay = 0) {
  const a = audio();
  if (!a || !master) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const lfo = a.createOscillator();
  const lfoGain = a.createGain();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.value = 2900;
  lfo.frequency.value = 28;
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.setValueAtTime(vol, t0 + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  lfo.start(t0);
  o.stop(t0 + dur + 0.02);
  lfo.stop(t0 + dur + 0.02);
}

// ------------------------------------------------------------------ Musik
let musicTimer: ReturnType<typeof setInterval> | null = null;
const BASS = [110, 0, 110, 131, 0, 147, 131, 0, 98, 0, 98, 117, 0, 131, 147, 165];
const LEAD = [440, 0, 523, 0, 587, 523, 440, 0, 392, 0, 440, 523, 0, 587, 659, 0];

const last: Record<string, number> = {};
function throttled(key: string, ms: number, fn: () => void) {
  const now = performance.now();
  if ((last[key] ?? 0) + ms > now) return;
  last[key] = now;
  fn();
}

export const huhnSounds = {
  /** Schwerkraft umdrehen: Wusch nach oben bzw. unten + kurzes „Bok!“ */
  flip: (up: boolean) =>
    throttled('flip', 70, () => {
      tone(up ? 280 : 760, 0.16, 'sine', 0.07, up ? 820 : 260);
      tone(640 + Math.random() * 120, 0.06, 'square', 0.025, 430, 0.04);
    }),
  /** zwei Hühner rempeln sich */
  bump: () => throttled('bump', 120, () => tone(200, 0.12, 'sine', 0.09, 110)),
  /** abgestürzt: fallender Pfeifton + Gackern */
  fall: () => {
    tone(1300, 0.75, 'sine', 0.07, 160);
    tone(950, 0.12, 'sawtooth', 0.06, 380, 0.05);
    tone(1100, 0.1, 'sawtooth', 0.05, 450, 0.17);
  },
  /** Huhn geschnappt: Gackern + Trillerpfeife */
  caught: () => {
    tone(950, 0.12, 'sawtooth', 0.09, 380);
    tone(1100, 0.1, 'sawtooth', 0.08, 450, 0.12);
    tone(800, 0.18, 'sawtooth', 0.07, 260, 0.24);
    noise(0.15, 0.08, 3000, 0.05, 'highpass');
    whistle(0.5, 0.06, 0.15);
  },
  /** Blaulicht: Martinshorn (tatü-tata) */
  siren: () =>
    throttled('siren', 1400, () => {
      for (let i = 0; i < 2; i++) {
        tone(466, 0.32, 'triangle', 0.05, undefined, i * 0.64);
        tone(622, 0.32, 'triangle', 0.05, undefined, i * 0.64 + 0.32);
      }
    }),
  bark: () =>
    throttled('bark', 500, () => {
      noise(0.08, 0.18, 900);
      tone(320, 0.09, 'sawtooth', 0.07, 180);
      noise(0.07, 0.15, 900, 0.16);
      tone(340, 0.08, 'sawtooth', 0.06, 190, 0.16);
    }),
  heli: () =>
    throttled('heli', 1500, () => {
      for (let i = 0; i < 10; i++) noise(0.06, 0.12, 220, i * 0.09);
    }),
  copWhistle: () => throttled('cop', 1800, () => whistle(0.22, 0.035)),
  beep: (go = false) => {
    if (go) {
      whistle(0.55, 0.07);
      tone(880, 0.3, 'square', 0.05);
    } else tone(520, 0.15, 'square', 0.06);
  },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'square', 0.06, undefined, i * 0.12));
    tone(1047, 0.6, 'triangle', 0.07, undefined, 0.5);
  },
  startMusic(tempo = 1) {
    this.stopMusic();
    let step = 0;
    const interval = 140 / tempo;
    musicTimer = setInterval(() => {
      const b = BASS[step % BASS.length]!;
      const l = LEAD[step % LEAD.length]!;
      if (b) tone(b, 0.12, 'triangle', 0.05);
      if (l && step % 32 >= 16) tone(l, 0.1, 'square', 0.018);
      if (step % 4 === 0) noise(0.03, 0.05, 6000, 0, 'highpass');
      step++;
    }, interval);
  },
  stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  },
  setMuted(m: boolean) {
    muted = m;
    if (m) this.stopMusic();
  },
  isMuted: () => muted,
};
