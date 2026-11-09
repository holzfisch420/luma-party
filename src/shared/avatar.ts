/**
 * Avatar-Modell „Knubbel“: eigene, glänzende Spielzeug-Figuren aus Form, Augen, Mund und Extras.
 * Wird von Client (Editor, Darstellung) und Server (Validierung, Speicherung) geteilt.
 *
 * Version 2. Ältere Avatare (Version 1, menschliche Gesichter) werden beim Einlesen
 * automatisch in einen passenden Knubbel umgewandelt.
 */
import { z } from 'zod';

/** Körperfarben */
export const BODY_COLORS = [
  '#ff5a5f', '#ff8a3d', '#ffc93c', '#9be15d', '#2ecc71', '#1abc9c',
  '#3ec1f3', '#3b82f6', '#6c5ce7', '#b06ef3', '#ff7eb6', '#f5f0e8',
  '#8d6e63', '#3d3d4e',
] as const;
/** Hintergrundfarben */
export const BG_COLORS = [
  '#ffe3e3', '#ffe8cc', '#fff3bf', '#e6fcd5', '#d3f9d8', '#c3fae8',
  '#d0ebff', '#dbe4ff', '#e5dbff', '#f3d9fa', '#fcc2d7', '#f1f3f5',
  '#343a40', '#1b1f3b',
] as const;
export const EYE_COLORS = ['#2b2b38', '#5b3a29', '#2f6fd1', '#22a06b', '#8e44ad', '#e67e22', '#d6336c', '#0c8599'] as const;

/** Bausteine + Bezeichnungen für den Editor */
export const AVATAR_PARTS = {
  shape: ['Kugel', 'Ei', 'Würfel', 'Tropfen', 'Bohne', 'Geist', 'Wolke'],
  eyes: ['Glanz', 'Oval', 'Kulleraugen', 'Fröhlich', 'Schläfrig', 'Punkte', 'Sterne', 'Zwinkern'],
  mouth: ['Lächeln', 'Grinsen', 'Staunen', 'Zunge', 'Katzenmund', 'Neutral', 'Zähnchen', 'Schmollen'],
  brows: ['Keine', 'Sanft', 'Hochgezogen', 'Grimmig', 'Besorgt'],
  extra: ['Nichts', 'Antenne', 'Hörner', 'Katzenohren', 'Blatt', 'Krone', 'Schleife', 'Mütze'],
} as const;

export type AvatarPart = keyof typeof AVATAR_PARTS;

/** Regler 0 … SLIDER_MAX (Mitte = Standard) */
export const SLIDER_MAX = 10;
export const AVATAR_SLIDERS = {
  eyeSize: 'Augengröße',
  eyeGap: 'Augenabstand',
  eyeY: 'Augenhöhe',
  mouthSize: 'Mundgröße',
  mouthY: 'Mundhöhe',
} as const;
export type AvatarSlider = keyof typeof AVATAR_SLIDERS;

const idx = (n: number) => z.number().int().min(0).max(n - 1);
const slider = z.number().int().min(0).max(SLIDER_MAX);

export const avatarSchema = z.object({
  v: z.literal(2),
  shape: idx(AVATAR_PARTS.shape.length),
  color: idx(BODY_COLORS.length),
  bg: idx(BG_COLORS.length),
  eyes: idx(AVATAR_PARTS.eyes.length),
  eyeColor: idx(EYE_COLORS.length),
  eyeSize: slider,
  eyeGap: slider,
  eyeY: slider,
  mouth: idx(AVATAR_PARTS.mouth.length),
  mouthSize: slider,
  mouthY: slider,
  brows: idx(AVATAR_PARTS.brows.length),
  extra: idx(AVATAR_PARTS.extra.length),
  cheeks: z.boolean(),
});

export type AvatarConfig = z.infer<typeof avatarSchema>;

export const DEFAULT_AVATAR: AvatarConfig = {
  v: 2,
  shape: 0,
  color: 6,
  bg: 6,
  eyes: 0,
  eyeColor: 0,
  eyeSize: 5,
  eyeGap: 5,
  eyeY: 5,
  mouth: 0,
  mouthSize: 5,
  mouthY: 5,
  brows: 0,
  extra: 0,
  cheeks: true,
};

const pick = (n: number) => Math.floor(Math.random() * n);
const around = (spread: number) => Math.max(0, Math.min(SLIDER_MAX, 5 + pick(spread * 2 + 1) - spread));

/** Zufälliger, aber stimmiger Knubbel („Würfeln“-Knopf). */
export function randomAvatar(): AvatarConfig {
  return {
    v: 2,
    shape: pick(AVATAR_PARTS.shape.length),
    color: pick(BODY_COLORS.length),
    bg: pick(BG_COLORS.length - 2),
    eyes: pick(AVATAR_PARTS.eyes.length),
    eyeColor: pick(EYE_COLORS.length),
    eyeSize: around(3),
    eyeGap: around(3),
    eyeY: around(2),
    mouth: pick(AVATAR_PARTS.mouth.length),
    mouthSize: around(3),
    mouthY: around(2),
    brows: Math.random() < 0.5 ? 0 : pick(AVATAR_PARTS.brows.length),
    extra: Math.random() < 0.35 ? 0 : pick(AVATAR_PARTS.extra.length),
    cheeks: Math.random() < 0.6,
  };
}

/** alter Avatar (Version 1) → möglichst ähnlicher Knubbel */
const legacySchema = z.object({
  v: z.literal(1),
  face: z.number().int(),
  skin: z.number().int(),
  eyes: z.number().int(),
  eyeColor: z.number().int(),
  mouth: z.number().int(),
  glasses: z.number().int(),
  cheeks: z.boolean(),
  shirt: z.number().int(),
});

function migrateV1(raw: z.infer<typeof legacySchema>): AvatarConfig {
  const m = (v: number, n: number) => ((v % n) + n) % n;
  return {
    ...DEFAULT_AVATAR,
    shape: m(raw.face, AVATAR_PARTS.shape.length),
    // Lieblingsfarbe wird Körperfarbe, Hintergrund passend dazu
    color: m(raw.shirt, BODY_COLORS.length),
    bg: m(raw.shirt, BG_COLORS.length - 2),
    eyes: m(raw.eyes, AVATAR_PARTS.eyes.length),
    eyeColor: m(raw.eyeColor, EYE_COLORS.length),
    mouth: m(raw.mouth, AVATAR_PARTS.mouth.length),
    cheeks: raw.cheeks,
  };
}

/** Prüft und normalisiert einen Avatar (wandelt alte Versionen um); null bei ungültigen Daten. */
export function parseAvatar(raw: unknown): AvatarConfig | null {
  const r = avatarSchema.safeParse(raw);
  if (r.success) return r.data;
  const old = legacySchema.safeParse(raw);
  return old.success ? migrateV1(old.data) : null;
}
