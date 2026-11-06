/**
 * Kettenchaos – Panzer-Arena für bis zu 8 Spieler.
 * Metadaten, Einstellungen, Farben, Power-ups und Spielkonstanten (Client + Server).
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const PANZER_ID = 'kettenchaos';

export const panzerMeta: GameMeta = {
  id: PANZER_ID,
  name: 'Kettenchaos',
  tagline: 'Zielen. Abprallen. Überleben.',
  description:
    'Wilde Panzer-Arena für bis zu 8 Spieler: Kugeln prallen von den Wänden ab, Power-ups verändern alles – der letzte Panzer gewinnt die Runde. Das Handy wird quer gehalten und zum Gamepad.',
  minPlayers: 2,
  maxPlayers: 8,
  durationMinutes: [5, 15],
  status: 'available',
  theme: { from: '#f6c453', via: '#e8873a', to: '#7a4b2a', accent: '#e8873a' },
  tags: ['Action', 'Arena', 'Gamepad'],
};

/** 16 Panzerfarben zur Auswahl */
export const TANK_COLORS = [
  { name: 'Rot', hex: '#e53935' },
  { name: 'Orange', hex: '#fb8c00' },
  { name: 'Gelb', hex: '#fdd835' },
  { name: 'Limette', hex: '#9ccc3c' },
  { name: 'Grün', hex: '#2e9d4f' },
  { name: 'Türkis', hex: '#1abc9c' },
  { name: 'Hellblau', hex: '#4fc3f7' },
  { name: 'Blau', hex: '#1e63c6' },
  { name: 'Lila', hex: '#7e57c2' },
  { name: 'Pink', hex: '#ec407a' },
  { name: 'Rosa', hex: '#f8a5c2' },
  { name: 'Braun', hex: '#8d5a36' },
  { name: 'Oliv', hex: '#7c8a32' },
  { name: 'Grau', hex: '#8a939d' },
  { name: 'Weiß', hex: '#f2f2f2' },
  { name: 'Schwarz', hex: '#3a3a3a' },
] as const;

export type PowerId = 'laser' | 'shotgun' | 'missile' | 'mine' | 'shield' | 'machinegun' | 'frag' | 'cloak';

export const POWERUPS: Record<PowerId, { name: string; icon: string; color: string; hint: string }> = {
  laser: { name: 'Laser', icon: '⚡', color: '#e53935', hint: 'Sofort-Strahl, prallt 3× ab' },
  shotgun: { name: 'Schrot', icon: '💥', color: '#fb8c00', hint: '7 Kugeln im Fächer' },
  missile: { name: 'Lenkrakete', icon: '🚀', color: '#7e57c2', hint: 'Verfolgt den nächsten Gegner' },
  mine: { name: 'Mine', icon: '💣', color: '#3a3a3a', hint: 'Wird abgelegt, scharf nach 1 s' },
  shield: { name: 'Schild', icon: '🛡️', color: '#1e88e5', hint: 'Hält einen Treffer ab (8 s)' },
  machinegun: { name: 'Dauerfeuer', icon: '🔥', color: '#f4511e', hint: '14 schnelle Schüsse' },
  frag: { name: 'Splitterbombe', icon: '✴️', color: '#43a047', hint: 'Zerplatzt in 16 Splitter' },
  cloak: { name: 'Tarnkappe', icon: '👻', color: '#90a4ae', hint: '7 s fast unsichtbar' },
};
export const POWER_IDS = Object.keys(POWERUPS) as PowerId[];

/** Tasten (Bitmaske) */
export const BTN = { fire: 1, special: 2, turbo: 4, honk: 8 } as const;

/** Spielkonstanten (Einheiten: Kacheln, Sekunden) */
export const PHYS = {
  tickHz: 60,
  frameHz: 20,
  tankRadius: 0.32,
  tankSpeed: 3.0,
  tankTurn: 3.4,
  turboFactor: 1.9,
  turboSeconds: 0.7,
  turboCooldown: 4,
  fireCooldown: 0.28,
  maxShells: 5,
  shellSpeed: 5.6,
  shellRadius: 0.08,
  shellLife: 7,
  selfHitGrace: 0.12,
  crateRadius: 0.34,
  maxCrates: 3,
} as const;

export const PHASE_SECONDS = {
  colors: 30,
  countdown: 3,
  /** nach dem vorletzten Abschuss: kurze Gnadenfrist */
  lastStanding: 2.5,
  roundEnd: 3.5,
} as const;

export const panzerSettingsSchema = z.object({
  winScore: z.number().int().min(1).max(15),
  mapMode: z.enum(['random', 'rotation']),
  /** leer = alle Arenen */
  maps: z.array(z.string().max(32)).max(40),
  powerups: z.enum(['off', 'few', 'normal', 'many']),
});
export type PanzerSettings = z.infer<typeof panzerSettingsSchema>;

export const DEFAULT_PANZER_SETTINGS: PanzerSettings = {
  winScore: 5,
  mapMode: 'random',
  maps: [],
  powerups: 'normal',
};

export function parsePanzerSettings(raw: unknown): PanzerSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<PanzerSettings>;
  return panzerSettingsSchema.parse({ ...DEFAULT_PANZER_SETTINGS, ...obj });
}

/** Sekunden zwischen Power-up-Kisten */
export const POWERUP_INTERVAL: Record<PanzerSettings['powerups'], number> = { off: Infinity, few: 12, normal: 7, many: 3.5 };
