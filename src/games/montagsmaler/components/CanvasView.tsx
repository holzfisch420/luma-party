import { forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from 'react';
import { drawStroke, redrawAll } from './canvas-render';
import type { StrokeModel } from '../logic/stroke-model';

interface CanvasViewProps extends HTMLAttributes<HTMLCanvasElement> {
  model: StrokeModel;
}

/** Quadratische Zeichenfläche, die ein StrokeModel scharf (HiDPI) und inkrementell rendert. */
export const CanvasView = forwardRef<HTMLCanvasElement, CanvasViewProps>(function CanvasView({ model, className = '', ...rest }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => canvasRef.current!);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const size = Math.max(1, Math.round(rect.width * dpr));
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      redrawAll(ctx, model.strokes);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const unsub = model.subscribe((change) => {
      if (change.kind === 'redraw') redrawAll(ctx, model.strokes);
      else drawStroke(ctx, change.stroke, change.fromPoint);
    });
    return () => {
      ro.disconnect();
      unsub();
    };
  }, [model]);

  return <canvas ref={canvasRef} className={`block aspect-square w-full bg-white ${className}`} {...rest} />;
});
