/**
 * Merkt sich das zuletzt empfangene Skript. Das Skript kommt als einmaliges Ereignis –
 * oft bevor die Spielansicht eingeblendet ist –, deshalb wird es hier global abgefangen.
 */
import { useSyncExternalStore } from 'react';
import { sessionStore } from '../../app/session/session-store';
import { TH_EVENTS, type Script } from './types';

let current: Script | null = null;
const listeners = new Set<() => void>();

sessionStore.onGameEvent(TH_EVENTS.script, (payload) => {
  current = payload as Script;
  listeners.forEach((l) => l());
});

export function useScript(id: string | undefined): Script | null {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => current,
  );
  return s && s.id === id ? s : null;
}
