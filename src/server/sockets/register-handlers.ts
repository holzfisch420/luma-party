/**
 * Socket.IO-Handler: übersetzt Client-Events in Raum-Aktionen.
 * Jede Aktion wird hier auf Berechtigung und Eingabeformat geprüft.
 */
import { ACTION_BURST, ACTION_RATE_PER_SECOND } from '../../shared/constants';
import type { Ack } from '../../shared/events';
import { RoomError, type TypedServer, type TypedSocket } from '../rooms/room';
import type { RoomManager } from '../rooms/room-manager';
import { RateLimiter } from '../security/rate-limit';

const MAX_ACTIVE_ROOMS = 2000;

function errorMessage(err: unknown): string {
  if (err instanceof RoomError) return err.message;
  console.error('[socket] Unerwarteter Fehler:', err);
  return 'Unerwarteter Serverfehler.';
}

function reply<T>(ack: Ack<T> | undefined, fn: () => T): void {
  try {
    const data = fn();
    if (typeof ack === 'function') ack({ ok: true, data });
  } catch (err) {
    if (typeof ack === 'function') ack({ ok: false, error: errorMessage(err) });
  }
}

async function replyAsync(ack: Ack | undefined, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    if (typeof ack === 'function') ack({ ok: true, data: undefined as void });
  } catch (err) {
    if (typeof ack === 'function') ack({ ok: false, error: errorMessage(err) });
  }
}

