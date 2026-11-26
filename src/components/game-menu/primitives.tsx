import { AlertTriangle } from 'lucide-react';
import type { RoomSnapshot } from '../../shared/types/room';

/** Hinweis, warum noch nicht gestartet werden kann */
export function BlockedHint({ blocked, className = '' }: { blocked: string | null; className?: string }) {
  if (!blocked) return null;
  return (
    <div className={`flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-lg font-bold text-white backdrop-blur ${className}`}>
      <AlertTriangle className="size-5 text-[#ffd23f]" /> {blocked}
    </div>
  );
}

/** wer steuert das Menü (für eine kleine Zeile im Titelbildschirm) */
export function controlLine(room: RoomSnapshot): string {
  const lead = !room.hostHasControl && room.controllerId ? room.players.find((p) => p.id === room.controllerId)?.name : null;
  return lead ? `${lead} steuert per Handy · Pfeile + Enter am Fernseher` : 'Pfeile + Enter zum Auswählen · Esc = zurück';
}

/** ist der Knopf ein Start-Knopf? */
export const isStart = (a: { kind: string }) => a.kind === 'start';
