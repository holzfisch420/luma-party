/**
 * Clientseitiger Session-Store (Raum, Spielzustand, Verbindung).
 * Bewusst ohne externe State-Library: kleiner Store + useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';
import type { GameEventPayload, GameStatePayload, Notice, RoomSnapshot } from '../../shared/types/room';
import { getSocket } from './socket';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export interface SessionState {
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  game: GameStatePayload | null;
  /** serverTime - Date.now() */
  clockOffset: number;
  /** Grund, falls die Sitzung serverseitig beendet wurde */
  ended: string | null;
}

type Listener = () => void;
type EventHandler = (payload: unknown, event: GameEventPayload) => void;

class SessionStore {
  private state: SessionState = { status: 'connecting', room: null, game: null, clockOffset: 0, ended: null };
  private listeners = new Set<Listener>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private noticeHandlers = new Set<(n: Notice) => void>();
  private bound = false;

  bind() {
    if (this.bound) return;
    this.bound = true;
    const s = getSocket();
    if (s.connected) this.set({ status: 'connected' });
    s.on('connect', () => this.set({ status: 'connected' }));
    s.on('disconnect', () => this.set({ status: 'reconnecting' }));
    s.io.on('reconnect_attempt', () => this.set({ status: 'reconnecting' }));
    s.on('room:state', (room) => this.set({ room, clockOffset: room.serverTime - Date.now(), ended: null }));
    s.on('game:state', (game) => this.set({ game, clockOffset: game.serverTime - Date.now() }));
    s.on('game:event', (event) => {
      for (const h of this.eventHandlers.get(event.name) ?? []) h(event.payload, event);
    });
    s.on('room:notice', (n) => this.noticeHandlers.forEach((h) => h(n)));
    s.on('room:closed', ({ reason }) => this.set({ room: null, game: null, ended: reason }));
    s.on('session:ended', ({ reason }) => this.set({ room: null, game: null, ended: reason }));
  }

  get = () => this.state;

  set(patch: Partial<SessionState>) {
    this.state = { ...this.state, ...patch };
    // Spielzustand verwerfen, wenn kein Spiel mehr aktiv ist
    if (patch.room !== undefined && (!this.state.room || !this.state.room.activeGameId)) this.state.game = null;
    this.listeners.forEach((l) => l());
  }

  reset() {
    this.set({ room: null, game: null, ended: null });
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  onGameEvent(name: string, handler: EventHandler) {
    let set = this.eventHandlers.get(name);
    if (!set) this.eventHandlers.set(name, (set = new Set()));
    set.add(handler);
    return () => {
      set!.delete(handler);
    };
  }

  onNotice(handler: (n: Notice) => void) {
    this.noticeHandlers.add(handler);
    return () => {
      this.noticeHandlers.delete(handler);
    };
  }
}

export const sessionStore = new SessionStore();

export function useSession<T>(selector: (s: SessionState) => T): T {
  sessionStore.bind();
  return useSyncExternalStore(sessionStore.subscribe, () => selector(sessionStore.get()));
}
