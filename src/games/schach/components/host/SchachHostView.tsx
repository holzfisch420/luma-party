import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { HostViewProps } from '../../../game-types';
import { TIME_LABELS } from '../../game-config';
import type { SchachPublicState, Side } from '../../types';
import { Board } from '../Board';
import { captured, checkSquare } from '../board-utils';
import { CapturedRow, Clock, nameOf, REASON_TEXT, useChessSounds, useClocks } from '../shared';

/** Fernseher: großes Brett, Uhren, geschlagene Figuren, Zugliste */
export function SchachHostView({ room, state }: HostViewProps<SchachPublicState>) {
  const pub = state.public;
  const clocks = useClocks(pub);
  useChessSounds(pub);
  const cap = captured(pub.fen);
  const time = (room.gameSettings?.[room.activeGameId ?? ''] as { time?: keyof typeof TIME_LABELS } | undefined)?.time;

  const card = (side: Side) => {
    const id = pub.players[side];
    const p = room.players.find((x) => x.id === id);
    const active = !pub.result && pub.turn === side;
    const plus = side === 'w' ? cap.diff : -cap.diff;
    return (
      <div className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors ${active ? 'bg-white/15 ring-2 ring-[#81b64c]' : 'bg-black/25'}`}>
        <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#888'} avatar={p?.avatar} size="lg" dimmed={p ? !p.isConnected : true} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`size-4 shrink-0 rounded-sm border-2 border-black/40 ${side === 'w' ? 'bg-white' : 'bg-[#262421]'}`} />
            <span className="truncate text-2xl font-black">{nameOf(room, id)}</span>
          </div>
          <CapturedRow pieces={cap[side]} color={side === 'w' ? 'b' : 'w'} plus={plus} />
        </div>
        {clocks && <Clock ms={clocks[side]} active={active} big />}
      </div>
    );
  };

  return (
    <div className="flex h-dvh items-center justify-center gap-[2.5vw] bg-[#302e2b] px-[3vw] text-white">
      <div className="relative aspect-square h-[88vh] max-w-[58vw] [container-type:inline-size]">
        <Board fen={pub.fen} orientation="w" lastMove={pub.lastMove} check={checkSquare(pub.fen, pub.inCheck)} ply={pub.history.length} className="size-full" />
        <AnimatePresence>
          {pub.result && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl bg-[#262421]/95 px-12 py-7 text-center shadow-2xl"
            >
              <div className="text-5xl font-black">{pub.result.winner ? `${nameOf(room, pub.players[pub.result.winner])} gewinnt!` : 'Remis'}</div>
              <div className="text-2xl font-bold text-[#81b64c]">{REASON_TEXT[pub.result.reason]}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex h-[88vh] w-[30vw] flex-col gap-3">
        {card('b')}
        <div className="flex items-center justify-between px-1 text-sm font-bold text-white/60">
          <span>{time ? TIME_LABELS[time] : ''}</span>
          {pub.drawOffer && !pub.result && <span className="rounded-full bg-[#e8b84a] px-3 py-0.5 font-black text-[#262421]">{nameOf(room, pub.players[pub.drawOffer])} bietet Remis an</span>}
          {pub.inCheck && !pub.result && <span className="rounded-full bg-[#e03131] px-3 py-0.5 font-black text-white">Schach!</span>}
        </div>
        <MoveList history={pub.history} />
        {card('w')}
      </div>
    </div>
  );
}

function MoveList({ history }: { history: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [history.length]);
  const rows: [string, string | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) rows.push([history[i]!, history[i + 1]]);
  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#262421] p-2 font-mono text-lg">
      {rows.length === 0 && <div className="p-4 text-center font-sans text-base font-bold text-white/40">Weiß beginnt.</div>}
      {rows.map(([w, b], i) => (
        <div key={i} className={`grid grid-cols-[3rem_1fr_1fr] rounded px-2 py-0.5 ${i % 2 ? 'bg-white/[0.04]' : ''}`}>
          <span className="text-white/40">{i + 1}.</span>
          <span className={`font-bold ${i === rows.length - 1 && !b ? 'text-[#81b64c]' : ''}`}>{w}</span>
          <span className={`font-bold ${i === rows.length - 1 && b ? 'text-[#81b64c]' : ''}`}>{b ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

