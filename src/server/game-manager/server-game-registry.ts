/**
 * Serverseitige Registrierung spielbarer Spiele.
 * Ein neues Spiel wird hier mit seinem ServerGameModule eingetragen – sonst nirgendwo.
 */
import type { ServerGameModule } from '../game-engine/types';
import { montagsmalerServerModule } from '../../games/montagsmaler/game-engine';
import { panzerServerModule } from '../../games/panzer/game-engine';

const modules = new Map<string, ServerGameModule<any>>();

export function registerServerGame(module: ServerGameModule<any>): void {
  if (modules.has(module.meta.id)) throw new Error(`Spiel ${module.meta.id} ist bereits registriert`);
  modules.set(module.meta.id, module);
}

export function getServerGame(id: string): ServerGameModule<unknown> | undefined {
  return modules.get(id);
}

export function listServerGames(): ServerGameModule<unknown>[] {
  return [...modules.values()];
}

registerServerGame(montagsmalerServerModule);
registerServerGame(panzerServerModule);
