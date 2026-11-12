/**
 * „Plopp!“ – Antwort tippen, Kugelfisch weitergeben, bevor er platzt.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { PROMPT_PACKS } from './prompt-types';

export const PLOPP_ID = 'plopp';

export const ploppMeta: GameMeta = {
  id: PLOPP_ID,
  name: 'Plopp!',
  tagline: 'Antwort tippen, Fisch weitergeben – bevor er platzt!',
  description:
    'Eine Aufgabe für alle, zum Beispiel „Ein Tier“. Wer den Kugelfisch hat, tippt eine passende Antwort aufs Handy und gibt ihn damit weiter. Irgendwann platzt er – wann, weiß niemand. Wer ihn dann hält, verliert ein Leben. Die letzte Person im Wasser gewinnt.',
  minPlayers: 2,
  maxPlayers: 12,
  durationMinutes: [5, 20],
  status: 'available',
  theme: { from: '#0b3d6b', via: '#1576a8', to: '#5fd4e8', accent: '#ffb02e' },
  tags: ['Schnell', 'Wissen', 'Nervenkitzel'],
};

export const FUSES = ['kurz', 'mittel', 'lang'] as const;
export type Fuse = (typeof FUSES)[number];
export const FUSE_RANGES: Record<Fuse, { min: number; max: number; label: string }> = {
  kurz: { min: 6, max: 18, label: 'Kurz (6–18 s)' },
  mittel: { min: 10, max: 30, label: 'Mittel (10–30 s)' },
  lang: { min: 20, max: 45, label: 'Lang (20–45 s)' },
};

export const ploppSettingsSchema = z.object({
  packs: z.array(z.enum(PROMPT_PACKS)).max(PROMPT_PACKS.length),
  lives: z.number().int().min(1).max(3),
  fuse: z.enum(FUSES),
  /** Aufgaben wie „Ein Tier mit B“ */
  letters: z.boolean(),
  /** unbekannte Antworten: die anderen stimmen ab (sonst abgelehnt) */
  vote: z.boolean(),
});
export type PloppSettings = z.infer<typeof ploppSettingsSchema>;

export const DEFAULT_PLOPP_SETTINGS: PloppSettings = {
  packs: ['alltag', 'essen', 'welt', 'natur', 'pop', 'musik', 'sport'],
  lives: 2,
  fuse: 'mittel',
  letters: true,
  vote: true,
};

export function parsePloppSettings(raw: unknown): PloppSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<PloppSettings>;
  return ploppSettingsSchema.parse({ ...DEFAULT_PLOPP_SETTINGS, ...obj });
}

export const TIMING = {
  introMs: 3500,
  popMs: 4800,
  voteMs: 7000,
  /** Anteil der Buchstaben-Aufgaben */
  letterShare: 0.3,
} as const;

export const ANSWER_MAX = 40;
