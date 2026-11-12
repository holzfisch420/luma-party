/**
 * Klangeffekte als echte Aufnahmen (CC0: Kenney und „adbertiser-sfx“, siehe public/audio/CREDITS.md).
 * Dateien werden beim ersten Gebrauch geladen und zwischengespeichert; preloadSfx lädt vorab.
 */
import { audioCtx, sfxBus } from './engine';

export type SfxKey =
  | 'air-horn'
  | 'applause'
  | 'aww'
  | 'birds'
  | 'blip'
  | 'boing'
  | 'bonk'
  | 'bubble-1'
  | 'bubble-2'
  | 'bubble-3'
  | 'buzzer'
  | 'checkpoint'
  | 'cheer'
  | 'clang'
  | 'clock-tick'
  | 'cork'
  | 'count-go'
  | 'count-tick'
  | 'crash'
  | 'crickets'
  | 'curtain'
  | 'draw-close'
  | 'draw-correct'
  | 'draw-crumple'
  | 'draw-round'
  | 'draw-scribble'
  | 'drumroll'
  | 'dun'
  | 'explosion-small'
  | 'explosion'
  | 'fail'
  | 'fanfare'
  | 'gavel'
  | 'ghost'
  | 'glass-break'
  | 'gunshot'
  | 'heartbeat'
  | 'honk-toy'
  | 'horn'
  | 'howl'
  | 'join'
  | 'key-enter'
  | 'key'
  | 'knock'
  | 'lap'
  | 'laser'
  | 'leave'
  | 'level-up'
  | 'mystery'
  | 'note-stick'
  | 'ooh'
  | 'page-flip'
  | 'points'
  | 'pop'
  | 'powerup'
  | 'question'
  | 'reveal'
  | 'sax-win'
  | 'shot'
  | 'siren'
  | 'slide-down'
  | 'splash'
  | 'stamp'
  | 'start'
  | 'steel-round'
  | 'success'
  | 'suspense'
  | 'swish'
  | 'thunk-1'
  | 'thunk-2'
  | 'thunk-3'
  | 'typewriter'
  | 'ui-back'
  | 'ui-close'
  | 'ui-confirm'
  | 'ui-error'
  | 'ui-move'
  | 'ui-open'
  | 'ui-page'
  | 'ui-select'
  | 'ui-tap'
  | 'ui-toggle'
  | 'whistle'
  | 'whoosh-big'
  | 'whoosh'
  | 'win'
  | 'wind';

const buffers = new Map<SfxKey, AudioBuffer>();
const loading = new Map<SfxKey, Promise<AudioBuffer | null>>();

function load(key: SfxKey): Promise<AudioBuffer | null> {
  const cached = buffers.get(key);
  if (cached) return Promise.resolve(cached);
  let p = loading.get(key);
  if (!p) {
    p = fetch(`/audio/sfx/${key}.wav`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const a = audioCtx();
        return a ? a.decodeAudioData(data) : null;
      })
      .then((buf) => {
        if (buf) buffers.set(key, buf);
        return buf;
      })
      .catch(() => null);
    loading.set(key, p);
  }
  return p;
}

/** nur der Hauptbildschirm lädt alle Effekte vorab – Handys laden bei Bedarf */
const isHost = typeof location !== 'undefined' && !location.pathname.startsWith('/play');

/** Effekte vorab laden (z. B. beim Start eines Spiels) */
export function preloadSfx(keys: SfxKey[]) {
  if (!isHost) return;
  for (const k of keys) void load(k);
}

export interface PlayOpts {
  /** Lautstärke 0–1 (relativ) */
  vol?: number;
  /** Tonhöhe/Geschwindigkeit (1 = normal) */
  rate?: number;
  /** zufällige Tonhöhen-Abweichung, z. B. 0.08 = ±8 % */
  vary?: number;
  /** Verzögerung in Sekunden */
  delay?: number;
}

const lastPlayed = new Map<SfxKey, number>();

/** spielt einen Effekt; mehrfaches Auslösen innerhalb von 30 ms wird zusammengefasst */
export function playSfx(key: SfxKey, o: PlayOpts = {}) {
  const now = performance.now();
  if (now - (lastPlayed.get(key) ?? 0) < 30) return;
  lastPlayed.set(key, now);
  const start = (buf: AudioBuffer) => {
    const a = audioCtx();
    const out = sfxBus();
    if (!a || !out) return;
    const src = a.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = (o.rate ?? 1) * (1 + (o.vary ? (Math.random() * 2 - 1) * o.vary : 0));
    const g = a.createGain();
    g.gain.value = o.vol ?? 1;
    src.connect(g).connect(out);
    src.start(a.currentTime + (o.delay ?? 0));
  };
  const buf = buffers.get(key);
  if (buf) start(buf);
  else void load(key).then((b) => b && start(b));
}

/** eine von mehreren Varianten zufällig */
export function playOneOf(keys: SfxKey[], o?: PlayOpts) {
  playSfx(keys[Math.floor(Math.random() * keys.length)]!, o);
}

/** gängige Menü-Klänge */
export const ui = {
  move: () => playSfx('ui-move', { vol: 0.45, vary: 0.04 }),
  select: () => playSfx('ui-select', { vol: 0.8 }),
  open: () => playSfx('ui-open', { vol: 0.7 }),
  close: () => playSfx('ui-close', { vol: 0.7 }),
  back: () => playSfx('ui-back', { vol: 0.7 }),
  page: () => playSfx('ui-page', { vol: 0.7 }),
  toggle: () => playSfx('ui-toggle', { vol: 0.6 }),
  error: () => playSfx('ui-error', { vol: 0.7 }),
  confirm: () => playSfx('ui-confirm', { vol: 0.8 }),
  tap: () => playSfx('ui-tap', { vol: 0.5 }),
};

preloadSfx(['ui-move', 'ui-select', 'ui-open', 'ui-close', 'ui-back', 'ui-page', 'ui-toggle', 'ui-confirm', 'join', 'start']);
