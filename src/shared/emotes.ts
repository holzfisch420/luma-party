/**
 * Zuschauer-Emotes und Bildschirmeffekte (für alle Spiele).
 * Emotes werden vom eigenen Avatar „gespielt“; Effekte füllen kurz den ganzen Fernseher.
 */
import type { AvatarConfig } from './avatar';

export const EMOTE_COOLDOWN_MS = 8000;

export interface EmoteDef {
  id: string;
  label: string;
  emoji: string;
  /** Text in der Sprechblase */
  bubble: string;
  /** Gesicht des Avatars für dieses Emote */
  face: Partial<AvatarConfig>;
  /** Bewegung des Avatars */
  anim: 'bounce' | 'shake' | 'jump' | 'wiggle' | 'pop' | 'sway' | 'spin' | 'nod';
  /** kleine Zusatzteilchen um den Avatar */
  fx?: string;
}

// Indizes siehe AVATAR_PARTS (Augen: 3 Fröhlich, 4 Schläfrig, 6 Sterne, 7 Zwinkern, 2 Kulleraugen;
// Mund: 1 Grinsen, 2 Staunen, 3 Zunge, 7 Schmollen, 0 Lächeln; Brauen: 3 Grimmig, 4 Besorgt, 2 Hochgezogen)
export const EMOTES: EmoteDef[] = [
  { id: 'lachen', label: 'Lachen', emoji: '😂', bubble: 'Hahaha!', face: { eyes: 3, mouth: 1, brows: 1 }, anim: 'shake', fx: '😂' },
  { id: 'jubel', label: 'Jubeln', emoji: '🎉', bubble: 'Jaaa!', face: { eyes: 6, mouth: 1, brows: 2 }, anim: 'jump', fx: '✨' },
  { id: 'wut', label: 'Wütend', emoji: '😡', bubble: 'Grrr!', face: { eyes: 1, mouth: 7, brows: 3 }, anim: 'shake', fx: '💢' },
  { id: 'weinen', label: 'Weinen', emoji: '😭', bubble: 'Buhuu…', face: { eyes: 4, mouth: 7, brows: 4 }, anim: 'sway', fx: '💧' },
  { id: 'wow', label: 'Staunen', emoji: '😮', bubble: 'Wow!', face: { eyes: 2, mouth: 2, brows: 2 }, anim: 'pop', fx: '❗' },
  { id: 'liebe', label: 'Verliebt', emoji: '😍', bubble: 'Herrlich!', face: { eyes: 6, mouth: 0, cheeks: true }, anim: 'sway', fx: '❤️' },
  { id: 'daumen', label: 'Daumen hoch', emoji: '👍', bubble: 'Top!', face: { eyes: 7, mouth: 0, brows: 1 }, anim: 'nod', fx: '👍' },
  { id: 'gaehnen', label: 'Gähnen', emoji: '😴', bubble: 'Gääähn…', face: { eyes: 4, mouth: 2, brows: 0 }, anim: 'sway', fx: '💤' },
  { id: 'frech', label: 'Ätsch', emoji: '😜', bubble: 'Ätsch!', face: { eyes: 7, mouth: 3, brows: 2 }, anim: 'wiggle', fx: '👅' },
  { id: 'gg', label: 'Gut gespielt', emoji: '👏', bubble: 'GG!', face: { eyes: 3, mouth: 6, brows: 1 }, anim: 'bounce', fx: '👏' },
];

export interface EffectDef {
  id: string;
  label: string;
  emoji: string;
}

export const EFFECTS: EffectDef[] = [
  { id: 'konfetti', label: 'Konfetti', emoji: '🎊' },
  { id: 'laser', label: 'Laserlampen', emoji: '🔦' },
  { id: 'disco', label: 'Discokugel', emoji: '🪩' },
  { id: 'feuerwerk', label: 'Feuerwerk', emoji: '🎆' },
  { id: 'herzen', label: 'Herzregen', emoji: '💖' },
  { id: 'blasen', label: 'Seifenblasen', emoji: '🫧' },
];

export const EMOTE_IDS = new Set(EMOTES.map((e) => e.id));
export const EFFECT_IDS = new Set(EFFECTS.map((e) => e.id));

/** an den Fernseher: jemand hat ein Emote oder einen Effekt geschickt */
export interface EmoteEvent {
  key: number;
  playerId: string;
  kind: 'emote' | 'effect';
  id: string;
}
