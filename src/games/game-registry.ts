/**
 * Client-Registry spielbarer Spiele.
 * Neues Spiel hinzufügen = Modul importieren und hier eintragen.
 */
import type { GameMeta } from '../shared/types/game';
import { GAME_CATALOG } from './game-catalog';
import type { ClientGameModule } from './game-types';
import { montagsmalerModule } from './montagsmaler';
import { panzerModule } from './panzer';
import { theaterModule } from './theater';
import { imposterModule } from './imposter';
import { huhnModule } from './huhn';
import { echtModule } from './echt';
import { racerModule } from './racer';
import { ploppModule } from './plopp';
import { wortModule } from './wort';

const modules = new Map<string, ClientGameModule>();

export function registerClientGame(module: ClientGameModule) {
  modules.set(module.meta.id, module);
}

registerClientGame(montagsmalerModule);
registerClientGame(panzerModule);
registerClientGame(theaterModule);
registerClientGame(imposterModule);
registerClientGame(huhnModule);
registerClientGame(echtModule);
registerClientGame(racerModule);
registerClientGame(ploppModule);
registerClientGame(wortModule);

export function getClientGame(id: string | null | undefined): ClientGameModule | undefined {
  return id ? modules.get(id) : undefined;
}

/** alle Spiele für den Launcher (verfügbare zuerst) */
export function listLauncherGames(): GameMeta[] {
  return [...GAME_CATALOG].sort((a, b) => Number(a.status === 'coming-soon') - Number(b.status === 'coming-soon'));
}
