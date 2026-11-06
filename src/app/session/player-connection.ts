import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../shared/constants';
import type { PlayerSessionData } from '../../shared/events';
import { sessionStore } from './session-store';
import { emitWithAck, getSocket } from './socket';

function readSession(): PlayerSessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.playerSession);
    return raw ? (JSON.parse(raw) as PlayerSessionData) : null;
  } catch {
    return null;
  }
}
function writeSession(data: PlayerSessionData | null) {
  try {
    if (data) localStorage.setItem(STORAGE_KEYS.playerSession, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_KEYS.playerSession);
  } catch {
    /* ignorieren */
  }
}

export type PlayerConnState = 'checking' | 'needs-join' | 'joined';

/**
 * Smartphone-Verbindung: setzt eine gespeicherte Sitzung nach Neuladen oder
 * Verbindungsabbruch automatisch fort (Token-basiert).
 */
export function usePlayerConnection() {
  const [state, setState] = useState<PlayerConnState>(() => (readSession() ? 'checking' : 'needs-join'));
  const [session, setSession] = useState<PlayerSessionData | null>(readSession);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = async () => {
      const saved = readSession();
      if (!saved) return setState('needs-join');
      try {
        const data = await emitWithAck<PlayerSessionData>('player:resume', { code: saved.code, token: saved.token });
        writeSession(data);
        setSession(data);
        setState('joined');
        setResumeError(null);
      } catch (e) {
        writeSession(null);
        setSession(null);
        setResumeError((e as Error).message);
        setState('needs-join');
      }
    };
    socket.on('connect', onConnect);
    if (socket.connected) void onConnect();
    return () => {
      socket.off('connect', onConnect);
    };
  }, []);

  const join = useCallback(async (code: string, name: string, authToken?: string | null) => {
    const data = await emitWithAck<PlayerSessionData>('player:join', { code, name, authToken: authToken ?? null });
    writeSession(data);
    try {
      localStorage.setItem(STORAGE_KEYS.playerName, name);
    } catch {
      /* ignorieren */
    }
    setSession(data);
    setState('joined');
    setResumeError(null);
  }, []);

  const leave = useCallback(() => {
    getSocket().emit('player:leave');
    writeSession(null);
    setSession(null);
    sessionStore.reset();
    setState('needs-join');
  }, []);

  /** nach serverseitigem Ende (z. B. Raum geschlossen) lokale Sitzung verwerfen */
  const forget = useCallback(() => {
    writeSession(null);
    setSession(null);
    sessionStore.reset();
    setState('needs-join');
  }, []);

  return { state, session, join, leave, forget, resumeError };
}
