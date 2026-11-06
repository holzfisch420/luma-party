import { useRef, useState, type PointerEvent } from 'react';

/**
 * Schwebender Joystick: erscheint dort, wo der Daumen die Fläche berührt.
 * Liefert x/y im Bereich -1..1 (y nach unten positiv).
 */
export function Joystick({ onChange, color }: { onChange: (x: number, y: number) => void; color: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const active = useRef<{ id: number; cx: number; cy: number } | null>(null);
  const [view, setView] = useState<{ cx: number; cy: number; kx: number; ky: number } | null>(null);
  const RADIUS = 56;

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const a = active.current;
    if (!a) return;
    let dx = e.clientX - a.cx;
    let dy = e.clientY - a.cy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) {
      dx = (dx / d) * RADIUS;
      dy = (dy / d) * RADIUS;
    }
    setView({ cx: a.cx, cy: a.cy, kx: dx, ky: dy });
    onChange(dx / RADIUS, dy / RADIUS);
  };

  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current?.id !== e.pointerId) return;
    active.current = null;
    setView(null);
    onChange(0, 0);
  };

  const rect = zone.current?.getBoundingClientRect();
  return (
    <div
      ref={zone}
      className="touch-none-all relative size-full"
      onPointerDown={(e) => {
        if (active.current) return;
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignorieren */
        }
        active.current = { id: e.pointerId, cx: e.clientX, cy: e.clientY };
        setView({ cx: e.clientX, cy: e.clientY, kx: 0, ky: 0 });
        navigator.vibrate?.(8);
      }}
      onPointerMove={(e) => active.current?.id === e.pointerId && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      {view && rect ? (
        <div className="pointer-events-none absolute" style={{ left: view.cx - rect.left, top: view.cy - rect.top }}>
          <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/15" style={{ width: RADIUS * 2 + 44, height: RADIUS * 2 + 44 }} />
          <div
            className="absolute size-20 rounded-full shadow-[0_5px_0_rgba(0,0,0,0.25),0_8px_14px_rgba(0,0,0,0.25)]"
            style={{ transform: `translate(calc(-50% + ${view.kx}px), calc(-50% + ${view.ky}px))`, background: color }}
          />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="grid size-40 place-items-center rounded-full bg-black/10 text-center text-sm font-bold text-white/75">
            Daumen
            <br />
            hier
          </div>
        </div>
      )}
    </div>
  );
}
