/**
 * Gemeinsame Audio-Grundlage: ein AudioContext für alles, getrennte Busse für Musik und
 * Effekte, Lautstärke-Einstellungen (im Browser gespeichert).
 * Klänge und Musik sind echte Aufnahmen (CC0, siehe public/audio/CREDITS.md).
 */

export interface AudioSettings {
  music: number; // 0–1
  sfx: number; // 0–1
  muted: boolean;
}

const KEY = 'luma-audio';
const DEFAULTS: AudioSettings = { music: 0.45, sfx: 0.8, muted: false };

function load(): AudioSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AudioSettings>) };
  } catch {
    /* egal */
  }
  return { ...DEFAULTS };
}

let settings: AudioSettings = typeof window === 'undefined' ? { ...DEFAULTS } : load();
const listeners = new Set<(s: AudioSettings) => void>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

function build(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 3;
  master = ctx.createGain();
  master.connect(compressor).connect(ctx.destination);
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(master);
  sfxGain.connect(master);
  apply();
  return ctx;
}

function apply() {
  if (!ctx || !master || !musicGain || !sfxGain) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(settings.muted ? 0 : 1, t, 0.05);
  musicGain.gain.setTargetAtTime(settings.music, t, 0.08);
  sfxGain.gain.setTargetAtTime(settings.sfx, t, 0.05);
}

/** gemeinsamer AudioContext (oder null, wenn nicht verfügbar) */
export function audioCtx(): AudioContext | null {
  const a = build();
  if (a && a.state === 'suspended') void a.resume();
  return a;
}

export function sfxBus(): AudioNode | null {
  return audioCtx() ? sfxGain : null;
}

export function musicBus(): AudioNode | null {
  return audioCtx() ? musicGain : null;
}

export function getAudioSettings(): AudioSettings {
  return settings;
}

export function setAudioSettings(patch: Partial<AudioSettings>) {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* egal */
  }
  apply();
  listeners.forEach((l) => l(settings));
}

export function onAudioSettings(fn: (s: AudioSettings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Browser erlauben Ton erst nach einer Berührung
if (typeof window !== 'undefined') {
  const unlock = () => audioCtx();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}
