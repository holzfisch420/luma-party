import { motion } from 'framer-motion';
import { Eraser, Trash2, Undo2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { BRUSH_SIZES, ERASER_COLOR_INDEX, PALETTE } from '../../game-config';
import { useDrawingSender } from '../../hooks/useDrawingSender';
import type { StrokeModel } from '../../logic/stroke-model';
import type { DrawOp, MontagsmalerPublicState } from '../../types';
import { DrawingPad } from '../DrawingPad';
import { DrawingSheet } from '../DrawingSheet';
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
  const local = (op: DrawOp) => {
    if (model.apply(op)) sender.push(op);
  };
  const guessed = state.correctGuesses.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlayerHeader state={state}>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-bold">Zeichne:</span>
          <span className="font-bangers truncate text-3xl leading-none">{word}</span>
        </div>
      </PlayerHeader>

      <div className="px-4 pb-2 text-sm font-bold">
        {guessed > 0 ? <span className="rounded bg-pop-green px-1.5">{guessed} haben es schon erraten!</span> : 'Keine Buchstaben oder Zahlen malen 😉'}
      </div>

      <div className="relative min-h-0 flex-1 px-4 [container-type:size]">
        <div className="mx-auto" style={{ width: 'min(calc(100cqw - 8px), calc(100cqh - 8px))' }}>
          <DrawingSheet tape={false}>
            <DrawingPad model={model} colorIndex={eraser ? ERASER_COLOR_INDEX : color} size={size} onOp={(op) => sender.push(op)} />
          </DrawingSheet>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 pt-3 safe-pb">
        <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-2 py-1.5">
          {PALETTE.map((c, i) => {
            const active = !eraser && color === i;
            return (
              <motion.button
                key={c}
                whileTap={{ scale: 0.8 }}
                animate={{ y: active ? -4 : 0, rotate: active ? -8 : 0 }}
                onClick={() => {
                  setColor(i);
                  setEraser(false);
                }}
                aria-label={`Farbe ${c}`}
                className={`size-10 shrink-0 rounded-[45%_55%_50%_50%] border-[3px] border-ink ${active ? 'shadow-[3px_3px_0_#161616] ring-4 ring-pop-yellow' : 'shadow-[2px_2px_0_#161616]'}`}
                style={{ background: c }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="comic-box-sm flex flex-1 items-center justify-between p-1">
            {BRUSH_SIZES.map((s) => (
              <button key={s} onClick={() => setSize(s)} aria-label={`Strichstärke ${s}`} className={`grid size-10 place-items-center rounded-lg ${size === s ? 'bg-pop-yellow' : ''}`}>
                <span className="rounded-full bg-ink" style={{ width: Math.max(4, s * 0.8), height: Math.max(4, s * 0.8) }} />
              </button>
            ))}
          </div>
          <ToolButton label="Radierer" active={eraser} onClick={() => setEraser((v) => !v)}>
            <Eraser className="size-6" />
          </ToolButton>
          <ToolButton label="Rückgängig" onClick={() => local({ k: 'u' })}>
            <Undo2 className="size-6" />
          </ToolButton>
          <ToolButton label="Alles löschen" danger onClick={() => local({ k: 'x' })}>
            <Trash2 className="size-6" />
          </ToolButton>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ children, label, active, danger, onClick }: { children: ReactNode; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ x: 2, y: 2, boxShadow: '0 0 0 #161616' }}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`grid size-[52px] shrink-0 place-items-center rounded-xl border-[3px] border-ink shadow-[3px_3px_0_#161616] ${active ? 'bg-pop-yellow' : danger ? 'bg-pop-red text-white' : 'bg-white'}`}
    >
      {children}
    </motion.button>
  );
}
