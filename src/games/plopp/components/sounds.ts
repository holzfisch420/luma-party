/** Geräusche für „Plopp!“ (echte Aufnahmen, CC0). */
import { getAudioSettings, setAudioSettings } from '../../../app/audio/engine';
import { playOneOf, playSfx, preloadSfx } from '../../../app/audio/sfx';

preloadSfx(['clock-tick', 'bubble-1', 'bubble-2', 'bubble-3', 'buzzer', 'question', 'cork', 'splash', 'steel-round']);

export const ploppSounds = {
  /** Ticken – schneller und höher, je praller der Fisch */
  tick: (tension: number) => playSfx('clock-tick', { vol: 0.25 + tension * 0.45, rate: 1 + tension * 0.35 }),
  /** Antwort gilt: Blubb */
  pass: () => playOneOf(['bubble-1', 'bubble-2', 'bubble-3'], { vol: 0.9, vary: 0.08 }),
  /** schon genannt / unbekannt */
  nope: () => playSfx('buzzer', { vol: 0.45 }),
  /** Abstimmung startet */
  vote: () => playSfx('question', { vol: 0.8 }),
  /** PLOPP! */
  pop: () => {
    playSfx('cork', { vol: 1, rate: 0.85 });
    playSfx('splash', { vol: 0.7, delay: 0.08 });
  },
  /** neue Runde */
  round: () => playSfx('steel-round', { vol: 0.7 }),
  isMuted: () => getAudioSettings().muted,
  setMuted: (m: boolean) => setAudioSettings({ muted: m }),
};

/** deutsche Stimme (einmal gesucht) */
let voice: SpeechSynthesisVoice | null | undefined;
function germanVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  const list = synth.getVoices();
  if (!list.length) return null; // Stimmen noch nicht geladen – Browser-Standard mit lang=de
  if (voice !== undefined) return voice;
  const de = list.filter((v) => v.lang?.toLowerCase().startsWith('de'));
  // möglichst natürliche Stimme bevorzugen
  voice = de.find((v) => /google|natural|neural|online|premium|enhanced/i.test(v.name)) ?? de[0] ?? null;
  return voice;
}

/** Antwort am Fernseher vorlesen (Text-to-Speech des Browsers) */
export function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const s = getAudioSettings();
  if (s.muted || s.sfx <= 0) return;
  try {
    const synth = window.speechSynthesis;
    // nicht aufstauen: Neues ersetzt, was noch wartet
    if (synth.pending || synth.speaking) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    const v = germanVoice();
    if (v) u.voice = v;
    u.rate = 1.08;
    u.pitch = 1.05;
    u.volume = Math.min(1, s.sfx * 1.2);
    synth.speak(u);
  } catch {
    /* ohne Sprachausgabe weiter */
  }
}
