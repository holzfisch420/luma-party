/**
 * „Echt jetzt?“ – persönliche Sätze ergänzen, Antworten fälschen, die echte erraten.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const ECHT_ID = 'echtjetzt';

export const echtMeta: GameMeta = {
  id: ECHT_ID,
  name: 'Echt jetzt?',
  tagline: 'Wie gut kennst du deine Freunde?',
  description:
    'Reihum ist eine Person dran und ergänzt einen persönlichen Satz ehrlich – alle anderen schreiben eine Fälschung, die nach ihr klingt. Dann wird geraten: Welche Antwort ist echt? Punkte gibt es fürs Durchschauen und fürs Reinlegen.',
  minPlayers: 3,
  maxPlayers: 12,
  durationMinutes: [15, 40],
  status: 'available',
  theme: { from: '#c8874b', via: '#e8b04b', to: '#fff3b0', accent: '#e8590c' },
  tags: ['Bluffen', 'Schreiben', 'Freunde'],
};

/** Platzhalter im Satz */
export const PLACEHOLDER = 'BLUBB';
export const ANSWER_MAX = 60;

export const STATEMENT_SETS = ['klassisch', 'familie', 'arbeit', 'wasware', 'party'] as const;
export type StatementSet = (typeof STATEMENT_SETS)[number];
export const SET_LABELS: Record<StatementSet, { label: string; hint: string }> = {
  klassisch: { label: 'Klassisch', hint: 'Alltag, Kindheit, Essen, Träume' },
  familie: { label: 'Familie & Freunde', hint: 'Zuhause, Geschwister, Freundschaft' },
  arbeit: { label: 'Schule & Arbeit', hint: 'Unterricht, Job, Kollegen' },
  wasware: { label: 'Was wäre wenn', hint: 'Fantasie, Zukunft, Gedankenspiele' },
  party: { label: 'Party', hint: 'Ausgang, Feiern, Flirten – etwas frecher' },
};

export const echtSettingsSchema = z.object({
  /** wie oft jede Person dran ist */
  rounds: z.number().int().min(1).max(3),
  /** Sätze pro Person, wenn sie dran ist */
  perTurn: z.number().int().min(1).max(3),
  writeSeconds: z.number().int().min(30).max(240),
  sets: z.array(z.enum(STATEMENT_SETS)).max(STATEMENT_SETS.length),
  /** eigene Satz-Sammlungen */
  customListIds: z.array(z.string().max(64)).max(20),
});
export type EchtSettings = z.infer<typeof echtSettingsSchema>;

export const DEFAULT_ECHT_SETTINGS: EchtSettings = { rounds: 1, perTurn: 2, writeSeconds: 90, sets: ['klassisch', 'familie', 'wasware'], customListIds: [] };

export function parseEchtSettings(raw: unknown): EchtSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<EchtSettings>;
  return echtSettingsSchema.parse({ ...DEFAULT_ECHT_SETTINGS, ...obj });
}

export const TIMING = { voteSeconds: 50, revealSeconds: 11 } as const;

export const POINTS = {
  /** richtig geraten – bekommt der Ratende und die Person, die dran ist */
  correctGuess: 1,
  /** je Person, die auf die eigene Fälschung hereinfällt */
  fooled: 1,
  /** genau dieselbe Antwort wie die Person, die dran ist */
  exactMatch: 2,
} as const;
