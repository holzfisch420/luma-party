/**
 * „Mühle“ – Neunsteinmühle zu zweit.
 * Metadaten und Einstellungen (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const MUEHLE_ID = 'muehle';

export const muehleMeta: GameMeta = {
  id: MUEHLE_ID,
  name: 'Mühle',
  tagline: 'Neun Steine, drei in einer Reihe – und weg ist einer!',
  description:
    'Die klassische Neunsteinmühle zu zweit: Erst setzt ihr abwechselnd eure neun Steine, dann wird gezogen. Drei in einer Reihe ergeben eine Mühle – und du darfst einen gegnerischen Stein wegnehmen. Wer nur noch zwei Steine hat oder nicht mehr ziehen kann, verliert.',
  minPlayers: 2,
  maxPlayers: 12,
  durationMinutes: [5, 20],
  status: 'available',
  theme: { from: '#3d2414', via: '#7a4a24', to: '#d9a95f', accent: '#e8b84a' },
  tags: ['Strategie', 'Zu zweit', 'Klassiker'],
};

export const muehleSettingsSchema = z.object({
  /** mit drei Steinen darf man auf jedes freie Feld springen */
  flying: z.boolean(),
  colors: z.enum(['random', 'first-white']),
});
export type MuehleSettings = z.infer<typeof muehleSettingsSchema>;

export const DEFAULT_MUEHLE_SETTINGS: MuehleSettings = { flying: true, colors: 'random' };

export function parseMuehleSettings(raw: unknown): MuehleSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<MuehleSettings>;
  return muehleSettingsSchema.parse({ ...DEFAULT_MUEHLE_SETTINGS, ...obj });
}

export const END_SHOW_MS = 6000;
