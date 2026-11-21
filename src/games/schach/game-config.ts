/**
 * „Schach“ – klassisches Schach zu zweit mit Bedenkzeit, Brett auf Fernseher und Handy.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const SCHACH_ID = 'schach';

export const schachMeta: GameMeta = {
  id: SCHACH_ID,
  name: 'Schach',
  tagline: 'Zwei am Brett, alle schauen zu – mit Schachuhr.',
  description:
    'Klassisches Schach zu zweit: Jede Person zieht auf dem eigenen Handy, das große Brett mit Uhren, geschlagenen Figuren und Zugliste läuft auf dem Fernseher. Alle anderen schauen zu und dürfen anfeuern.',
  minPlayers: 2,
  maxPlayers: 12,
  durationMinutes: [5, 40],
  status: 'available',
  theme: { from: '#2f3a24', via: '#4f6b3a', to: '#a9c27a', accent: '#81b64c' },
  tags: ['Strategie', 'Zu zweit', 'Klassiker'],
};

/** Bedenkzeit: Minuten + Sekunden Zuschlag pro Zug (0 Minuten = ohne Uhr) */
export const TIME_CONTROLS = ['1+0', '3+2', '5+0', '10+0', '15+10', '0+0'] as const;
export type TimeControl = (typeof TIME_CONTROLS)[number];
export const TIME_LABELS: Record<TimeControl, string> = {
  '1+0': 'Bullet 1 min',
  '3+2': 'Blitz 3+2',
  '5+0': 'Blitz 5 min',
  '10+0': 'Schnell 10 min',
  '15+10': 'Schnell 15+10',
  '0+0': 'Ohne Uhr',
};

export function parseTimeControl(tc: TimeControl): { baseMs: number; incMs: number } {
  const [m, s] = tc.split('+').map(Number) as [number, number];
  return { baseMs: m * 60_000, incMs: s * 1000 };
}

export const schachSettingsSchema = z.object({
  time: z.enum(TIME_CONTROLS),
  /** wer Weiß spielt: zufällig oder die zuerst beigetretene Person */
  colors: z.enum(['random', 'first-white']),
});
export type SchachSettings = z.infer<typeof schachSettingsSchema>;

export const DEFAULT_SCHACH_SETTINGS: SchachSettings = { time: '5+0', colors: 'random' };

export function parseSchachSettings(raw: unknown): SchachSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<SchachSettings>;
  return schachSettingsSchema.parse({ ...DEFAULT_SCHACH_SETTINGS, ...obj });
}

/** Endstellung so lange zeigen, bevor die Rangliste kommt */
export const END_SHOW_MS = 7000;
