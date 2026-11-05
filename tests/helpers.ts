import { io as ioClient, type Socket } from 'socket.io-client';
import type { AckResult, ClientToServerEvents, ServerToClientEvents } from '../src/shared/events';
import type { GameEventPayload, GameStatePayload, RoomSnapshot } from '../src/shared/types/room';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface TestClient {
  socket: ClientSocket;
  room: RoomSnapshot | null;
  game: GameStatePayload<any, any> | null;
  events: GameEventPayload<any>[];
  notices: string[];
  waitFor<T>(pred: () => T | undefined | null | false, ms?: number): Promise<T>;
  close(): void;
}

export function connect(port: number): Promise<TestClient> {
  const socket: ClientSocket = ioClient(`http://localhost:${port}`, { transports: ['websocket'], forceNew: true });
  const c: TestClient = {
    socket,
    room: null,
    game: null,
    events: [],
    notices: [],
    waitFor(pred, ms = 4000) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
          const v = pred();
          if (v) return resolve(v as any);
          if (Date.now() - start > ms) return reject(new Error('waitFor timeout'));
          setTimeout(tick, 15);
        };
        tick();
      });
    },
    close: () => socket.close(),
  };
  socket.on('room:state', (r) => (c.room = r));
  socket.on('game:state', (g) => (c.game = g));
  socket.on('game:event', (e) => c.events.push(e));
  socket.on('room:notice', (n) => c.notices.push(n.message));
  return new Promise((resolve) => socket.on('connect', () => resolve(c)));
}

export function emitAck<T>(c: TestClient, event: string, ...args: unknown[]): Promise<AckResult<T>> {
  return new Promise((resolve) => (c.socket.emit as any)(event, ...args, (res: AckResult<T>) => resolve(res)));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
