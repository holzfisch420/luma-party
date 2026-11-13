import { useEffect, useRef, useState } from 'react';
import { sessionStore, useSession } from './session-store';
import { getSocket } from './socket';
import { useToast } from '../../components/ui/Toast';

/** Abonniert ein Spielereignis (z. B. Zeichenoperationen oder Chat). */
export function useGameEvent<T>(name: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => sessionStore.onGameEvent(name, (p) => ref.current(p as T)), [name]);
}

/** Server-synchronisierte Restzeit in Millisekunden. */
export function useCountdown(endsAt: number | null | undefined, intervalMs = 200): number {
  const offset = useSession((s) => s.clockOffset);
  const calc = () => (endsAt ? Math.max(0, endsAt - (Date.now() + offset)) : 0);
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    setRemaining(calc());
    if (!endsAt) return;
    const t = setInterval(() => setRemaining(calc()), intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, offset, intervalMs]);
  return remaining;
}

/**
 * Restzeit in ganzen Sekunden – rendert nur, wenn sich die Sekunde ändert
 * (günstiger als useCountdown für reine Zahlenanzeigen).
 */
export function useSecondsLeft(endsAt: number | null | undefined): number {
  const offset = useSession((s) => s.clockOffset);
  const calc = () => (endsAt ? Math.max(0, Math.ceil((endsAt - (Date.now() + offset)) / 1000)) : 0);
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    setSecs(calc());
    if (!endsAt) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const v = calc();
      setSecs(v);
      if (v <= 0) return;
      // bis kurz nach dem nächsten Sekundenwechsel warten
      const msToNext = ((endsAt - (Date.now() + offset)) % 1000) + 15;
      t = setTimeout(tick, Math.max(30, msToNext));
    };
    tick();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, offset]);
  return secs;
}

/** Zeigt Server-Hinweise als Toast an. */
export function useNoticeToasts() {
  const toast = useToast();
  useEffect(() => sessionStore.onNotice((n) => toast(n.message, n.kind)), [toast]);
}

/** Sendet eine Spielaktion an den Server. */
export function sendGameAction(type: string, payload?: unknown) {
  getSocket().emit('game:action', { type, payload });
}
