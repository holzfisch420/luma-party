/**
 * Imposter – alle kennen das geheime Wort, nur der Imposter nicht.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { WORD_CATEGORIES } from '../../shared/types/words';

export const IMPOSTER_ID = 'imposter';

export const imposterMeta: GameMeta = {
  id: IMPOSTER_ID,
  name: 'Imposter',
  tagline: 'Einer von euch kennt das Wort nicht.',
  description:
    'Alle bekommen auf dem Handy dasselbe geheime Wort – nur der Imposter nicht. Reihum sagt jede Person ein passendes Wort, dann wird diskutiert und abgestimmt: Wer blufft?',
  minPlayers: 3,
  maxPlayers: 12,
  durationMinutes: [10, 30],
  status: 'available',
  theme: { from: '#1a0b2e', via: '#4c1d95', to: '#a855f7', accent: '#c084fc' },
  tags: ['Bluffen', 'Raten', 'Diskutieren'],
};

export const imposterSettingsSchema = z.object({
  rounds: z.number().int().min(1).max(10),
  categories: z.array(z.enum(WORD_CATEGORIES)).min(1),
  difficulties: z.array(z.enum(['leicht', 'mittel', 'schwer'])).min(1),
  /** Hinweisrunden: so oft sagt jede Person ein Wort */
  clueRounds: z.number().int().min(1).max(3),
  discussSeconds: z.number().int().min(20).max(300),
  /** Kategorie ist für alle sichtbar – auch für den Imposter */
  showCategory: z.boolean(),
});
export type ImposterSettings = z.infer<typeof imposterSettingsSchema>;

export const DEFAULT_IMPOSTER_SETTINGS: ImposterSettings = {
  rounds: 3,
  categories: WORD_CATEGORIES.filter((c) => c !== 'Geeker-Vocab'),
  difficulties: ['leicht', 'mittel'],
  clueRounds: 2,
  discussSeconds: 90,
  showCategory: true,
};

export function parseImposterSettings(raw: unknown): ImposterSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<ImposterSettings>;
  return imposterSettingsSchema.parse({ ...DEFAULT_IMPOSTER_SETTINGS, ...obj });
}

export const TIMING = {
  revealSeconds: 45,
  turnSeconds: 30,
  voteSeconds: 45,
  guessSeconds: 30,
  resultSeconds: 12,
} as const;

/** Punkte */
export const POINTS = {
  /** Imposter wird nicht erwischt */
  imposterEscapes: 3,
  /** Imposter wird erwischt, errät aber das Wort */
  imposterGuess: 2,
  /** jede Person aus der Crew, wenn der Imposter erwischt wird */
  crewCatch: 1,
  /** zusätzlich, wer selbst für den Imposter gestimmt hat */
  correctVote: 1,
} as const;
