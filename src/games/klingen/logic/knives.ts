/** Die 16 Messer zur Auswahl (nur Daten – gezeichnet wird in components/knife-skins.ts). */
export const KNIFE_SKINS = [
  { name: 'Klassiker', emoji: '🔪' },
  { name: 'Hackebeil', emoji: '🪓' },
  { name: 'Goldener Dolch', emoji: '🗡️' },
  { name: 'Katana', emoji: '⚔️' },
  { name: 'Kunai', emoji: '🥷' },
  { name: 'Jägermesser', emoji: '🏹' },
  { name: 'Krummsäbel', emoji: '🌙' },
  { name: 'Eiszapfen', emoji: '🧊' },
  { name: 'Karotte', emoji: '🥕' },
  { name: 'Bleistift', emoji: '✏️' },
  { name: 'Blitz', emoji: '⚡' },
  { name: 'Knochen', emoji: '🦴' },
  { name: 'Zuckerstange', emoji: '🍬' },
  { name: 'Schreibfeder', emoji: '🪶' },
  { name: 'Kristall', emoji: '💎' },
  { name: 'Laserklinge', emoji: '🔦' },
] as const;

export const KNIFE_COUNT = KNIFE_SKINS.length;
/** Sonderwert: vorgegebenes Hindernis-Messer */
export const OBSTACLE_SKIN = -1;

export function validSkin(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < KNIFE_COUNT ? n : null;
}
