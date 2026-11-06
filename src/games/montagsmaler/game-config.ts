/**
 * Montagsmaler – Metadaten und Einstellungen.
 * Diese Datei ist frei von React und wird von Client UND Server importiert.
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { WORD_CATEGORIES } from '../../shared/types/words';

export const MONTAGSMALER_ID = 'montagsmaler';

export const montagsmalerMeta: GameMeta = {
  id: MONTAGSMALER_ID,
  name: 'Montagsmaler',
  tagline: 'Zeichne. Rate. Lach dich schlapp.',
  description:
    'Eine Person zeichnet ein geheimes Wort auf dem Smartphone – alle anderen raten live mit. Wer zuerst richtig liegt, holt die meisten Punkte.',
  minPlayers: 2,
  maxPlayers: 12,
  durationMinutes: [10, 25],
  status: 'available',
  theme: { from: '#ff8a4c', via: '#ff3d77', to: '#8b5cf6', accent: '#ff5a7a' },
  tags: ['Zeichnen', 'Raten', 'Kreativ'],
};

export const WORD_MODES = ['standard', 'custom', 'mix'] as const;
export type WordMode = (typeof WORD_MODES)[number];

export const WORD_MODE_LABELS: Record<WordMode, { label: string; hint: string }> = {
  standard: { label: 'Standard', hint: 'Integrierter Wörterpool' },
  custom: { label: 'Eigene Wörter', hint: 'Nur deine Wortlisten' },
  mix: { label: 'Mix', hint: 'Standard + eigene Wörter' },
};

const scoringSchema = z.object({
  /** Punkte für den ersten richtigen Rater */
  firstGuessPoints: z.number().int().min(10).max(1000),
  /** Abzug je weiterem richtigen Rater */
  pointsDecrement: z.number().int().min(0).max(500),
  /** Mindestpunkte für einen richtigen Rater */
  minGuessPoints: z.number().int().min(0).max(1000),
  /** Zusatzpunkte für schnelle Antworten (anteilig nach Restzeit) */
  timeBonusMax: z.number().int().min(0).max(500),
  /** Punkte für den Zeichner je richtigem Rater */
  drawerPointsPerGuess: z.number().int().min(0).max(500),
});
export type ScoringConfig = z.infer<typeof scoringSchema>;

export const montagsmalerSettingsSchema = z.object({
  rounds: z.number().int().min(1).max(10),
  drawTimeSeconds: z.number().int().min(30).max(240),
  /** 1 = Wort wird automatisch vergeben, sonst Auswahl aus n Wörtern */
  wordChoices: z.number().int().min(1).max(3),
  wordMode: z.enum(WORD_MODES),
  categories: z.array(z.enum(WORD_CATEGORIES)).min(1),
  difficulties: z.array(z.enum(['leicht', 'mittel', 'schwer'])).min(1),
  customListIds: z.array(z.string().max(64)).max(50),
  hints: z.boolean(),
  showCategory: z.boolean(),
  scoring: scoringSchema,
});
export type MontagsmalerSettings = z.infer<typeof montagsmalerSettingsSchema>;

export const DEFAULT_SCORING: ScoringConfig = {
  firstGuessPoints: 100,
  pointsDecrement: 15,
  minGuessPoints: 40,
  timeBonusMax: 50,
  drawerPointsPerGuess: 25,
};

export const DEFAULT_MONTAGSMALER_SETTINGS: MontagsmalerSettings = {
  rounds: 3,
  drawTimeSeconds: 80,
  wordChoices: 3,
  wordMode: 'standard',
  categories: [...WORD_CATEGORIES],
  difficulties: ['leicht', 'mittel', 'schwer'],
  customListIds: [],
  hints: true,
  showCategory: true,
  scoring: DEFAULT_SCORING,
};

export function parseMontagsmalerSettings(raw: unknown): MontagsmalerSettings {
  // fehlende Felder mit Defaults auffüllen, danach strikt validieren
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<MontagsmalerSettings>;
  return montagsmalerSettingsSchema.parse({
    ...DEFAULT_MONTAGSMALER_SETTINGS,
    ...obj,
    scoring: { ...DEFAULT_SCORING, ...(obj.scoring ?? {}) },
  });
}

/** Zeiten der einzelnen Phasen */
export const PHASE_TIMING = {
  chooseSeconds: 15,
  revealSeconds: 7,
  drawerReconnectGraceSeconds: 15,
  guesserReconnectGraceSeconds: 10,
} as const;

/** Farbpalette – Spieler senden nur Indizes, der Server validiert. */
export const PALETTE = [
  '#111111', '#7a7a7a', '#ffffff', '#e03131', '#ff7a1a', '#ffd43b',
  '#2f9e44', '#74c0fc', '#1c7ed6', '#7048e8', '#e64980', '#8d5524',
] as const;
export const ERASER_COLOR_INDEX = -1;
/** Pinselgrößen in Tausendstel der Zeichenflächenbreite */
export const BRUSH_SIZES = [4, 9, 18, 34] as const;
export const COORD_MAX = 1000;
export const GUESS_MAX_LENGTH = 40;
