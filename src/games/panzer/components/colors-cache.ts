/** Merkt sich die Panzerfarben der letzten Partie (für die Rangliste nach Spielende). */
const cache = new Map<string, number>();
export const panzerColorCache = {
  set(players: { playerId: string; color: number }[]) {
    for (const p of players) cache.set(p.playerId, p.color);
  },
  get(playerId: string): number | undefined {
    return cache.get(playerId);
  },
};