/** Token-Bucket pro Socket für hochfrequente Spielaktionen (z. B. Zeichnen) */
function allowAction(socket: TypedSocket): boolean {
  const now = Date.now();
  const b = (socket.data.bucket ??= { tokens: ACTION_BURST, updatedAt: now });
  b.tokens = Math.min(ACTION_BURST, b.tokens + ((now - b.updatedAt) / 1000) * ACTION_RATE_PER_SECOND);
  b.updatedAt = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

export function registerSocketHandlers(io: TypedServer, rooms: RoomManager, opts: { publicMode?: boolean } = {}): void {
  // Grenzen gegen Missbrauch – großzügig für normale Partys
  const roomCreation = new RateLimiter(opts.publicMode ? 10 : 1000, 10 * 60_000);
  const joinAttempts = new RateLimiter(opts.publicMode ? 30 : 1000, 60_000);

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as TypedSocket;
    const forwarded = String(socket.handshake.headers['x-forwarded-for'] ?? '').split(',')[0]!.trim();
    const ip = (opts.publicMode && forwarded) || socket.handshake.address || 'unknown';
    const currentRoom = () => rooms.get(socket.data.roomCode);

    /** verlässt einen evtl. vorherigen Raum, bevor ein neuer betreten wird */
    const leaveCurrent = () => {
      const room = currentRoom();
      if (room) {
        room.detachSocket(socket);
        socket.leave(`r:${room.code}`);
        socket.leave(`r:${room.code}:host`);
        if (socket.data.playerId) socket.leave(`p:${room.code}:${socket.data.playerId}`);
      }
      socket.data.roomCode = undefined;
      socket.data.role = undefined;
      socket.data.playerId = undefined;
    };

    // ---------------- Host
    socket.on('host:create', (ack) =>
      reply(ack, () => {
        if (!roomCreation.take(ip)) throw new RoomError('Zu viele neue Räume – bitte in ein paar Minuten erneut versuchen.');
        if (rooms.size >= MAX_ACTIVE_ROOMS) throw new RoomError('Der Server ist gerade voll – bitte später erneut versuchen.');
        leaveCurrent();
        const room = rooms.create();
        room.attachHost(socket);
        return { code: room.code, hostToken: room.hostToken };
      }),
    );

    socket.on('host:resume', (data, ack) =>
      reply(ack, () => {
        const room = rooms.get(data?.code);
        if (!room || typeof data?.hostToken !== 'string' || data.hostToken !== room.hostToken) {
          throw new RoomError('Raum nicht mehr verfügbar.');
        }
        if (socket.data.roomCode !== room.code) leaveCurrent();
        room.attachHost(socket);
        return { code: room.code, hostToken: room.hostToken };
      }),
    );

    // ---------------- Spieler
    socket.on('player:join', (data, ack) =>
      reply(ack, () => {
        if (!joinAttempts.take(ip)) throw new RoomError('Zu viele Versuche – bitte kurz warten.');
        const room = rooms.get(data?.code);
        if (!room) throw new RoomError('Raum nicht gefunden. Prüfe den Code.');
        // angemeldetes Konto? Dann kommen Name und Avatar vom Konto
        let account = null;
        if (data?.authToken) {
          const accountId = rooms.services.tokens.verify(data.authToken);
          const doc = accountId ? rooms.services.accounts.get(accountId) : undefined;
          if (!doc) throw new RoomError('Deine Anmeldung ist abgelaufen – bitte erneut anmelden.');
          account = { id: doc.id, username: doc.username, avatar: doc.avatar };
        }
        leaveCurrent();
        const player = room.addPlayer(data?.name, socket, account);
        return { code: room.code, playerId: player.id, token: player.token };
      }),
    );

    socket.on('player:resume', (data, ack) =>
      reply(ack, () => {
        const room = rooms.get(data?.code);
        if (!room) throw new RoomError('Raum nicht mehr verfügbar.');
        if (typeof data?.token !== 'string') throw new RoomError('Ungültige Sitzung.');
        if (socket.data.roomCode !== room.code) leaveCurrent();
        const player = room.resumePlayer(data.token, socket);
        return { code: room.code, playerId: player.id, token: player.token };
      }),
    );

    socket.on('player:refreshProfile', (data) => {
      const room = currentRoom();
      if (!room || socket.data.role !== 'player' || !socket.data.playerId) return;
      const accountId = rooms.services.tokens.verify(data?.authToken);
      const doc = accountId ? rooms.services.accounts.get(accountId) : undefined;
      if (doc) room.refreshProfile(socket.data.playerId, { id: doc.id, username: doc.username, avatar: doc.avatar });
    });

    socket.on('player:leave', () => {
      const room = currentRoom();
      if (room && socket.data.role === 'player' && socket.data.playerId) room.removePlayer(socket.data.playerId);
      socket.data = {};
    });

    // ---------------- Launcher / Lobby
    socket.on('room:selectGame', (data) => {
      const room = currentRoom();
      if (!room || !room.canControl(socket) || typeof data?.gameId !== 'string') return;
      try {
        room.selectGame(data.gameId);
      } catch (err) {
        socket.emit('room:notice', { kind: 'error', message: errorMessage(err) });
      }
    });

    socket.on('room:setHostControl', (data) => {
      const room = currentRoom();
      if (!room || !room.isHost(socket)) return;
      room.setHostControl(Boolean(data?.enabled));
    });

    socket.on('room:updateSettings', (data, ack) =>
      reply(ack, () => {
        const room = currentRoom();
        if (!room || !room.canControl(socket)) throw new RoomError('Keine Berechtigung.');
        if (typeof data?.gameId !== 'string') throw new RoomError('Ungültiges Spiel.');
        room.updateSettings(data.gameId, data.settings);
      }),
    );

    socket.on('room:startGame', (ack) =>
      void replyAsync(ack, async () => {
        const room = currentRoom();
        if (!room || !room.canControl(socket)) throw new RoomError('Nur der Host oder der berechtigte Spieler darf starten.');
        await room.startGame();
      }),
    );

    socket.on('room:restartGame', (ack) =>
      void replyAsync(ack, async () => {
        const room = currentRoom();
        if (!room || !room.canControl(socket)) throw new RoomError('Keine Berechtigung.');
        await room.restartGame();
      }),
    );

    socket.on('room:backToLauncher', () => {
      const room = currentRoom();
      if (room && room.canControl(socket)) room.backToLauncher();
    });

    socket.on('room:kickPlayer', (data) => {
      const room = currentRoom();
      if (!room || !room.isHost(socket) || typeof data?.playerId !== 'string') return;
      room.removePlayer(data.playerId, 'Du wurdest vom Host aus dem Raum entfernt.');
    });

    socket.on('host:closeRoom', () => {
      const room = currentRoom();
      if (room && room.isHost(socket)) rooms.close(room.code, 'Der Host hat den Raum geschlossen.');
      socket.data = {};
    });

    // ---------------- Spiel
    socket.on('game:action', (action) => {
      const room = currentRoom();
      if (!room || !action || typeof action !== 'object') return;
      if (!allowAction(socket)) return;
      room.handleGameAction(socket, action.type, action.payload);
    });

    socket.on('disconnect', () => {
      currentRoom()?.detachSocket(socket);
    });
  });
}
