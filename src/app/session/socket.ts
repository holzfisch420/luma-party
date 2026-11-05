import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/events';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ClientSocket | null = null;

/** Eine Socket-Verbindung pro Tab; Socket.IO verbindet sich automatisch neu. */
export function getSocket(): ClientSocket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
    });
  }
  return socket;
}

export function emitWithAck<T>(event: keyof ClientToServerEvents, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Zeitüberschreitung – keine Antwort vom Server.')), 8000);
    (getSocket().emit as (...a: unknown[]) => void)(event, ...args, (res: { ok: boolean; data?: T; error?: string }) => {
      clearTimeout(timer);
      if (res?.ok) resolve(res.data as T);
      else reject(new Error(res?.error ?? 'Unbekannter Fehler'));
    });
  });
}
