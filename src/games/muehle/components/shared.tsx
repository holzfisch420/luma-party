import { useEffect, useRef } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import type { RoomSnapshot } from '../../../shared/types/room';
import { phaseOf, type Side } from '../logic/rules';
import type { MuehlePublicState } from '../types';

export const nameOf = (room: RoomSnapshot, id: string | null | undefined) => room.players.find((p) => p.id === id)?.name ?? '?';
export const colorName = (s: Side) => (s === 'w' ? 'Weiß' : 'Schwarz');

/** kurzer Satz, was gerade passiert */
export function statusText(room: RoomSnapshot, pub: MuehlePublicState): string {
  const s = pub.state;
  const who = nameOf(room, pub.players[s.turn]);
  if (s.winner) return `${nameOf(room, pub.players[s.winner])} gewinnt!`;
  if (s.draw) return 'Remis!';
  if (s.mustRemove) return `Mühle! ${who} nimmt einen Stein weg`;
  const ph = phaseOf(s, s.turn);
  return ph === 'place' ? `${who} setzt einen Stein` : ph === 'fly' ? `${who} springt (nur noch 3 Steine)` : `${who} zieht`;
}

export const END_TEXT = { pieces: 'Nur noch zwei Steine', blocked: 'Kein Zug mehr möglich', draw: '50 Züge ohne Mühle', resign: 'Aufgegeben', left: 'Gegner hat verlassen' } as const;

/** Setzen/Ziehen klackt, Mühle läutet, Wegnehmen knallt */
export function useMillSounds(pub: MuehlePublicState) {
  const prev = useRef(pub.state);
  useEffect(() => {
    const a = prev.current;
    const b = pub.state;
    prev.current = b;
    if (a === b) return;
    if (b.mustRemove && !a.mustRemove) playSfx('success', { vol: 0.7 });
    else if (b.last?.removed !== undefined && a.last?.removed !== b.last.removed) playSfx('pop', { vol: 0.8, rate: 0.8 });
    else if (b.last?.to !== a.last?.to || b.last?.from !== a.last?.from) playSfx('thunk-1', { vol: 0.8, vary: 0.08 });
    if ((b.winner || b.draw) && !(a.winner || a.draw)) playSfx(b.winner ? 'fanfare' : 'gavel', { vol: 0.8, delay: 0.3 });
  }, [pub.state]);
}
