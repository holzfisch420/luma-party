import { useRef, type PointerEvent } from 'react';
import { COORD_MAX } from '../game-config';
import type { StrokeModel } from '../logic/stroke-model';
import type { DrawOp } from '../types';
import { CanvasView } from './CanvasView';

interface DrawingPadProps {
  model: StrokeModel;
  colorIndex: number;
  size: number;
  disabled?: boolean;
  onOp: (op: DrawOp) => void;
}

const MIN_DISTANCE = 2; // in Koordinaten-Einheiten (0..1000)

/** Touch-/Maus-Zeichenfläche auf Basis von Pointer Events. */
export function DrawingPad({ model, colorIndex, size, disabled, onOp }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<{ id: number; pointerId: number; lastX: number; lastY: number } | null>(null);

  const toCoords = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(COORD_MAX, Math.round(v)));
    return { x: clamp(((e.clientX - rect.left) / rect.width) * COORD_MAX), y: clamp(((e.clientY - rect.top) / rect.height) * COORD_MAX) };
  };

  const emit = (op: DrawOp) => {
    if (model.apply(op)) onOp(op);
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || active.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toCoords(e);
    const id = model.lastStrokeId + 1;
    active.current = { id, pointerId: e.pointerId, lastX: x, lastY: y };
    emit({ k: 's', id, c: colorIndex, w: size, x, y });
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    e.preventDefault();
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [];
    const samples = events.length ? events : [e.nativeEvent];
    const pts: number[] = [];
    for (const ev of samples) {
      const { x, y } = toCoords(ev);
      if (Math.hypot(x - a.lastX, y - a.lastY) < MIN_DISTANCE) continue;
      pts.push(x, y);
      a.lastX = x;
      a.lastY = y;
    }
    if (pts.length) emit({ k: 'p', id: a.id, pts });
  };

  const end = (e: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId === e.pointerId) active.current = null;
  };

  return (
    <div className="touch-none-all relative overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
      <CanvasView
        ref={canvasRef}
        model={model}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        className={disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}
      />
    </div>
  );
}
