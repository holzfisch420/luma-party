/** Bestwerte der Warte-Minispiele – nur auf diesem Handy gespeichert. */
const KEY = 'luma.arcade';

export type ArcadeGame = 'flap' | 'snake' | 'mines';

function read(): Partial<Record<ArcadeGame, number>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<ArcadeGame, number>>;
  } catch {
    return {};
  }
}

export function getBest(game: ArcadeGame): number {
  return read()[game] ?? 0;
}

/** speichert, wenn besser – `lowerIsBetter` für Zeiten (Minensuche) */
export function submitScore(game: ArcadeGame, value: number, lowerIsBetter = false): boolean {
  const all = read();
  const old = all[game];
  const better = lowerIsBetter ? old === undefined || old <= 0 || value < old : value > (old ?? 0);
  if (!better) return false;
  all[game] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* privat-Modus */
  }
  return true;
}
