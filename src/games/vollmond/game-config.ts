/**
 * „Vollmond“ – Werwolf-Gruppenspiel: geheime Rollen aufs Handy, nachts handeln, tagsüber
 * diskutieren, lügen, beschuldigen und abstimmen. Das Spiel passiert im Gespräch.
 */
import { z } from 'zod';
import type { GameMeta } from '../../shared/types/game';

export const VOLLMOND_ID = 'vollmond';

export const vollmondMeta: GameMeta = {
  id: VOLLMOND_ID,
  name: 'Vollmond',
  tagline: 'Wer von euch ist ein Werwolf? Lügen erlaubt.',
  description:
    'Jede Person bekommt heimlich eine Rolle aufs Handy. Nachts schlagen die Werwölfe zu, Seherin, Hexe und Leibwächter helfen im Verborgenen. Tagsüber diskutiert das Dorf, beschuldigt, lügt und stimmt ab, wer verbannt wird. Der Fernseher erzählt.',
  minPlayers: 4,
  maxPlayers: 16,
  durationMinutes: [15, 45],
  status: 'available',
  theme: { from: '#0b1026', via: '#2a2f5c', to: '#c9d3ff', accent: '#e8c25b' },
  tags: ['Bluffen', 'Diskutieren', 'Geheime Rollen'],
};

export const ROLES = ['werwolf', 'dorf', 'seherin', 'hexe', 'jaeger', 'leibwaechter'] as const;
export type Role = (typeof ROLES)[number];
export const SPECIAL_ROLES = ['seherin', 'hexe', 'jaeger', 'leibwaechter'] as const;
export type SpecialRole = (typeof SPECIAL_ROLES)[number];

export const ROLE_INFO: Record<Role, { name: string; emoji: string; team: 'wolf' | 'dorf'; text: string }> = {
  werwolf: { name: 'Werwolf', emoji: '🐺', team: 'wolf', text: 'Nachts wählt ihr Werwölfe gemeinsam ein Opfer. Tagsüber tust du so, als wärst du harmlos – lüg, lenk ab, beschuldige andere.' },
  dorf: { name: 'Dorfbewohner', emoji: '🧑‍🌾', team: 'dorf', text: 'Du hast keine besondere Fähigkeit – nur deinen Verstand. Finde heraus, wer lügt, und stimme die Werwölfe raus.' },
  seherin: { name: 'Seherin', emoji: '🔮', team: 'dorf', text: 'Jede Nacht siehst du von einer Person, ob sie ein Werwolf ist. Verrate dich nicht zu früh – sonst holen dich die Wölfe.' },
  hexe: { name: 'Hexe', emoji: '🧪', team: 'dorf', text: 'Du erfährst nachts das Opfer der Werwölfe. Einmal im Spiel darfst du heilen, einmal vergiften.' },
  jaeger: { name: 'Jäger', emoji: '🏹', team: 'dorf', text: 'Wenn du stirbst, nimmst du mit deinem letzten Schuss eine Person deiner Wahl mit.' },
  leibwaechter: { name: 'Leibwächter', emoji: '🛡️', team: 'dorf', text: 'Jede Nacht beschützt du eine Person vor den Werwölfen – aber nie zweimal hintereinander dieselbe.' },
};

export const vollmondSettingsSchema = z.object({
  /** 0 = automatisch nach Spielerzahl */
  wolves: z.number().int().min(0).max(4),
  specials: z.array(z.enum(SPECIAL_ROLES)).max(SPECIAL_ROLES.length),
  /** Diskussionszeit in Sekunden */
  talkSeconds: z.number().int().min(60).max(600),
  /** Rolle von Toten aufdecken */
  revealDead: z.boolean(),
});
export type VollmondSettings = z.infer<typeof vollmondSettingsSchema>;

export const DEFAULT_VOLLMOND_SETTINGS: VollmondSettings = {
  wolves: 0,
  specials: ['seherin', 'hexe', 'jaeger', 'leibwaechter'],
  talkSeconds: 180,
  revealDead: true,
};

export function parseVollmondSettings(raw: unknown): VollmondSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<VollmondSettings>;
  return vollmondSettingsSchema.parse({ ...DEFAULT_VOLLMOND_SETTINGS, ...obj });
}

/** Werwölfe bei automatischer Wahl */
export function autoWolves(n: number): number {
  if (n <= 6) return 1;
  if (n <= 9) return 2;
  if (n <= 13) return 3;
  return 4;
}

/** ab wie vielen Spielern eine Sonderrolle dabei ist */
export const SPECIAL_MIN_PLAYERS: Record<SpecialRole, number> = { seherin: 4, hexe: 6, jaeger: 6, leibwaechter: 7 };

export const TIMING = {
  rolesMs: 30_000,
  nightMs: 50_000,
  witchMs: 30_000,
  morningMs: 7_000,
  hunterMs: 30_000,
  voteMs: 60_000,
  verdictMs: 7_000,
} as const;
