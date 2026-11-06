/**
 * Avatar-Modell (Mii-ähnliche Figur aus Bausteinen).
 * Wird von Client (Editor, Darstellung) und Server (Validierung, Speicherung) geteilt.
 */
import { z } from 'zod';

export const SKIN_TONES = ['#fde3cf', '#f7cfae', '#efbd92', '#e0a473', '#c68652', '#a0673e', '#7c4a2b', '#5a341f'] as const;
export const HAIR_COLORS = ['#2b1d14', '#4a2f1e', '#7a4a28', '#b07034', '#d9a441', '#f1d27a', '#9e9e9e', '#eeeeee', '#c0392b', '#3b6fd8', '#e86fb0'] as const;
export const EYE_COLORS = ['#3b2414', '#2f6fd1', '#2f9e5b', '#6b7884', '#8a6a2f', '#161616'] as const;
export const SHIRT_COLORS = [
  '#e53935', '#fb8c00', '#fdd835', '#9ccc65', '#2e9d4f', '#1e63c6',
  '#4fc3f7', '#f48fb1', '#8e5bd6', '#8d5a36', '#f5f5f5', '#333333',
] as const;

/** Anzahl der Varianten je Baustein + Bezeichnungen für den Editor */
export const AVATAR_PARTS = {
  face: ['Rund', 'Oval', 'Eckig', 'Spitz'],
  hair: ['Glatze', 'Kurz', 'Seitenscheitel', 'Stachelig', 'Locken', 'Lang', 'Bob', 'Pferdeschwanz', 'Dutt', 'Irokese'],
  eyes: ['Punkte', 'Groß', 'Fröhlich', 'Müde', 'Mandel', 'Wimpern', 'Klein'],
  brows: ['Normal', 'Buschig', 'Gewölbt', 'Grimmig', 'Dünn'],
  nose: ['Klein', 'Strich', 'Knubbel', 'Spitz'],
  mouth: ['Lächeln', 'Lachen', 'Neutral', 'Staunen', 'Zunge', 'Schmunzeln', 'Strahlen'],
  glasses: ['Keine', 'Rund', 'Eckig', 'Sonnenbrille', 'Groß'],
  facialHair: ['Keiner', 'Schnurrbart', 'Vollbart', 'Spitzbart', 'Stoppeln'],
} as const;

export type AvatarPart = keyof typeof AVATAR_PARTS;

const idx = (n: number) => z.number().int().min(0).max(n - 1);

export const avatarSchema = z.object({
  v: z.literal(1),
  face: idx(AVATAR_PARTS.face.length),
  skin: idx(SKIN_TONES.length),
  hair: idx(AVATAR_PARTS.hair.length),
  hairColor: idx(HAIR_COLORS.length),
  eyes: idx(AVATAR_PARTS.eyes.length),
  eyeColor: idx(EYE_COLORS.length),
  brows: idx(AVATAR_PARTS.brows.length),
  nose: idx(AVATAR_PARTS.nose.length),
  mouth: idx(AVATAR_PARTS.mouth.length),
  glasses: idx(AVATAR_PARTS.glasses.length),
  facialHair: idx(AVATAR_PARTS.facialHair.length),
  cheeks: z.boolean(),
  shirt: idx(SHIRT_COLORS.length),
});

export type AvatarConfig = z.infer<typeof avatarSchema>;

export const DEFAULT_AVATAR: AvatarConfig = {
  v: 1,
  face: 0,
  skin: 1,
  hair: 1,
  hairColor: 1,
  eyes: 0,
  eyeColor: 0,
  brows: 0,
  nose: 0,
  mouth: 0,
  glasses: 0,
  facialHair: 0,
  cheeks: true,
  shirt: 5,
};

const pick = (n: number) => Math.floor(Math.random() * n);

/** Zufälliger, aber stimmiger Avatar („Würfeln“-Knopf). */
export function randomAvatar(): AvatarConfig {
  return {
    v: 1,
    face: pick(AVATAR_PARTS.face.length),
    skin: pick(SKIN_TONES.length),
    hair: pick(AVATAR_PARTS.hair.length),
    hairColor: Math.random() < 0.85 ? pick(8) : pick(HAIR_COLORS.length),
    eyes: pick(AVATAR_PARTS.eyes.length),
    eyeColor: pick(EYE_COLORS.length),
    brows: pick(AVATAR_PARTS.brows.length),
    nose: pick(AVATAR_PARTS.nose.length),
    mouth: pick(AVATAR_PARTS.mouth.length),
    glasses: Math.random() < 0.7 ? 0 : 1 + pick(AVATAR_PARTS.glasses.length - 1),
    facialHair: Math.random() < 0.75 ? 0 : 1 + pick(AVATAR_PARTS.facialHair.length - 1),
    cheeks: Math.random() < 0.5,
    shirt: pick(SHIRT_COLORS.length),
  };
}

/** Prüft und normalisiert einen Avatar; null bei ungültigen Daten. */
export function parseAvatar(raw: unknown): AvatarConfig | null {
  const r = avatarSchema.safeParse(raw);
  return r.success ? r.data : null;
}
