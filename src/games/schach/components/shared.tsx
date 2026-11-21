import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { useSession } from '../../../app/session/session-store';
import type { RoomSnapshot } from '../../../shared/types/room';
import type { EndReason, SchachPublicState, Side } from '../types';
import { Piece, type PieceType } from './pieces';

export const nameOf = (room: RoomSnapshot, id: string | null | undefined) => room.players.find((p) => p.id === id)?.name ?? '?';

/** Restzeit beider Seiten, live (alle 100 ms) */
export function useClocks(pub: SchachPublicState): Record<Side, number> | null {
  const offset = useSession((s) => s.clockOffset);
  const calc = () => {
    if (!pub.clocks) return null;
    const now = Date.now() + offset;
    const running = pub.result ? null : pub.turn;
    return {
      w: Math.max(0, pub.clocks.w - (running === 'w' ? now - pub.turnStartedAt : 0)),
      b: Math.max(0, pub.clocks.b - (running === 'b' ? now - pub.turnStartedAt : 0)),
    };
  };
  const [v, setV] = useState(calc);
  useEffect(() => {
    setV(calc());
    if (!pub.clocks || pub.result) return;
    const id = setInterval(() => setV(calc()), 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub, offset]);
  return v;
}

export function formatClock(ms: number): string {
  const s = ms / 1000;
  if (s < 10) return `0:0${s.toFixed(1)}`;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function Clock({ ms, active, big }: { ms: number; active: boolean; big?: boolean }) {
  const low = ms < 20_000;
  return (
    <div
      className={`rounded-lg px-3 py-1 font-mono font-black tabular-nums transition-colors ${big ? 'text-4xl' : 'text-2xl'} ${
        active ? (low ? 'bg-[#e03131] text-white' : 'bg-white text-[#262421]') : 'bg-[#262421]/70 text-white/60'
      }`}
    >
      {formatClock(ms)}
    </div>
  );
}

export function CapturedRow({ pieces, color, plus }: { pieces: PieceType[]; color: Side; plus: number }) {
  return (
    <div className="flex h-6 items-center">
      {pieces.map((t, i) => (
        <Piece key={i} type={t} color={color} className={`size-6 ${i > 0 && pieces[i - 1] === t ? '-ml-3' : ''}`} />
      ))}
      {plus > 0 && <span className="ml-1 text-sm font-black text-white/70">+{plus}</span>}
    </div>
  );
}

export const REASON_TEXT: Record<EndReason, string> = {
  checkmate: 'Schachmatt',
  timeout: 'Zeit abgelaufen',
  resign: 'Aufgegeben',
  stalemate: 'Patt',
  insufficient: 'Zu wenig Material',
  repetition: 'Dreifache Wiederholung',
  fifty: '50-Züge-Regel',
  agreed: 'Remis vereinbart',
  left: 'Gegner hat verlassen',
};

/** Zug-, Schlag-, Schach- und Endgeräusche */
export function useChessSounds(pub: SchachPublicState) {
  const ply = useRef(pub.history.length);
  const ended = useRef(!!pub.result);
  useEffect(() => {
    if (pub.history.length > ply.current) {
      const san = pub.history[pub.history.length - 1] ?? '';
      if (san.includes('+') || san.includes('#')) playSfx('clang', { vol: 0.5, rate: 1.3 });
      else if (san.includes('x')) playSfx('thunk-2', { vol: 0.9 });
      else if (san.startsWith('O-O')) playSfx('thunk-3', { vol: 0.9 });
      else playSfx('thunk-1', { vol: 0.8, vary: 0.05 });
    }
    ply.current = pub.history.length;
    if (pub.result && !ended.current) playSfx(pub.result.winner ? 'fanfare' : 'gavel', { vol: 0.8 });
    ended.current = !!pub.result;
  }, [pub.history.length, pub.result]);
}
