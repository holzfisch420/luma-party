/** kleine Hooks, um Geräusche an Spielzustände zu koppeln */
import { useEffect, useRef } from 'react';
import { useSession } from '../session/session-store';

/** spielt beim Wechsel in eine Phase den passenden Klang (nicht beim ersten Anzeigen) */
export function usePhaseSfx<P extends string>(phase: P, key: unknown, sounds: Partial<Record<P, () => void>>) {
  const last = useRef<string | null>(null);
  const id = `${phase}|${String(key)}`;
  useEffect(() => {
    if (last.current !== null && last.current !== id) sounds[phase]?.();
    last.current = id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

/** ruft fn auf, wenn eine Zahl größer wird (z. B. richtige Antworten) */
export function useCountUp(n: number, fn: (n: number) => void) {
  const last = useRef(n);
  useEffect(() => {
    if (n > last.current) fn(n);
    last.current = n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
}

/** tickt in den letzten Sekunden vor endsAt */
export function useLastSeconds(endsAt: number | null | undefined, seconds: number, tick: (left: number) => void, active = true) {
  const offset = useSession((s) => s.clockOffset);
  const fired = useRef(new Set<number>());
  useEffect(() => {
    fired.current.clear();
    if (!endsAt || !active) return;
    const t = setInterval(() => {
      const left = Math.ceil((endsAt - (Date.now() + offset)) / 1000);
      if (left > 0 && left <= seconds && !fired.current.has(left)) {
        fired.current.add(left);
        tick(left);
      }
    }, 120);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, active, offset, seconds]);
}
