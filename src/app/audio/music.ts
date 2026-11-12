/**
 * Hintergrundmusik: Stücke von FreePD (Kevin MacLeod, CC0), weich überblendet.
 * Mehrere Komponenten können Musik anfordern – die zuletzt angemeldete gewinnt
 * (z. B. Launcher → Spiel → Phase im Spiel). Läuft nur auf dem Hauptbildschirm.
 */
import { useEffect } from 'react';
import { audioCtx, musicBus } from './engine';

export type TrackId =
  | 'menu'
  | 'results'
  | 'montagsmaler'
  | 'imposter'
  | 'echt'
  | 'plopp'
  | 'wort'
  | 'klingen'
  | 'vollmond-night'
  | 'vollmond-day'
  | 'racer'
  | 'huhn'
  | 'panzer'
  | 'theater';

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode;
  track: TrackId;
}

let current: Deck | null = null;
const requests: { id: number; track: TrackId | null; vol: number }[] = [];
let nextId = 1;
let pendingStart = false;

function fadeTo(g: GainNode, v: number, seconds: number) {
  const a = audioCtx();
  if (!a) return;
  g.gain.cancelScheduledValues(a.currentTime);
  g.gain.setValueAtTime(g.gain.value, a.currentTime);
  g.gain.linearRampToValueAtTime(v, a.currentTime + seconds);
}

function makeDeck(track: TrackId): Deck | null {
  const a = audioCtx();
  const out = musicBus();
  if (!a || !out) return null;
  const el = new Audio(`/audio/music/${track}.mp3`);
  el.loop = true;
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  const src = a.createMediaElementSource(el);
  const gain = a.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(out);
  return { el, gain, track };
}

function apply() {
  const want = requests.at(-1);
  const track = want?.track ?? null;
  const vol = want?.vol ?? 1;
  if (current && current.track === track) {
    fadeTo(current.gain, vol, 0.6);
    if (current.el.paused) void current.el.play().catch(() => (pendingStart = true));
    return;
  }
  // altes Stück ausblenden
  if (current) {
    const old = current;
    fadeTo(old.gain, 0, 1.2);
    setTimeout(() => {
      old.el.pause();
      old.el.src = '';
    }, 1300);
    current = null;
  }
  if (!track) return;
  const deck = makeDeck(track);
  if (!deck) return;
  current = deck;
  deck.el
    .play()
    .then(() => fadeTo(deck.gain, vol, 1.2))
    .catch(() => {
      // Browser erlaubt Ton erst nach einer Berührung – dann erneut versuchen
      pendingStart = true;
    });
}

if (typeof window !== 'undefined') {
  const retry = () => {
    if (!pendingStart || !current) return;
    pendingStart = false;
    const deck = current;
    void deck.el.play().then(() => fadeTo(deck.gain, requests.at(-1)?.vol ?? 1, 1.2)).catch(() => (pendingStart = true));
  };
  window.addEventListener('pointerdown', retry, { passive: true });
  window.addEventListener('keydown', retry);
}

/** Musik anfordern, solange die Komponente sichtbar ist (null = Stille) */
export function useMusic(track: TrackId | null, vol = 1) {
  useEffect(() => {
    const id = nextId++;
    requests.push({ id, track, vol });
    apply();
    return () => {
      const i = requests.findIndex((r) => r.id === id);
      if (i >= 0) requests.splice(i, 1);
      apply();
    };
  }, [track, vol]);
}

/** Musik kurz leiser (z. B. während einer Durchsage) */
export function duckMusic(seconds = 1.5, to = 0.35) {
  if (!current) return;
  const deck = current;
  const vol = requests.at(-1)?.vol ?? 1;
  fadeTo(deck.gain, vol * to, 0.2);
  setTimeout(() => current === deck && fadeTo(deck.gain, vol, 0.8), seconds * 1000);
}
