import { useCallback, useEffect, useRef } from 'react';
import { DRAW_LIMITS } from '../logic/draw-model';
import type { DrawOp } from '../types';

const FLUSH_INTERVAL_MS = 35;

/**
 * Bündelt Zeichenoperationen und sendet sie ~30× pro Sekunde.
 * Aufeinanderfolgende Punkte desselben Strichs werden zu einer Operation zusammengefasst.
 */
export function useDrawingSender(send: (ops: DrawOp[]) => void) {
  const queue = useRef<DrawOp[]>([]);
  const sendRef = useRef(send);
  sendRef.current = send;

  const flush = useCallback(() => {
    const ops = queue.current;
    if (ops.length === 0) return;
    queue.current = [];
    for (let i = 0; i < ops.length; i += DRAW_LIMITS.maxOpsPerMessage) {
      sendRef.current(ops.slice(i, i + DRAW_LIMITS.maxOpsPerMessage));
    }
  }, []);

  useEffect(() => {
    const t = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      clearInterval(t);
      flush();
    };
  }, [flush]);

  const push = useCallback(
    (op: DrawOp) => {
      const q = queue.current;
      const last = q[q.length - 1];
      if (op.k === 'p' && last?.k === 'p' && last.id === op.id && last.pts.length + op.pts.length <= DRAW_LIMITS.maxPointsPerOp * 2) {
        last.pts.push(...op.pts);
        return;
      }
      q.push(op.k === 'p' ? { ...op, pts: [...op.pts] } : op);
      if (op.k !== 'p') flush(); // Strichbeginn/Undo/Leeren sofort senden
    },
    [flush],
  );

  return { push, flush };
}
