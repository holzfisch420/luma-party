/**
 * „Klingenrad“ – Messer ins drehende Rad werfen, ohne ein anderes zu treffen.
 * Zwei Modi: jede Person für sich auf dem Handy (Stufen) oder alle zusammen am Rad auf dem Fernseher.
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const KLINGEN_ID = 'klingen';

export const klingenMeta: GameMeta = {
  id: KLINGEN_ID,
  name: 'Klingenrad',
  tagline: 'Tippen, werfen, treffen – aber nie ein anderes Messer!',
  description:
    'Ein Rad dreht sich, du wirfst Messer hinein – triffst du ein Messer, das schon steckt, ist es vorbei. Allein auf dem Handy: Wer schafft die meisten Stufen? Oder alle zusammen am großen Rad auf dem Fernseher: Jede Runde ein Messer mehr pro Person.',
  minPlayers: 1,
  maxPlayers: 12,
  durationMinutes: [3, 10],
  status: 'available',
  theme: { from: '#3b1f12', via: '#8a4b24', to: '#f2c14e', accent: '#e8590c' },
  tags: ['Reaktion', 'Geschick', 'Schnell'],
};

export const MODES = ['solo', 'shared'] as const;
export type KlingenMode = (typeof MODES)[number];

export const klingenSettingsSchema = z.object({
  mode: z.enum(MODES),
  /** Einzeln: Leben (Versuche je Spiel) */
  lives: z.number().int().min(1).max(3),
  /** Einzeln: Spielzeit in Minuten */
  minutes: z.number().int().min(1).max(8),
});
export type KlingenSettings = z.infer<typeof klingenSettingsSchema>;

export const DEFAULT_KLINGEN_SETTINGS: KlingenSettings = { mode: 'solo', lives: 2, minutes: 3 };

export function parseKlingenSettings(raw: unknown): KlingenSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<KlingenSettings>;
  return klingenSettingsSchema.parse({ ...DEFAULT_KLINGEN_SETTINGS, ...obj });
}

export const TIMING = {
  countdownMs: 3500,
  roundIntroMs: 3000,
  roundEndMs: 3500,
  /** Flugzeit eines Messers */
  flightMs: 130,
  /** Mindestabstand zwischen zwei Würfen einer Person */
  throwCooldownMs: 220,
  /** falls der Fernseher nicht antwortet */
  resultTimeoutMs: 2500,
} as const;
