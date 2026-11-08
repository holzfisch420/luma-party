/**
 * Hühnerjagd – Metadaten, Einstellungen, Physik (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';
import { MAP_IDS } from './maps';

export const HUHN_ID = 'huehnerjagd';

export const huhnMeta: GameMeta = {
  id: HUHN_ID,
  name: 'Hühnerjagd',
  tagline: 'Spring, Huhn, spring!',
  description:
    'Bis zu 8 Hühner sind auf der Flucht – jedes auf seiner eigenen Spur. Mit einem Knopf auf dem Handy springst du über Polizisten, Polizeihunde und Streifenwagen. Wer zuletzt noch frei ist, gewinnt die Runde.',
  minPlayers: 1,
  maxPlayers: 8,
  durationMinutes: [5, 15],
  status: 'available',
  theme: { from: '#ffd23f', via: '#ff8c42', to: '#1d4ed8', accent: '#ff8c42' },
  tags: ['Action', 'Reaktion', 'Ein Knopf'],
};

export const MAX_CHICKENS = 8;

/** Gefiederfarben je Startplatz */
export const CHICKEN_COLORS = [
  { name: 'Weiß', body: '#fbf7ee', dark: '#d9cfbb' },
  { name: 'Gold', body: '#ffcf4a', dark: '#d9a21c' },
  { name: 'Braun', body: '#b97a45', dark: '#8b5527' },
  { name: 'Rosa', body: '#ff9ec7', dark: '#e0709f' },
  { name: 'Mint', body: '#7ee0b5', dark: '#46b688' },
  { name: 'Himmel', body: '#7cc4ff', dark: '#4b97d6' },
  { name: 'Lila', body: '#c39bff', dark: '#9168dc' },
  { name: 'Schwarz', body: '#4b4b55', dark: '#2c2c33' },
] as const;

export const huhnSettingsSchema = z.object({
  rounds: z.number().int().min(1).max(10),
  /** leer = alle Strecken */
  maps: z.array(z.enum(MAP_IDS)).max(MAP_IDS.length),
  mapMode: z.enum(['rotation', 'random']),
});
export type HuhnSettings = z.infer<typeof huhnSettingsSchema>;

export const DEFAULT_HUHN_SETTINGS: HuhnSettings = { rounds: 5, maps: [], mapMode: 'rotation' };

export function parseHuhnSettings(raw: unknown): HuhnSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<HuhnSettings>;
  return huhnSettingsSchema.parse({ ...DEFAULT_HUHN_SETTINGS, ...obj });
}

/** Physik (Einheiten: Spurhöhen, Sekunden) */
export const PHYS = {
  tickHz: 60,
  frameHz: 20,
  gravity: 32,
  jumpV: 10,
  /** solange gehalten wird, fällt die Schwerkraft geringer aus (höherer Sprung) */
  holdGravity: 17,
  holdMax: 0.18,
  /** Sprung-Puffer: kurz vor der Landung gedrückt zählt trotzdem */
  jumpBuffer: 0.12,
  chickenHalfW: 0.27,
  chickenH: 0.7,
  /** ab hier werden Hindernisse erzeugt (vor dem Huhn) */
  spawnDist: 46,
  /** Schonfrist zu Rundenbeginn */
  graceSeconds: 2.4,
  /** nach so vielen Sekunden wird es enger */
  rushAfter: 70,
} as const;

export const TIMING = { countdownMs: 3500, roundEndMs: 5000, lastCatchMs: 1400 } as const;
