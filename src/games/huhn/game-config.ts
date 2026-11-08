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
  tagline: 'Boden, Decke, Boden – lauf, Huhn!',
  description:
    'Bis zu 8 Hühner flüchten gemeinsam vor der Polizei. Mit einem Knopf auf dem Handy wechselst du zwischen Boden und Decke – fall nicht in die Lücken, lass dich nicht abhängen und schubs die anderen aus dem Weg. Wer zuletzt noch frei ist, gewinnt.',
  minPlayers: 1,
  maxPlayers: 8,
  durationMinutes: [5, 15],
  status: 'available',
  theme: { from: '#ffd23f', via: '#ff8c42', to: '#1d4ed8', accent: '#ff8c42' },
  tags: ['Action', 'Schwerkraft', 'Ein Knopf'],
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

/** Physik (Einheiten: Kacheln, Sekunden; y zeigt nach unten) */
export const PHYS = {
  tickHz: 60,
  frameHz: 20,
  gravity: 42,
  maxFall: 17,
  /** Hühnchen-Kasten */
  size: 0.7,
  /** hier läuft die Gruppe (Abstand zum linken Bildrand) */
  anchor: 8.5,
  /** so schnell holt ein zurückgefallenes Huhn wieder auf */
  catchUp: 2.4,
  /** Umschalt-Puffer und „Coyote-Time“ nach dem Verlassen einer Kante */
  flipBuffer: 0.15,
  coyote: 0.08,
  /** links von hier schnappt die Polizei zu */
  policeX: 0.55,
} as const;

export const TIMING = { countdownMs: 3500, roundEndMs: 5000, lastCatchMs: 1400 } as const;
