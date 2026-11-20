import { Flag, RotateCcw, Shovel } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { haptics } from '../../../app/haptics';
import { getBest, submitScore } from './scores';

/** „Minensuche“: alle sicheren Felder aufdecken. Erster Tipp ist immer sicher. */
const COLS = 9;
const ROWS = 11;
const MINES = 15;
const NUM_COLORS = ['', '#38bdf8', '#4ade80', '#f87171', '#c084fc', '#fb923c', '#2dd4bf', '#f472b6', '#e5e7eb'];

interface Cell {
  mine: boolean;
  open: boolean;
  flag: boolean;
  n: number;
}

const empty = (): Cell[] => Array.from({ length: COLS * ROWS }, () => ({ mine: false, open: false, flag: false, n: 0 }));
const neighbors = (i: number) => {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) out.push(ny * COLS + nx);
    }
  return out;
};

export function Mines() {
  const [cells, setCells] = useState<Cell[]>(empty);
  const [state, setState] = useState<'ready' | 'play' | 'won' | 'lost'>('ready');
  const [flagMode, setFlagMode] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [boom, setBoom] = useState<number | null>(null);
  const [best, setBest] = useState(() => getBest('mines'));
  const press = useRef<{ i: number; timer: number; long: boolean } | null>(null);

  useEffect(() => {
    if (state !== 'play') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state]);

  const seconds = state === 'ready' ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const flags = cells.filter((c) => c.flag).length;

  const reset = () => {
    setCells(empty());
    setState('ready');
    setBoom(null);
    playSfx('ui-toggle', { vol: 0.5 });
  };

  const reveal = (i: number) => {
    if (state === 'won' || state === 'lost') return;
    let board = cells.map((c) => ({ ...c }));
    let st = state;
    let begin = startedAt;
    if (st === 'ready') {
      // Minen so legen, dass das erste Feld und seine Nachbarn frei bleiben
      const safe = new Set([i, ...neighbors(i)]);
      const spots = board.map((_, k) => k).filter((k) => !safe.has(k));
      for (let m = 0; m < MINES; m++) {
        const k = spots.splice(Math.floor(Math.random() * spots.length), 1)[0]!;
        board[k]!.mine = true;
      }
      board.forEach((c, k) => (c.n = neighbors(k).filter((j) => board[j]!.mine).length));
      st = 'play';
      begin = Date.now();
      setStartedAt(begin);
      setNow(begin);
    }
    const c = board[i]!;
    if (c.flag) return;
    if (c.open) {
      // Akkord: Zahl antippen, wenn genug Fahnen drumherum liegen
      const around = neighbors(i);
      if (c.n === 0 || around.filter((j) => board[j]!.flag).length !== c.n) return;
      for (const j of around) if (!board[j]!.flag && !board[j]!.open) board = flood(board, j);
    } else board = flood(board, i);
    const hit = board.findIndex((b) => b.open && b.mine);
    if (hit >= 0) {
      board.forEach((b) => b.mine && (b.open = true));
      setBoom(hit);
      setState('lost');
      setNow(Date.now());
      playSfx('explosion-small', { vol: 0.7 });
      haptics.play('error');
    } else if (board.every((b) => b.mine || b.open)) {
      board.forEach((b) => b.mine && (b.flag = true));
      setState('won');
      const end = Date.now();
      setNow(end);
      const secs = Math.max(1, Math.floor((end - begin) / 1000));
      if (submitScore('mines', secs, true)) setBest(secs);
      playSfx('win', { vol: 0.7 });
      haptics.play('success');
    } else {
      setState(st);
      playSfx('pop', { vol: 0.35, vary: 0.1 });
      haptics.play('tick');
    }
    setCells(board);
  };

  const toggleFlag = (i: number) => {
    if (state !== 'play') return;
    const c = cells[i]!;
    if (c.open) return;
    setCells(cells.map((x, k) => (k === i ? { ...x, flag: !x.flag } : x)));
    playSfx('stamp', { vol: 0.4, rate: c.flag ? 0.8 : 1.1 });
    haptics.play('medium');
  };

  const face = state === 'won' ? '😎' : state === 'lost' ? '😵' : '🙂';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[340px] items-center justify-between rounded-2xl bg-black/30 px-3 py-2 font-black text-white">
        <span className="min-w-14 tabular-nums">💣 {MINES - flags}</span>
        <button onClick={reset} className="grid size-10 place-items-center rounded-xl bg-white/15 text-2xl active:bg-white/30" aria-label="Neu starten">
          {face}
        </button>
        <span className="min-w-14 text-right tabular-nums">⏱ {seconds}</span>
      </div>
      <div className="grid w-full max-w-[340px] touch-none select-none gap-[3px] rounded-2xl bg-[#1b2336] p-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {cells.map((c, i) => (
          <button
            key={i}
            className={`grid aspect-square place-items-center rounded-[6px] text-[15px] font-black leading-none ${
              c.open ? (c.mine ? (i === boom ? 'bg-red-500' : 'bg-[#3b2230]') : 'bg-[#2a3550]') : 'bg-gradient-to-b from-[#5b6b94] to-[#43507a] shadow-[inset_0_-2px_0_rgba(0,0,0,.25)] active:brightness-125'
            }`}
            style={c.open && !c.mine ? { color: NUM_COLORS[c.n] } : undefined}
            onPointerDown={() => {
              const timer = window.setTimeout(() => {
                if (press.current) press.current.long = true;
                toggleFlag(i);
              }, 380);
              press.current = { i, timer, long: false };
            }}
            onPointerUp={() => {
              const p = press.current;
              press.current = null;
              if (!p || p.i !== i) return;
              clearTimeout(p.timer);
              if (p.long) return;
              if (flagMode && !cells[i]!.open) toggleFlag(i);
              else reveal(i);
            }}
            onPointerLeave={() => {
              if (press.current) clearTimeout(press.current.timer);
              press.current = null;
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {c.open ? (c.mine ? '💣' : c.n || '') : c.flag ? '🚩' : ''}
          </button>
        ))}
      </div>
      <div className="flex w-full max-w-[340px] items-center gap-2">
        <div className="flex flex-1 rounded-2xl bg-black/30 p-1">
          {[false, true].map((f) => (
            <button
              key={String(f)}
              onClick={() => setFlagMode(f)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-black ${flagMode === f ? 'bg-white text-[#1b2336]' : 'text-white/70'}`}
            >
              {f ? <Flag className="size-4" /> : <Shovel className="size-4" />} {f ? 'Fahne' : 'Graben'}
            </button>
          ))}
        </div>
        <button onClick={reset} className="grid size-11 place-items-center rounded-2xl bg-black/30 text-white" aria-label="Neues Feld">
          <RotateCcw className="size-5" />
        </button>
      </div>
      <div className="text-xs font-extrabold text-white/60">
        {state === 'won' ? `Geschafft in ${seconds} s! ` : state === 'lost' ? 'Bumm! ' : 'Lange drücken = Fahne · '}
        Rekord: {best ? `${best} s` : '–'}
      </div>
    </div>
  );
}

function flood(board: Cell[], start: number): Cell[] {
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    const c = board[i]!;
    if (c.open || c.flag) continue;
    c.open = true;
    if (!c.mine && c.n === 0) stack.push(...neighbors(i));
  }
  return board;
}
