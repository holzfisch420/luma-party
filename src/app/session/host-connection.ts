import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../shared/constants';
import type { HostSessionData } from '../../shared/events';
import { sessionStore, useSession } from './session-store';
import { emitWithAck, getSocket } from './socket';

const settingsKey = (gameId: string) => `luma.settings.${gameId}`;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher nicht verfügbar – ignorieren */
  }
}

async function createRoom(): Promise<HostSessionData> {
  const data = await emitWithAck<HostSessionData>('host:create');
  writeJson(STORAGE_KEYS.hostSession, data);
  // zuletzt verwendete Spieleinstellungen wiederherstellen
  const room = sessionStore.get().room;
  for (const gameId of Object.keys(room?.gameSettings ?? {})) {
    const saved = readJson(settingsKey(gameId));
    if (saved) await emitWithAck('room:updateSettings', { gameId, settings: saved }).catch(() => {});
  }
  return data;
}

/**
 * Verbindet den Hauptbildschirm: bestehenden Raum fortsetzen (z. B. nach Neuladen
 * oder Verbindungsabbruch) oder einen neuen Raum erstellen.
 */
export function useHostConnection() {
  const [error, setError] = useState<string | null>(null);
  const room = useSession((s) => s.room);
  const ended = useSession((s) => s.ended);

  useEffect(() => {
    const socket = getSocket();
    let busy = false;
    const establish = async () => {
      if (busy) return;
      busy = true;
      try {
        const saved = readJson<HostSessionData>(STORAGE_KEYS.hostSession);
        if (saved) {
          try {
            await emitWithAck('host:resume', saved);
            setError(null);
            return;
          } catch {
            writeJson(STORAGE_KEYS.hostSession, null);
          }
        }
        await createRoom();
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        busy = false;
      }
    };
    socket.on('connect', establish);
    if (socket.connected) void establish();
    return () => {
      socket.off('connect', establish);
    };
  }, []);

  // Einstellungen merken, damit der nächste Raum sie übernimmt
  useEffect(() => {
    if (!room) return;
    for (const [gameId, settings] of Object.entries(room.gameSettings)) writeJson(settingsKey(gameId), settings);
  }, [room?.gameSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  const resume = async () => {
    const saved = readJson<HostSessionData>(STORAGE_KEYS.hostSession);
    try {
      if (saved) await emitWithAck('host:resume', saved);
      else await createRoom();
    } catch {
      await createRoom();
    }
  };

  const newRoom = async () => {
    getSocket().emit('host:closeRoom');
    writeJson(STORAGE_KEYS.hostSession, null);
    sessionStore.reset();
    await createRoom();
  };

  return { error, ended, resume, newRoom };
}
