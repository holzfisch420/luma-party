import { useState } from 'react';
import { playSfx, ui } from '../../app/audio/sfx';
import { emitWithAck, getSocket } from '../../app/session/socket';
import { getGameMeta } from '../../games/game-catalog';
import type { MenuAction } from '../../games/game-types';
import type { RoomSnapshot } from '../../shared/types/room';
import { useToast } from '../ui/Toast';

/** Warum (noch) nicht gestartet werden kann – null = alles bereit */
export function startBlocker(room: RoomSnapshot, gameId: string): string | null {
  const meta = getGameMeta(gameId);
  if (!meta) return 'Unbekanntes Spiel';
  if (meta.status === 'coming-soon') return 'Bald verfügbar';
  const connected = room.players.filter((p) => p.isConnected).length;
  if (connected < meta.minPlayers) {
    const n = meta.minPlayers - connected;
    return `Noch ${n} ${n === 1 ? 'Person' : 'Personen'} nötig – mit dem Handy beitreten`;
  }
  return null;
}

/** führt Menü-Aktionen aus: Seite wechseln, zurück, starten (optional mit Einstellungs-Änderung) */
export function useMenuActions(room: RoomSnapshot, gameId: string) {
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const blocked = startBlocker(room, gameId);

  const run = async (action: MenuAction) => {
    const s = getSocket();
    if (action.kind === 'view') {
      ui.open();
      s.emit('room:menuView', { view: action.view });
      return;
    }
    if (action.kind === 'back') {
      ui.back();
      if (room.menu && room.menu.view !== 'title') s.emit('room:menuView', { view: 'title' });
      else s.emit('room:closeMenu');
      return;
    }
    if (blocked) {
      ui.error();
      toast(blocked, 'error');
      return;
    }
    if (starting) return;
    setStarting(true);
    playSfx('start');
    try {
      if (action.patch) {
        const current = (room.gameSettings[gameId] ?? {}) as Record<string, unknown>;
        await emitWithAck('room:updateSettings', { gameId, settings: { ...current, ...action.patch } });
      }
      await emitWithAck('room:startGame');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setStarting(false);
    }
  };
  return { run, starting, blocked };
}
