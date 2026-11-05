import { motion } from 'framer-motion';
import { Eraser, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { BRUSH_SIZES, ERASER_COLOR_INDEX, PALETTE } from '../../game-config';
import { useDrawingSender } from '../../hooks/useDrawingSender';
import type { StrokeModel } from '../../logic/stroke-model';
import type { DrawOp, MontagsmalerPublicState } from '../../types';
import { DrawingPad } from '../DrawingPad';
import { PlayerHeader } from './PlayerHeader';

interface DrawerViewProps {
  state: MontagsmalerPublicState;
  word: string;
  model: StrokeModel;
  sendAction: (type: string, payload?: unknown) => void;
}

export function DrawerView({ state, word, model, sendAction }: DrawerViewProps) {
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const sender = useDrawingSender((ops: DrawOp[]) => sendAction('draw', { ops }));

  const pushOp = (op: DrawOp) => sender.push(op);
  const local = (op: DrawOp) => {
    if (model.apply(op)) sender.push(op);
  };
  const guessed = state.correctGuesses.length;

  return (
    <div className="flex h-dvh flex-col">
      <PlayerHeader state={state}>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-white/55">Zeichne:</span>
          <span className="truncate text-2xl font-bold tracking-tight">{word}</span>
        </div>
      </PlayerHeader>

      <div className="px-4 pb-1 text-xs text-white/50">
        {guessed > 0 ? <span className="font-semibold text-emerald-300">{guessed} haben es schon erraten!</span> : 'Zeichne – keine Buchstaben oder Zahlen 😉'}
      </div>

      <div className="relative min-h-0 flex-1 px-3 [container-type:size]">
        <div className="mx-auto" style={{ width: 'min(100cqw, 100cqh)' }}>
          <DrawingPad model={model} colorIndex={eraser ? ERASER_COLOR_INDEX : color} size={size} onOp={pushOp} />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 pt-3 safe-pb">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          {PALETTE.map((c, i) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                setColor(i);
                setEraser(false);
              }}
              aria-label={`Farbe ${c}`}
              className={`size-9 shrink-0 rounded-full border border-white/20 transition ${!eraser && color === i ? 'ring-[3px] ring-white ring-offset-2 ring-offset-ink-950' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center justify-between rounded-2xl bg-white/[0.07] p-1.5">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-label={`Strichstärke ${s}`}
                className={`grid size-10 place-items-center rounded-xl transition ${size === s ? 'bg-white/20' : ''}`}
              >
                <span className="rounded-full bg-white" style={{ width: Math.max(4, s * 0.75), height: Math.max(4, s * 0.75) }} />
              </button>
            ))}
          </div>
          <ToolButton label="Radierer" active={eraser} onClick={() => setEraser((v) => !v)}>
            <Eraser className="size-5" />
          </ToolButton>
          <ToolButton label="Rückgängig" onClick={() => local({ k: 'u' })}>
            <Undo2 className="size-5" />
          </ToolButton>
          <ToolButton label="Alles löschen" danger onClick={() => local({ k: 'x' })}>
            <Trash2 className="size-5" />
          </ToolButton>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ children, label, active, danger, onClick }: { children: React.ReactNode; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`grid size-[52px] shrink-0 place-items-center rounded-2xl transition ${
        active ? 'bg-white text-black' : danger ? 'bg-rose-500/15 text-rose-200' : 'bg-white/[0.07] text-white'
      }`}
    >
      {children}
    </motion.button>
  );
}
