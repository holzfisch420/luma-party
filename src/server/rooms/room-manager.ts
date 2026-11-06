/** Zentrale Verwaltung aller aktiven Räume inkl. kollisionsfreier Raumcodes. */
import { randomInt } from 'node:crypto';
import { EMPTY_ROOM_TTL_MS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/constants';
import type { GameServices } from '../game-engine/types';
import { Room, type TypedServer } from './room';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private sweeper: NodeJS.Timeout;

  constructor(
    private readonly io: TypedServer,
    readonly services: GameServices,
  ) {
    this.sweeper = setInterval(() => this.sweep(), 10_000);
    this.sweeper.unref();
  }

  create(): Room {
    const code = this.generateCode();
    const room = new Room(code, this.io, this.services);
    this.rooms.set(code, room);
    console.log(`[rooms] Raum ${code} erstellt (${this.rooms.size} aktiv)`);
    return room;
  }

  get(code: unknown): Room | undefined {
    if (typeof code !== 'string') return undefined;
    return this.rooms.get(code.trim().toUpperCase());
  }

  close(code: string, reason: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.close(reason);
    this.rooms.delete(code);
    console.log(`[rooms] Raum ${code} geschlossen (${reason})`);
  }

  get size() {
    return this.rooms.size;
  }

  private generateCode(): string {
    // Kollisionsprüfung gegen alle aktiven Räume
    for (let attempt = 0; attempt < 10_000; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Kein freier Raumcode verfügbar');
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.sweep(now, EMPTY_ROOM_TTL_MS)) this.close(code, 'Raum war zu lange inaktiv.');
    }
  }

  dispose(): void {
    clearInterval(this.sweeper);
    for (const code of [...this.rooms.keys()]) this.close(code, 'Server wird beendet.');
  }
}
