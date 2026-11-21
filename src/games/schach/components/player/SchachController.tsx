import { AnimatePresence, motion } from 'framer-motion';
import { Flag, Handshake } from 'lucide-react';
import { useEffect, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { PlayerViewProps } from '../../../game-types';
import type { SchachPublicState, Side } from '../../types';
import { Board } from '../Board';
import { captured, checkSquare, legalTargets, piecesOf, type Target } from '../board-utils';
import { Piece, type PieceType } from '../pieces';
import { CapturedRow, Clock, nameOf, REASON_TEXT, useChessSounds, useClocks } from '../shared';

type Props = PlayerViewProps<SchachPublicState, null>;

/** Handy: eigenes Brett aus der eigenen Sicht; Zuschauer sehen das Brett von Weiß */
export function SchachController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const mySide: Side | null = pub.players.w === me.id ? 'w' : pub.players.b === me.id ? 'b' : null;
  const orientation: Side = mySide ?? 'w';
  const clocks = useClocks(pub);
  useChessSounds(pub);
  const [selected, setSelected] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const myTurn = !!mySide && pub.turn === mySide && !pub.result;
  const cap = captured(pub.fen);

  // nach jedem Zug Auswahl zurücksetzen
  useEffect(() => {
    setSelected(null);
    setTargets([]);
    setPromo(null);
  }, [pub.fen]);
  // Vibration, wenn man dran ist
  useEffect(() => {
    if (myTurn && pub.history.length > 0) haptics.play('light');
  }, [myTurn, pub.history.length]);

  const tap = (sq: string) => {
    if (!myTurn) return;
    const piece = piecesOf(pub.fen).get(sq);
    const t = targets.find((x) => x.to === sq);
    if (selected && t) {
      if (t.promotion) setPromo({ from: selected, to: sq });
      else sendAction('move', { from: selected, to: sq });
      setSelected(null);
      setTargets([]);
      return;
    }
    if (piece && piece.color === mySide) {
      setSelected(sq === selected ? null : sq);
      setTargets(sq === selected ? [] : legalTargets(pub.fen, sq));
      haptics.play('tick');
    } else {
      setSelected(null);
      setTargets([]);
    }
  };

  const strip = (side: Side) => {
    const id = pub.players[side];
    const p = room.players.find((x) => x.id === id);
    const active = !pub.result && pub.turn === side;
    return (
      <div className="flex items-center gap-3 px-1">
        <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#888'} avatar={p?.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black">
            {nameOf(room, id)} {id === me.id && <span className="text-sm text-white/50">(du)</span>}
          </div>
          <CapturedRow pieces={cap[side]} color={side === 'w' ? 'b' : 'w'} plus={side === 'w' ? cap.diff : -cap.diff} />
        </div>
        {clocks && <Clock ms={clocks[side]} active={active} />}
      </div>
    );
  };

  const top: Side = orientation === 'w' ? 'b' : 'w';
  const bottom: Side = orientation;

  return (
    <div className="fixed inset-0 flex touch-none select-none flex-col justify-center gap-3 bg-[#302e2b] px-2 text-white safe-pt safe-pb">
      {!mySide && <div className="text-center text-sm font-black uppercase tracking-[0.2em] text-white/50">Du schaust zu</div>}
      {strip(top)}
      <div className="relative mx-auto aspect-square w-full max-w-[min(100vw,62vh)] [container-type:inline-size]">
        <Board
          fen={pub.fen}
          orientation={orientation}
          lastMove={pub.lastMove}
          selected={selected}
          targets={targets}
          check={checkSquare(pub.fen, pub.inCheck)}
          ply={pub.history.length}
          onSquare={mySide ? tap : undefined}
          className="size-full"
        />
        <AnimatePresence>
          {promo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center bg-black/50">
              <div className="flex gap-2 rounded-2xl bg-white p-3 shadow-2xl">
                {(['q', 'r', 'b', 'n'] as PieceType[]).map((t) => (
                  <button
                    key={t}
                    className="size-16 rounded-xl bg-[#eeeed2] active:bg-[#f6f669]"
                    onClick={() => {
                      sendAction('move', { ...promo, promotion: t });
                      setPromo(null);
                    }}
                  >
                    <Piece type={t} color={mySide ?? 'w'} className="size-full" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {strip(bottom)}

      {/* Status & Knöpfe */}
      <div className="flex min-h-12 items-center justify-center gap-2 px-2">
        {pub.result ? (
          <div className="text-center">
            <div className="text-2xl font-black">
              {pub.result.winner ? (pub.players[pub.result.winner] === me.id ? 'Gewonnen! 🎉' : `${nameOf(room, pub.players[pub.result.winner])} gewinnt`) : 'Remis'}
            </div>
            <div className="text-sm font-bold text-[#81b64c]">{REASON_TEXT[pub.result.reason]}</div>
          </div>
        ) : mySide ? (
          pub.drawOffer && pub.drawOffer !== mySide ? (
            <>
              <span className="text-sm font-black">Remis-Angebot:</span>
              <button className="rounded-full bg-[#81b64c] px-4 py-2 text-sm font-black" onClick={() => sendAction('answerDraw', { accept: true })}>
                Annehmen
              </button>
              <button className="rounded-full bg-white/15 px-4 py-2 text-sm font-black" onClick={() => sendAction('answerDraw', { accept: false })}>
                Ablehnen
              </button>
            </>
          ) : confirmResign ? (
            <>
              <span className="text-sm font-black">Wirklich aufgeben?</span>
              <button className="rounded-full bg-[#e03131] px-4 py-2 text-sm font-black" onClick={() => sendAction('resign')}>
                Ja
              </button>
              <button className="rounded-full bg-white/15 px-4 py-2 text-sm font-black" onClick={() => setConfirmResign(false)}>
                Nein
              </button>
            </>
          ) : (
            <>
              <span className={`mr-auto text-base font-black ${myTurn ? 'text-[#81b64c]' : 'text-white/50'}`}>{myTurn ? (pub.inCheck ? 'Schach! Du bist dran' : 'Du bist dran') : 'Gegner denkt …'}</span>
              <button
                disabled={pub.drawOffer === mySide}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-black disabled:opacity-40"
                onClick={() => sendAction('offerDraw')}
              >
                <Handshake className="size-4" /> {pub.drawOffer === mySide ? 'Angeboten' : 'Remis'}
              </button>
              <button className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-black" onClick={() => setConfirmResign(true)}>
                <Flag className="size-4" /> Aufgeben
              </button>
            </>
          )
        ) : (
          <span className="text-sm font-bold text-white/50">{pub.turn === 'w' ? 'Weiß' : 'Schwarz'} ist am Zug</span>
        )}
      </div>
    </div>
  );
}
