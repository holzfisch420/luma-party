/**
 * Textprobe – Rollentext lernen wie beim Karaoke.
 * Metadaten, Einstellungen und Prüfschema für hochgeladene Skripte (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { LIMITS } from './types';

export const THEATER_ID = 'textprobe';

export const theaterMeta: GameMeta = {
  id: THEATER_ID,
  name: 'Textprobe',
  tagline: 'Rollentext lernen – Zeile für Zeile.',
  description:
    'Lade dein Theaterskript (.docx) hoch, wähle Szene oder Seite und blättere per Handy Zeile für Zeile durch. Der Fernseher zeigt Rolle und Text wie beim Karaoke – die Zeile davor und danach lässt sich zum Üben ausblenden.',
  minPlayers: 1,
  maxPlayers: 12,
  durationMinutes: [10, 60],
  status: 'available',
  theme: { from: '#5b0f1a', via: '#8e1b2c', to: '#c9973b', accent: '#c9973b' },
  tags: ['Theater', 'Lernen', 'Probe'],
};

export const theaterSettingsSchema = z.object({
  scriptId: z.string().max(64),
});
export type TheaterSettings = z.infer<typeof theaterSettingsSchema>;
export const DEFAULT_THEATER_SETTINGS: TheaterSettings = { scriptId: '' };

export function parseTheaterSettings(raw: unknown): TheaterSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<TheaterSettings>;
  return theaterSettingsSchema.parse({ ...DEFAULT_THEATER_SETTINGS, ...obj });
}

const segment = z.object({ k: z.enum(['speech', 'direction']), t: z.string().max(LIMITS.maxSegmentLength) });

/** Prüfschema für hochgeladene (im Browser geparste) Skripte */
export const scriptUploadSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.maxTitle),
  pageCount: z.number().int().min(1).max(5000),
  characters: z.array(z.string().max(80)).max(LIMITS.maxCharacters),
  scenes: z
    .array(z.object({ number: z.number().int().min(0).max(10000), title: z.string().max(LIMITS.maxTitle), start: z.number().int().min(0), page: z.number().int().min(1) }))
    .max(LIMITS.maxScenes),
  lines: z
    .array(
      z.object({
        page: z.number().int().min(1).max(5000),
        scene: z.number().int().min(0).max(10000),
        kind: z.enum(['dialog', 'direction', 'cast']),
        character: z.string().max(200).optional(),
        segments: z.array(segment).min(1).max(LIMITS.maxSegments),
      }),
    )
    .min(1)
    .max(LIMITS.maxLines),
});
export type ScriptUpload = z.infer<typeof scriptUploadSchema>;
