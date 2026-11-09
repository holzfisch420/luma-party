import { motion } from 'framer-motion';
import { Crosshair, Gamepad2, RotateCcw, Smartphone, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import { CAR_COLORS } from '../../game-config';
import { getTrack } from '../../tracks';
import type { RacerPrivateState, RacerPublicState } from '../../types';

type Mode = 'gyro' | 'classic';
const MODE_KEY = 'luma-racer-mode';
const INVERT_KEY = 'luma-racer-invert';
/** Neigung (Grad) für vollen Lenkeinschlag */
const FULL_TILT = 28;

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* egal */
    }
  },
};

const hasMotion = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

function screenAngle(): number {
  const a = (screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0) as number;
  return ((a % 360) + 360) % 360;
}

/** Schwerkraft entlang der waagrechten Bildschirmachse (m/s²) */
function sideGravity(e: DeviceMotionEvent): number | null {
  const g = e.accelerationIncludingGravity;
  if (!g || g.x == null || g.y == null) return null;
  const a = screenAngle();
  let v = a === 90 ? g.y : a === 270 ? -g.y : a === 180 ? -g.x : g.x;
  if (isIOS) v = -v; // iOS meldet die Schwerkraft mit umgekehrtem Vorzeichen
  return v;
}

/** Handy-Controller: Neigen zum Lenken (Gyro) oder klassisch mit Joystick, Gas und Bremse. */
export function RacerController({ me, state, sendAction }: PlayerViewProps<RacerPublicState, RacerPrivateState>) {
  const pub = state.public;
  const priv = state.private;
  const [mode, setMode] = useState<Mode>(() => (store.get(MODE_KEY) === 'classic' || !hasMotion ? 'classic' : 'gyro'));
  const [gyroOk, setGyroOk] = useState<boolean | null>(null);
  const [invert, setInvert] = useState(store.get(INVERT_KEY) === '1');
  const [steerView, setSteerView] = useState(0);
  const input = useRef({ s: 0, g: 0, b: 0 });
  const sent = useRef({ s: 9, g: -1, b: -1, at: 0 });
  const neutral = useRef(0);
  const lastSide = useRef(0);
  const color = CAR_COLORS[(priv?.slot ?? 0) % CAR_COLORS.length]!.hex;
  const track = getTrack(pub.trackId);
  const me2 = pub.players.find((p) => p.playerId === me.id);

  // Eingaben gedrosselt senden (max. ~30/s, sonst alle 250 ms als Lebenszeichen)
  const flush = useCallback(
    (force = false) => {
      const i = input.current;
      const s = sent.current;
      const t = performance.now();
      const changed = Math.abs(i.s - s.s) > 0.03 || i.g !== s.g || i.b !== s.b;
      if (!force && !changed && t - s.at < 250) return;
      if (!force && changed && t - s.at < 30) return;
      sendAction('input', { s: Math.round(i.s * 100) / 100, g: i.g, b: i.b });
      sent.current = { ...i, at: t };
    },
    [sendAction],
  );
  useEffect(() => {
    const id = setInterval(() => {
      flush();
      setSteerView(input.current.s);
    }, 33);
    return () => clearInterval(id);
  }, [flush]);

  // Neige-Lenkung
  useEffect(() => {
    if (mode !== 'gyro' || !gyroOk) return;
    const onMotion = (e: DeviceMotionEvent) => {
      const side = sideGravity(e);
      if (side === null) return;
      lastSide.current = side;
      const raw = (side - neutral.current) / (9.81 * Math.sin((FULL_TILT * Math.PI) / 180));
      let s = Math.max(-1, Math.min(1, raw)) * (invert ? -1 : 1);
      if (Math.abs(s) < 0.06) s = 0;
      // leicht glätten
      input.current.s = input.current.s * 0.5 + s * 0.5;
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [mode, gyroOk, invert]);

  const enableGyro = async () => {
    try {
      const req = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
      if (typeof req === 'function') {
        const res = await req();
        if (res !== 'granted') throw new Error('abgelehnt');
      }
      setGyroOk(true);
      // kurz warten, dann aktuelle Haltung als Mitte nehmen
      setTimeout(() => (neutral.current = lastSide.current), 400);
    } catch {
      setGyroOk(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    store.set(MODE_KEY, m);
    input.current.s = 0;
    if (m === 'gyro' && !gyroOk) void enableGyro();
  };

  // bei neuem Rennen alles loslassen
  useEffect(() => {
    input.current = { s: 0, g: 0, b: 0 };
    flush(true);
  }, [pub.race, flush]);

  // Haptik
  const prevCp = useRef(priv?.checkpoint ?? 0);
  useEffect(() => {
    if (priv && priv.checkpoint !== prevCp.current) haptics.play('light');
    prevCp.current = priv?.checkpoint ?? 0;
  }, [priv?.checkpoint, priv]);
  useEffect(() => {
    if (priv?.finished) haptics.play('success');
  }, [priv?.finished]);
  useEffect(() => {
    if (priv?.falling) haptics.play('error');
  }, [priv?.falling]);
  const cd = Math.ceil(useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 200) / 1000);
  useEffect(() => {
    if (pub.phase === 'countdown' && cd > 0 && cd <= 3) haptics.play('tick');
    if (pub.phase === 'race') haptics.play('medium');
  }, [cd, pub.phase]);

  const press = (key: 'g' | 'b') => (down: boolean) => {
    input.current[key] = down ? 1 : 0;
    flush(true);
  };

  let status: string;
  if (!priv || priv.slot < 0) status = 'Alle 8 Plätze belegt – schau am Fernseher zu.';
  else if (!priv.inRace) status = 'Du fährst im nächsten Rennen mit.';
  else if (pub.phase === 'intro') status = `${track.name} – gleich geht's los`;
  else if (pub.phase === 'countdown') status = cd <= 3 ? `${cd || 'LOS'}!` : 'Bereit machen …';
  else if (pub.phase === 'results') status = me2?.dnf ? 'Nicht im Ziel' : `Platz ${me2?.place ?? '–'} · +${me2?.gained ?? 0} Punkte`;
  else if (priv.finished) status = `🏁 Im Ziel – Platz ${priv.place}`;
  else if (priv.falling) status = 'Runtergefallen!';
  else status = `Platz ${priv.place} · ${track.closed ? `Runde ${priv.lap}/${priv.laps}` : `Checkpoint ${priv.checkpoint}/${priv.checkpoints}`}`;

  const needGyroTap = mode === 'gyro' && gyroOk !== true;

  return (
    <div className="fixed inset-0 flex select-none flex-col overflow-hidden bg-[#141823] font-sans text-white safe-pt safe-pb" style={{ touchAction: 'none' }}>
      {/* Kopfzeile */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="size-4 rounded-full" style={{ background: color }} />
        <motion.div key={status} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 flex-1 truncate text-lg font-black">
          {status}
        </motion.div>
        <button onClick={() => switchMode(mode === 'gyro' ? 'classic' : 'gyro')} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black" aria-label="Steuerung wechseln">
          {mode === 'gyro' ? <Gamepad2 className="size-4" /> : <Smartphone className="size-4" />}
          {mode === 'gyro' ? 'Joystick' : 'Neigen'}
        </button>
        <button
          onClick={() => {
            haptics.play('medium');
            sendAction('reset');
          }}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black"
          aria-label="Zurück zum letzten Checkpoint"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>

      {mode === 'gyro' ? (
        <div className="relative flex min-h-0 flex-1 gap-2 p-2">
          <Pedal label="BREMSE" color="#e03131" onChange={press('b')} className="flex-1" />
          <Pedal label="GAS" color="#2f9e44" onChange={press('g')} className="flex-[1.3]" />
          {/* Lenkanzeige */}
          <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 flex-col items-center gap-1">
            <motion.div animate={{ rotate: steerView * 70 }} transition={{ duration: 0.05 }} className="grid size-16 place-items-center rounded-full border-[6px] border-white/80 bg-black/30">
              <div className="h-6 w-1.5 -translate-y-3 rounded-full bg-white/90" />
            </motion.div>
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            <button onClick={() => (neutral.current = lastSide.current)} className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-black" aria-label="Lenkung zentrieren">
              <Crosshair className="size-3.5" /> Mitte
            </button>
            <button
              onClick={() => {
                setInvert((v) => {
                  store.set(INVERT_KEY, v ? '0' : '1');
                  return !v;
                });
              }}
              className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-black"
            >
              <Undo2 className="size-3.5" /> {invert ? 'Lenkung normal' : 'Lenkung umkehren'}
            </button>
          </div>
          {needGyroTap && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
              <div className="flex max-w-sm flex-col items-center gap-4">
                <Smartphone className="size-12 rotate-90" />
                <p className="text-lg font-bold">Handy quer halten und wie ein Lenkrad neigen. Dafür braucht die Seite Zugriff auf die Bewegungssensoren.</p>
                {gyroOk === false && <p className="font-bold text-[#ff8787]">Kein Zugriff auf die Sensoren – nutze den Joystick oder erlaube den Zugriff (auf dem iPhone nur über https).</p>}
                <button onClick={() => void enableGyro()} className="rounded-2xl bg-[#7c5cff] px-6 py-3 text-xl font-black shadow-[0_5px_0_#4c2fc7]">
                  Neige-Lenkung aktivieren
                </button>
                <button onClick={() => switchMode('classic')} className="text-sm font-black underline">
                  Lieber mit Joystick
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2 p-2">
          <SteerPad onChange={(s) => (input.current.s = s)} className="flex-[1.4]" />
          <div className="flex flex-1 flex-col gap-2">
            <Pedal label="GAS" color="#2f9e44" onChange={press('g')} className="flex-[1.6]" />
            <Pedal label="BREMSE" color="#e03131" onChange={press('b')} className="flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}

/** großes Pedal – Multitouch-fähig */
function Pedal({ label, color, onChange, className = '' }: { label: string; color: string; onChange: (down: boolean) => void; className?: string }) {
  const [down, setDown] = useState(false);
  const pointer = useRef<number | null>(null);
  const up = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setDown(false);
    onChange(false);
  };
  return (
    <button
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* egal */
        }
        setDown(true);
        haptics.play('light');
        onChange(true);
      }}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`grid place-items-center rounded-3xl text-3xl font-black tracking-wider transition-[transform,filter] duration-75 ${down ? 'scale-[0.97] brightness-125' : ''} ${className}`}
      style={{ background: `linear-gradient(180deg, ${color}, ${color}cc)`, boxShadow: down ? 'none' : '0 6px 0 rgba(0,0,0,0.35)' }}
    >
      {label}
    </button>
  );
}

/** klassischer Lenk-Joystick: nur links/rechts, springt beim Loslassen in die Mitte */
function SteerPad({ onChange, className = '' }: { onChange: (s: number) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const origin = useRef(0);
  const [knob, setKnob] = useState(0);
  const range = 90;
  const move = (clientX: number) => {
    const s = Math.max(-1, Math.min(1, (clientX - origin.current) / range));
    setKnob(s);
    onChange(Math.abs(s) < 0.05 ? 0 : s);
  };
  const end = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setKnob(0);
    onChange(0);
  };
  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* egal */
        }
        origin.current = e.clientX;
        haptics.play('light');
        move(e.clientX);
      }}
      onPointerMove={(e) => pointer.current === e.pointerId && move(e.clientX)}
      onPointerUp={end}
      onPointerCancel={end}
      className={`relative grid place-items-center rounded-3xl bg-white/5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-28 rounded-full border-4 border-white/70 bg-white/20 shadow-xl" style={{ transform: `translate(calc(-50% + ${knob * range}px), -50%)` }} />
      <span className="pointer-events-none absolute bottom-3 text-sm font-black text-white/50">← Lenken →</span>
    </div>
  );
}
