/**
 * Metadaten aller Spiele, die im Launcher erscheinen – frei von React und Server-Code.
 * Neues Spiel: Meta hier eintragen (bzw. aus dem Modul importieren).
 */
import type { GameMeta } from '../shared/types/game';
import { montagsmalerMeta } from './montagsmaler/game-config';
import { panzerMeta } from './panzer/game-config';
import { theaterMeta } from './theater/game-config';
import { imposterMeta } from './imposter/game-config';
import { huhnMeta } from './huhn/game-config';
import { echtMeta } from './echt/game-config';
import { racerMeta } from './racer/game-config';

export const GAME_CATALOG: GameMeta[] = [montagsmalerMeta, imposterMeta, echtMeta, racerMeta, huhnMeta, panzerMeta, theaterMeta];

export const DEFAULT_GAME_ID = montagsmalerMeta.id;

export function getGameMeta(id: string): GameMeta | undefined {
  return GAME_CATALOG.find((g) => g.id === id);
}
