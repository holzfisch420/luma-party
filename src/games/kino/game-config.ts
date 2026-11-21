/**
 * „Couch-Match“ – Film- und Serien-Tinder für den gemeinsamen Abend.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { GENRE_IDS, type Genre } from './data/genres';

export const KINO_ID = 'kino';

export const kinoMeta: GameMeta = {
  id: KINO_ID,
  name: 'Couch-Match',
  tagline: 'Wischt euch zum perfekten Filmabend.',
  description:
    'Alle bekommen dieselben 25 Filme oder Serien in zufälliger Reihenfolge aufs Handy und wischen nach rechts (will ich sehen) oder links (lieber nicht). Am Ende zeigt der Fernseher, worauf ihr euch am meisten einigen könnt.',
  minPlayers: 1,
  maxPlayers: 12,
  durationMinutes: [3, 10],
  status: 'available',
  theme: { from: '#3b0a2a', via: '#a61e4d', to: '#ff8787', accent: '#ff4d6d' },
  tags: ['Filmabend', 'Entscheiden', 'Alle gleichzeitig'],
};

export const DECK_SIZE = 25;

export const kinoSettingsSchema = z.object({
  type: z.enum(['beide', 'film', 'serie']),
  /** leer = alle Genres */
  genres: z.array(z.enum(GENRE_IDS as [Genre, ...Genre[]])).max(GENRE_IDS.length),
});
export type KinoSettings = z.infer<typeof kinoSettingsSchema>;

export const DEFAULT_KINO_SETTINGS: KinoSettings = { type: 'beide', genres: [] };

export function parseKinoSettings(raw: unknown): KinoSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<KinoSettings>;
  return kinoSettingsSchema.parse({ ...DEFAULT_KINO_SETTINGS, ...obj });
}
