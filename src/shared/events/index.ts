/**
 * Typisierte Socket.IO-Events zwischen Client und Server.
 * Generisch gehalten: Spiele kommunizieren nur über `game:action`, `game:state` und `game:event`.
 */
import type { GameEventPayload, GameStatePayload, Notice, RoomSnapshot } from '../types/room';

export type Ack<T = void> = (res: AckResult<T>) => void;
export type AckResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export interface HostSessionData {
  code: string;
  hostToken: string;
}
export interface PlayerSessionData {
  code: string;
  playerId: string;
  token: string;
}

export interface GameActionMessage {
  type: string;
  payload?: unknown;
}

export interface ClientToServerEvents {
  'host:create': (ack: Ack<HostSessionData>) => void;
  'host:resume': (data: HostSessionData, ack: Ack<HostSessionData>) => void;
  'host:closeRoom': () => void;
  /** authToken = angemeldetes Konto (Name + Avatar kommen dann vom Konto) */
  'player:join': (data: { code: string; name: string; authToken?: string | null }, ack: Ack<PlayerSessionData>) => void;
  'player:resume': (data: { code: string; token: string }, ack: Ack<PlayerSessionData>) => void;
  'player:leave': () => void;
  /** Avatar/Name nach Änderung im Konto neu laden */
  'player:refreshProfile': (data: { authToken: string }) => void;
  'room:selectGame': (data: { gameId: string }) => void;
  'room:setHostControl': (data: { enabled: boolean }) => void;
  'room:updateSettings': (data: { gameId: string; settings: unknown }, ack?: Ack) => void;
  'room:startGame': (ack?: Ack) => void;
  'room:restartGame': (ack?: Ack) => void;
  'room:backToLauncher': () => void;
  'room:kickPlayer': (data: { playerId: string }) => void;
  'game:action': (action: GameActionMessage) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomSnapshot) => void;
  'room:notice': (notice: Notice) => void;
  'room:closed': (data: { reason: string }) => void;
  'session:ended': (data: { reason: string }) => void;
  'game:state': (state: GameStatePayload) => void;
  'game:event': (event: GameEventPayload) => void;
}
