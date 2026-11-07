/**
 * Metadaten aller Spiele, die im Launcher erscheinen – frei von React und Server-Code.
 * Neues Spiel: Meta hier eintragen (bzw. aus dem Modul importieren).
 */
import type { GameMeta } from '../shared/types/game';
import { montagsmalerMeta } from './montagsmaler/game-config';
import { panzerMeta } from './panzer/game-config';
import { theaterMeta } from './theater/game-config';
import { imposterMeta } from './imposter/game-config';
import { FUTURE_GAMES } from './future-games/catalog';

export const GAME_CATALOG: GameMeta[] = [montagsmalerMeta, imposterMeta, panzerMeta, theaterMeta, ...FUTURE_GAMES];

export const DEFAULT_GAME_ID = montagsmalerMeta.id;

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_CATALOG.find((g) => g.id === id);
}
