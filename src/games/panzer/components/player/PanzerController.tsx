import { motion } from 'framer-motion';
import { haptics } from '../../../../app/haptics';
import { Check, Crosshair, Maximize, Play, RotateCcw, RotateCw, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCountdown, useSecondsLeft } from '../../../../app/session/hooks';
import { useSession } from '../../../../app/session/session-store';
import type { PlayerViewProps } from '../../../game-types';
import { BTN, POWERUPS, TAP_MS, TANK_COLORS } from '../../game-config';
import { getMap } from '../../maps';
import type { PanzerPrivateState, PanzerPublicState } from '../../types';
import { panzerColorCache } from '../colors-cache';
import { TankIcon } from '../TankIcon';

function useLandscape() {
  const get = () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
  const [landscape, setLandscape] = useState(get);
  useEffect(() => {
    const on = () => setLandscape(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return landscape;
}

async function goFullscreen() {
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {
    /* nicht überall erlaubt (z. B. iPhone) */
  }
}

export function PanzerController({ room, me, state, sendAction }: PlayerViewProps<PanzerPublicState, PanzerPrivateState>) {
  const pub = state.public;
  const priv = state.private;
  const landscape = useLandscape();

  useEffect(() => panzerColorCache.set(pub.players), [pub.players]);

  if (!priv) return null;
  if (priv.slot < 0) {
    return (
      <Shell>
        <div className="grid h-full place-items-center p-6 text-center text-white">
          <div>
            <div className="text-4xl font-black">Arena voll!</div>
            <p className="mt-2 font-bold text-white/80">Es können höchstens 8 Panzer mitfahren – schau am Fernseher zu.</p>
          </div>
        </div>
      </Shell>
    );
  }
  if (pub.phase === 'colors') return <ColorPicker pub={pub} priv={priv} meId={me.id} room={room} sendAction={sendAction} landscape={landscape} />;
  return <Gamepad pub={pub} priv={priv} meId={me.id} room={room} sendAction={sendAction} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flat touch-none-all fixed inset-0 overflow-hidden bg-[#578a34]">{children}</div>;
}

// ------------------------------------------------------------------ Farbwahl

function ColorPicker({
  pub,
  priv,
  meId,
  room,
  sendAction,
  landscape,
}: {
  pub: PanzerPublicState;
  priv: PanzerPrivateState;
  meId: string;
  room: PlayerViewProps['room'];
  sendAction: PlayerViewProps['sendAction'];
  landscape: boolean;
}) {
  const mine = pub.players.find((p) => p.playerId === meId);
  const takenBy = new Map(pub.players.filter((p) => p.playerId !== meId).map((p) => [p.color, room.players.find((x) => x.id === p.playerId)?.name ?? '?']));
  const remaining = useCountdown(pub.phaseEndsAt, 250);
  const ready = !!mine?.ready;
  return (
    <div className="flat camo fixed inset-0 overflow-y-auto px-4 pb-4 safe-pt safe-pb">
      <div className={`mx-auto mt-8 flex max-w-3xl gap-5 ${landscape ? 'flex-row items-start' : 'flex-col'}`}>
        <div className={`flex flex-col items-center gap-3 ${landscape ? 'w-56 shrink-0' : ''}`}>
          <div className="text-3xl font-black">Dein Panzer</div>
          <motion.div key={priv.color} initial={{ scale: 0.6, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
            <TankIcon color={priv.color} className="size-32 drop-shadow-xl" angle={-60} />
          </motion.div>
          <div className="rounded-full bg-[#4a752c] px-4 py-1 text-xl font-black">{TANK_COLORS[priv.color]!.name}</div>
          <button
            onClick={() => sendAction('ready', { ready: !ready })}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-2xl font-black transition ${ready ? 'bg-[#1a73e8] text-white shadow-[0_5px_0_#1557b0]' : 'bg-white text-[#4a752c] shadow-[0_5px_0_rgba(0,0,0,0.2)]'}`}
          >
            {ready ? (
              <>
                <Check className="size-7" strokeWidth={3} /> Bereit!
              </>
            ) : (
              'Bereit?'
            )}
          </button>
          <div className="text-center text-xs font-bold text-white/80">Start, wenn alle bereit sind – spätestens in {Math.ceil(remaining / 1000)} s</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
            {TANK_COLORS.map((c, i) => {
              const owner = takenBy.get(i);
              const active = priv.color === i;
              return (
                <button
                  key={c.name}
                  disabled={!!owner || ready}
                  onClick={() => sendAction('color', { index: i })}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl bg-white shadow-[0_3px_0_rgba(0,0,0,0.18)] transition ${active ? 'ring-4 ring-[#ffd54f]' : ''} ${owner ? 'opacity-45' : ''}`}
                  aria-label={`${c.name}${owner ? ` (vergeben an ${owner})` : ''}`}
                >
                  <TankIcon color={i} className="size-4/5" angle={-90} />
                  {owner && <span className="absolute inset-x-0 bottom-0.5 truncate px-0.5 text-[9px] font-bold text-[#3c4043]">{owner}</span>}
                </button>
              );
            })}
          </div>
          <HapticsSwitch />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Gamepad

/** Ein einziger großer Knopf: tippen = Drehrichtung wechseln, halten = vorwärts fahren. */
function Gamepad({
  pub,
  priv,
  meId,
  room,
  sendAction,
}: {
  pub: PanzerPublicState;
  priv: PanzerPrivateState;
  meId: string;
  room: PlayerViewProps['room'];
  sendAction: PlayerViewProps['sendAction'];
}) {
  const [menu, setMenu] = useState(false);
  const landscape = useLandscape();
  const bits = useRef(0);
  const [pressed, setPressed] = useState(0);
  const mainDownAt = useRef(0);
  const offset = useSession((s) => s.clockOffset);
  const [now, setNow] = useState(Date.now());
  const mine = pub.players.find((p) => p.playerId === meId);
  const color = TANK_COLORS[priv.color]!.hex;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const setBit = useCallback(
    (bit: number, on: boolean) => {
      const next = on ? bits.current | bit : bits.current & ~bit;
      if (next === bits.current) return;
      bits.current = next;
      setPressed(next);
      sendAction('input', { b: next });
    },
    [sendAction],
  );
  const releaseAll = useCallback(
    (send = true) => {
      bits.current = 0;
      setPressed(0);
      if (send) sendAction('input', { b: 0 });
    },
    [sendAction],
  );

  // bei Rundenwechsel/Tod alle Knöpfe loslassen
  useEffect(() => {
    releaseAll();
  }, [pub.round, priv.alive, releaseAll]);
  useEffect(() => () => releaseAll(false), [releaseAll]);

  // Haptik bei Spielereignissen
  const wasAlive = useRef(priv.alive);
  useEffect(() => {
    if (wasAlive.current && !priv.alive && pub.phase !== 'countdown') haptics.play('error');
    wasAlive.current = priv.alive;
  }, [priv.alive, pub.phase]);
  const prevPower = useRef(priv.power);
  useEffect(() => {
    if (priv.power && priv.power !== prevPower.current) haptics.play('success');
    prevPower.current = priv.power;
  }, [priv.power]);
  const prevKills = useRef(mine?.kills ?? 0);
  useEffect(() => {
    const k = mine?.kills ?? 0;
    if (k > prevKills.current) haptics.play('double');
    prevKills.current = k;
  }, [mine?.kills]);
  const prevShield = useRef(priv.shieldUntil);
  useEffect(() => {
    // Schild von aktiv auf 0 = Treffer abgefangen
    if (prevShield.current > Date.now() + offset && priv.shieldUntil === 0 && priv.alive) haptics.play('heavy');
    prevShield.current = priv.shieldUntil;
  }, [priv.shieldUntil, priv.alive, offset]);
  const cdSecs = useSecondsLeft(pub.phase === 'countdown' ? pub.phaseEndsAt : null);
  useEffect(() => {
    if (pub.phase === 'countdown' && cdSecs > 0) haptics.play('tick');
    if (pub.phase === 'battle') haptics.play('medium');
  }, [cdSecs, pub.phase]);

  const serverNow = now + offset;
  const power = priv.power ? POWERUPS[priv.power] : null;
  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 200);
  const winnerName = room.players.find((p) => p.id === pub.roundWinnerId)?.name;
  const active = priv.alive && priv.inRound;
  const RotIcon = priv.rotDir === 1 ? RotateCw : RotateCcw;

  let status: React.ReactNode = null;
  if (pub.phase === 'countdown') status = `Runde ${pub.round} · ${getMap(pub.mapId).name} · ${Math.ceil(remaining / 1000)}`;
  else if (pub.phase === 'roundEnd') status = winnerName ? `${winnerName} gewinnt die Runde!` : 'Unentschieden!';
  else if (!priv.inRound) status = 'Du steigst in der nächsten Runde ein';
  else if (!priv.alive) status = '💥 Zerstört – warte auf die nächste Runde';

  return (
    <Shell>
      {/* Kopfzeile */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-3 bg-[#4a752c] px-4 shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
        <TankIcon color={priv.color} className="size-8" angle={-90} dead={!priv.alive} />
        <div className="min-w-0 flex-1 truncate text-lg font-black">
          {room.players.find((p) => p.id === meId)?.name}
          <span className="ml-3 text-base text-[#ffd54f]">
            {'🏆'.repeat(mine?.score ?? 0)}
            <span className="opacity-40 grayscale">{'🏆'.repeat(Math.max(0, pub.winScore - (mine?.score ?? 0)))}</span>
          </span>
        </div>
        <span className="h-6 w-6 rounded-full" style={{ background: color }} />
        <button onClick={() => setMenu((m) => !m)} className="grid size-9 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Optionen">
          <Settings2 className="size-5" />
        </button>
      </div>

      {/* Knöpfe: Fahren (groß), Schießen, Item */}
      <div className={`absolute inset-x-0 bottom-0 top-12 flex gap-4 p-4 safe-pb ${landscape ? 'flex-row items-center' : 'flex-col items-center justify-center'}`}>
        <div className={`flex flex-col items-center justify-center gap-2 ${landscape ? 'h-full flex-1' : ''}`}>
          <HoldButton
            ariaLabel="Fahren: halten = vorwärts, loslassen = drehen, tippen = Drehrichtung wechseln"
            disabled={!active}
            down={(pressed & BTN.main) !== 0}
            className={landscape ? 'size-[min(46vw,80vh,420px)]' : 'size-[min(74vw,44vh,400px)]'}
            style={{ background: color }}
            onDown={() => {
              mainDownAt.current = performance.now();
              haptics.play('medium');
              setBit(BTN.main, true);
            }}
            onUp={() => {
              if (performance.now() - mainDownAt.current < TAP_MS) haptics.play('light');
              setBit(BTN.main, false);
            }}
          >
            {pressed & BTN.main ? (
              <motion.span key="drive" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[min(12vw,9vh)] font-black leading-none drop-shadow">
                ▲
              </motion.span>
            ) : (
              <motion.span key={`rot${priv.rotDir}`} initial={{ rotate: priv.rotDir * -90, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <RotIcon className="size-[min(18vw,13vh)] drop-shadow" strokeWidth={3} />
              </motion.span>
            )}
            <span className="text-[min(5.5vw,4vh)] font-black drop-shadow">{pressed & BTN.main ? 'Fahren!' : priv.rotDir === 1 ? 'Rechts herum' : 'Links herum'}</span>
          </HoldButton>
          <div className="text-center text-xs font-bold text-white/85">Halten = fahren · Loslassen = drehen · Tippen = Richtung wechseln</div>
        </div>
        <div className={`flex items-center justify-center gap-4 ${landscape ? 'h-full flex-col pr-4' : 'w-full flex-row'}`}>
          <HoldButton
            ariaLabel={power ? `Item einsetzen: ${power.name}` : 'Item einsetzen (kein Item)'}
            disabled={!active || !power}
            down={(pressed & BTN.item) !== 0}
            className={landscape ? 'size-[min(20vw,34vh,170px)]' : 'size-[min(30vw,24vh,170px)]'}
            style={{ background: power ? power.color : '#9aa0a6' }}
            onDown={() => {
              haptics.play('heavy');
              setBit(BTN.item, true);
            }}
            onUp={() => setBit(BTN.item, false)}
          >
            <span className="text-[min(10vw,8vh)] leading-none">{power ? power.icon : '–'}</span>
            <span className="text-[min(3.6vw,2.6vh)] font-black leading-tight drop-shadow">{power ? power.name : 'Item'}</span>
          </HoldButton>
          <HoldButton
            ariaLabel="Schießen"
            disabled={!active}
            down={(pressed & BTN.fire) !== 0}
            className={landscape ? 'size-[min(28vw,46vh,230px)]' : 'size-[min(38vw,30vh,210px)]'}
            style={{ background: '#ea4335' }}
            onDown={() => {
              haptics.play('medium');
              setBit(BTN.fire, true);
            }}
            onUp={() => setBit(BTN.fire, false)}
          >
            <Crosshair className="size-[min(13vw,10vh)] drop-shadow" strokeWidth={2.6} />
            <span className="text-[min(4.4vw,3.2vh)] font-black drop-shadow">Feuer</span>
          </HoldButton>
        </div>
      </div>

      {status && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-10 flex justify-center px-3">
          <div className="flat-card px-4 py-1.5 text-center text-lg font-black">{status}</div>
        </div>
      )}
      {priv.alive && priv.shieldUntil > serverNow && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[#4285f4] px-3 py-1 text-sm font-bold">🛡️ Schild aktiv</div>
      )}

      {menu && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-4" onClick={() => setMenu(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#578a34] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl font-black">Optionen</div>
            <HapticsSwitch />
            <div className="mt-3 flex gap-2">
              <button onClick={() => void goFullscreen()} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-3 py-2.5 text-lg font-black text-[#4a752c]">
                <Maximize className="size-5" /> Vollbild
              </button>
              <button onClick={() => setMenu(false)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-3 py-2.5 text-lg font-black text-white">
                <Play className="size-5" /> Weiter
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/** Vibration an/aus – mit Hinweis, was auf diesem Gerät möglich ist */
function HapticsSwitch() {
  const [on, setOn] = useState(haptics.isEnabled());
  if (!haptics.supported) return null;
  return (
    <button
      onClick={() => {
        haptics.setEnabled(!on);
        setOn(!on);
      }}
      className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-[#4a752c] px-3 py-2.5 text-left"
    >
      <span>
        <span className="block text-lg font-black leading-tight">📳 Vibration</span>
        <span className="block text-[11px] font-bold leading-tight text-white/75">
          {haptics.mode === 'ios' ? 'iPhone: kurze Klicks bei Tastendruck (ab iOS 18)' : 'Spürbare Rückmeldung bei Tasten und Treffern'}
        </span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-[#1a73e8]' : 'bg-white/25'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

/** Runder, flacher Knopf mit eigenem Finger (Multi-Touch-fähig) */
function HoldButton({
  ariaLabel,
  disabled,
  down,
  className,
  style,
  onDown,
  onUp,
  children,
}: {
  ariaLabel: string;
  disabled?: boolean;
  down: boolean;
  className: string;
  style: React.CSSProperties;
  onDown: () => void;
  onUp: () => void;
  children: React.ReactNode;
}) {
  const pointer = useRef<number | null>(null);
  const up = (e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    onUp();
  };
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* egal */
        }
        onDown();
      }}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative flex shrink-0 select-none flex-col items-center justify-center gap-1 rounded-full text-white transition-[transform,box-shadow] duration-75 disabled:opacity-40 ${down ? 'translate-y-1.5 shadow-[0_2px_0_rgba(0,0,0,0.3)]' : 'shadow-[0_10px_0_rgba(0,0,0,0.3)]'} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
