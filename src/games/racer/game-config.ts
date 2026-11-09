/**
 * Kurvenrausch – Metadaten, Einstellungen, Fahrphysik (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { TRACK_IDS } from './tracks';

export const RACER_ID = 'kurvenrausch';

export const racerMeta: GameMeta = {
  id: RACER_ID,
  name: 'Kurvenrausch',
  tagline: 'Low-Poly-Rennen im Splitscreen.',
  description:
    'Bis zu 8 Autos auf eigenen Low-Poly-Strecken: Rundkurse, Sprints, Brücken und Klippen ohne Bande. Gelenkt wird mit dem Handy – per Neigen wie ein Lenkrad oder klassisch mit Joystick, Gas und Bremse.',
  minPlayers: 1,
  maxPlayers: 8,
  durationMinutes: [5, 20],
  status: 'available',
  theme: { from: '#3ec1f3', via: '#7c5cff', to: '#ff5c8d', accent: '#7c5cff' },
  tags: ['Rennen', 'Splitscreen', 'Gyro'],
};

export const MAX_CARS = 8;

export const CAR_COLORS = [
  { name: 'Rot', hex: '#ef4444' },
  { name: 'Blau', hex: '#3b82f6' },
  { name: 'Gelb', hex: '#facc15' },
  { name: 'Grün', hex: '#22c55e' },
  { name: 'Lila', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Türkis', hex: '#14b8a6' },
  { name: 'Pink', hex: '#ec4899' },
] as const;

export const racerSettingsSchema = z.object({
  races: z.number().int().min(1).max(8),
  /** leer = alle Strecken */
  tracks: z.array(z.enum(TRACK_IDS)).max(TRACK_IDS.length),
  trackMode: z.enum(['rotation', 'random']),
  /** Splitscreen (jede Person eigene Ansicht) oder eine gemeinsame Kamera */
  view: z.enum(['split', 'shared']),
  collisions: z.boolean(),
});
export type RacerSettings = z.infer<typeof racerSettingsSchema>;

export const DEFAULT_RACER_SETTINGS: RacerSettings = { races: 3, tracks: [], trackMode: 'rotation', view: 'split', collisions: true };

export function parseRacerSettings(raw: unknown): RacerSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<RacerSettings>;
  return racerSettingsSchema.parse({ ...DEFAULT_RACER_SETTINGS, ...obj });
}

/** Fahrphysik (Meter, Sekunden) */
export const CAR = {
  tickHz: 60,
  frameHz: 30,
  maxSpeed: 44,
  boostSpeed: 60,
  accel: 21,
  brake: 32,
  reverseMax: 11,
  drag: 0.012,
  rolling: 1.2,
  /** Lenkrate (rad/s) bei mittlerer Geschwindigkeit */
  steerRate: 2.1,
  /** Seitenhaftung – je höher, desto weniger Rutschen */
  grip: 7.5,
  driftGrip: 2.6,
  radius: 1.15,
  /** Schwerkraft entlang der Steigung */
  slopeGravity: 9.8,
  fallRespawnS: 1.4,
} as const;

export const TIMING = { introMs: 4500, countdownMs: 3200, finishGraceMs: 25_000, resultsMs: 9000, maxRaceMs: 6 * 60_000 } as const;

/** Punkte je Platz */
export const PLACE_POINTS = [10, 8, 6, 5, 4, 3, 2, 1] as const;
