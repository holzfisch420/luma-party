import { Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import type { PlayerViewProps } from '../../../game-types';
import { countOn, phaseOf, removable, targetsFrom, type Side } from '../../logic/rules';
import type { MuehlePublicState } from '../../types';
import { MillBoard, Stone } from '../MillBoard';
import { colorName, END_TEXT, nameOf, statusText, useMillSounds } from '../shared';

type Props = PlayerViewProps<MuehlePublicState, null>;

export function MuehleController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const s = pub.state;
  useMillSounds(pub);
  const mySide: Side | null = pub.players.w === me.id ? 'w' : pub.players.b === me.id ? 'b' : null;
  const over = !!(s.winner || s.draw);
  const myTurn = !!mySide && s.turn === mySide && !over;
  const [selected, setSelected] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setSelected(null), [s]);
  useEffect(() => {
    if (myTurn) haptics.play(s.mustRemove ? 'success' : 'light');
  }, [myTurn, s.mustRemove]);

  const ph = mySide ? phaseOf(s, mySide) : 'place';
  let active: number[] = [];
  let targets: number[] = [];
  let rem: number[] = [];
  if (myTurn) {
    if (s.mustRemove) rem = removable(s);
    else if (ph === 'place') active = s.board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
    else {
      active = s.board.map((c, i) => (c === mySide && targetsFrom(s, i).length ? i : -1)).filter((i) => i >= 0);
      if (selected != null) targets = targetsFrom(s, selected);
    }
  }

  const tap = (i: number) => {
    if (!myTurn) return;
    if (s.mustRemove) {
      if (rem.includes(i)) sendAction('remove', { at: i });
      return;
    }
    if (ph === 'place') {
      if (s.board[i] === null) sendAction('place', { to: i });
      return;
    }
    if (selected != null && targets.includes(i)) {
      sendAction('move', { from: selected, to: i });
      setSelected(null);
      return;
    }
    if (s.board[i] === mySide && targetsFrom(s, i).length) {
      setSelected(i === selected ? null : i);
      haptics.play('tick');
    } else setSelected(null);
  };

  const hint = !mySide
    ? 'Du schaust zu'
    : over
      ? s.winner === mySide
        ? 'Gewonnen! 🎉'
        : s.winner
          ? 'Verloren'
          : 'Remis'
      : !myTurn
        ? `${nameOf(room, pub.players[s.turn])} ist dran …`
        : s.mustRemove
          ? 'Mühle! Tippe einen roten Stein an'
          : ph === 'place'
            ? 'Tippe auf einen freien Punkt'
            : selected == null
              ? ph === 'fly'
                ? 'Wähle einen Stein – du darfst springen'
                : 'Wähle einen Stein zum Ziehen'
              : 'Tippe aufs Ziel';

  return (
    <div className="fixed inset-0 flex touch-none select-none flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_20%,#5a3a22,#24150b)] px-3 text-white safe-pt safe-pb">
      <div className="text-center">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#e8b84a]">{statusText(room, pub)}</div>
        <div className={`mt-1 text-2xl font-black ${myTurn ? '' : 'text-white/70'}`}>{hint}</div>
        {over && pub.endReason && <div className="text-sm font-bold text-[#e8b84a]">{END_TEXT[pub.endReason]}</div>}
      </div>
      <MillBoard board={s.board} last={s.last} active={active} targets={targets} removable={rem} selected={selected} onPoint={mySide ? tap : undefined} className="w-full max-w-[min(100vw,62vh)]" />
      {mySide && (
        <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-black/30 px-4 py-2">
          <Stone side={mySide} size={1.6} />
          <div className="flex-1 text-sm font-bold">
            Du spielst {colorName(mySide)} · {s.hand[mySide] > 0 ? `noch ${s.hand[mySide]} zu setzen` : `${countOn(s, mySide)} auf dem Brett`}
          </div>
          {!over &&
            (confirm ? (
              <>
                <button className="rounded-full bg-[#e03131] px-3 py-1.5 text-sm font-black" onClick={() => sendAction('resign')}>
                  Aufgeben
                </button>
                <button className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-black" onClick={() => setConfirm(false)}>
                  Nein
                </button>
              </>
            ) : (
              <button aria-label="Aufgeben" className="grid size-9 place-items-center rounded-full bg-white/15" onClick={() => setConfirm(true)}>
                <Flag className="size-4" />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
