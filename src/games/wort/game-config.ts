/**
 * „Wortknacker“ – geheimes Wort mit 5 Buchstaben in 6 Versuchen erraten, alle gleichzeitig.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const WORT_ID = 'wort';
export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const wortMeta: GameMeta = {
  id: WORT_ID,
  name: 'Wortknacker',
  tagline: 'Fünf Buchstaben, sechs Versuche – wer knackt es zuerst?',
  description:
    'Alle raten gleichzeitig dasselbe geheime Wort mit fünf Buchstaben. Nach jedem Versuch zeigen die Farben, welche Buchstaben stimmen. Auf dem Fernseher sieht man nur die Farben der anderen – nicht ihre Buchstaben. Wer schnell und mit wenigen Versuchen knackt, holt die meisten Punkte.',
  minPlayers: 1,
  maxPlayers: 12,
  durationMinutes: [5, 20],
  status: 'available',
  theme: { from: '#1b2a4a', via: '#2c4a7a', to: '#4fb3a9', accent: '#2fb67c' },
  tags: ['Wörter', 'Rätsel', 'Gleichzeitig'],
};

export const wortSettingsSchema = z.object({
  rounds: z.number().int().min(1).max(10),
  seconds: z.number().int().min(60).max(600),
});
export type WortSettings = z.infer<typeof wortSettingsSchema>;

export const DEFAULT_WORT_SETTINGS: WortSettings = { rounds: 3, seconds: 180 };

export function parseWortSettings(raw: unknown): WortSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<WortSettings>;
  return wortSettingsSchema.parse({ ...DEFAULT_WORT_SETTINGS, ...obj });
}

export const TIMING = { revealMs: 9000 } as const;

/** Punkte: gelöst im n-ten Versuch → 7 − n; dazu Bonus für die Schnellsten */
export const SPEED_BONUS = [2, 1] as const;

/** Buchstaben, die auf der Tastatur vorkommen */
export const KEYBOARD_ROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNM'] as const;
