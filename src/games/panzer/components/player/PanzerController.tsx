import { motion } from 'framer-motion';
import { haptics } from '../../../../app/haptics';
import { Check, Maximize, RotateCcw, Settings2, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCountdown } from '../../../../app/session/hooks';
import { useSession } from '../../../../app/session/session-store';
import type { PlayerViewProps } from '../../../game-types';
import { BTN, POWERUPS, TANK_COLORS } from '../../game-config';
import { getMap } from '../../maps';
import type { PanzerPrivateState, PanzerPublicState, Steering } from '../../types';
import { panzerColorCache } from '../colors-cache';
import { TankIcon } from '../TankIcon';
import { Joystick } from './Joystick';
import { PadButton } from './PadButton';

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

async function goFullscreenLandscape() {
  try {
    await document.documentElement.requestFullscreen?.();
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
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
  if (!landscape) return <RotateHint />;
  return <Gamepad pub={pub} priv={priv} meId={me.id} room={room} sendAction={sendAction} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flat touch-none-all fixed inset-0 overflow-hidden bg-[#578a34]">{children}</div>;
}

function RotateHint() {
  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center text-white">
        <motion.div animate={{ rotate: [0, -90, -90, 0] }} transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.35, 0.75, 1] }}>
          <Smartphone className="size-20" strokeWidth={1.8} />
        </motion.div>
        <div>
          <div className="text-4xl font-black">Handy quer halten!</div>
          <p className="mt-2 font-bold text-white/80">Links fährst du mit dem Joystick, rechts sind die Tasten.</p>
        </div>
        <button onClick={() => void goFullscreenLandscape()} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-lg font-black text-[#4a752c] shadow-[0_4px_0_rgba(0,0,0,0.2)]">
          <Maximize className="size-5" /> Vollbild &amp; quer
        </button>
      </div>
    </Shell>
  );
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
    <div className="flat fixed inset-0 overflow-y-auto bg-[#578a34] p-4 safe-pt safe-pb">
      <div className={`mx-auto flex max-w-3xl gap-5 ${landscape ? 'flex-row items-start' : 'flex-col'}`}>
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
          <SteeringSwitch value={priv.steering} onChange={(mode) => sendAction('steering', { mode })} />
          <HapticsSwitch />
          {!landscape && (
            <button onClick={() => void goFullscreenLandscape()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-lg font-black text-[#4a752c] shadow-[0_4px_0_rgba(0,0,0,0.2)]">
              <Maximize className="size-5" /> Vollbild &amp; quer drehen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SteeringSwitch({ value, onChange }: { value: Steering; onChange: (v: Steering) => void }) {
  return (
    <div className="mt-4 rounded-xl bg-[#4a752c] p-2">
      <div className="mb-1.5 px-1 text-sm font-bold text-white/85">Steuerung</div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['tank', 'Panzer', '↑↓ fahren · ←→ drehen'],
            ['direction', 'Richtung', 'Panzer fährt dorthin, wohin du zeigst'],
          ] as const
        ).map(([v, label, hint]) => (
          <button key={v} onClick={() => onChange(v)} className={`rounded-lg px-2.5 py-2 text-left transition ${value === v ? 'bg-white text-[#3c4043]' : 'bg-white/10 text-white'}`}>
            <div className="text-lg font-black leading-none">{label}</div>
            <div className="mt-0.5 text-[11px] font-bold leading-tight opacity-80">{hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Gamepad

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
  const input = useRef({ x: 0, y: 0, b: 0 });
  const sent = useRef({ x: 0, y: 0, b: 0, at: 0 });
  const [menu, setMenu] = useState(false);
  const offset = useSession((s) => s.clockOffset);
  const [now, setNow] = useState(Date.now());
  const mine = pub.players.find((p) => p.playerId === meId);
  const color = TANK_COLORS[priv.color]!.hex;

  const flush = useCallback(
    (force = false) => {
      const i = input.current;
      const s = sent.current;
      const t = performance.now();
      const moved = Math.abs(i.x - s.x) > 0.04 || Math.abs(i.y - s.y) > 0.04 || ((i.x === 0) !== (s.x === 0)) || ((i.y === 0) !== (s.y === 0));
      if (!force && i.b === s.b && (!moved || t - s.at < 40)) return;
      sendAction('input', { x: Math.round(i.x * 100) / 100, y: Math.round(i.y * 100) / 100, b: i.b });
      sent.current = { ...i, at: t };
    },
    [sendAction],
  );

  // Joystick regelmäßig senden (gedrosselt) + Anzeige der Abklingzeit
  useEffect(() => {
    const id = setInterval(() => {
      flush();
      setNow(Date.now());
    }, 40);
    return () => clearInterval(id);
  }, [flush]);

  // bei Rundenwechsel/Tod Eingaben zurücksetzen
  useEffect(() => {
    input.current = { x: 0, y: 0, b: 0 };
    flush(true);
  }, [pub.round, priv.alive, flush]);

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
  const cdSecs = Math.ceil(useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 200) / 1000);
  useEffect(() => {
    if (pub.phase === 'countdown' && cdSecs > 0) haptics.play('tick');
    if (pub.phase === 'battle') haptics.play('medium');
  }, [cdSecs, pub.phase]);

  const press = (bit: number) => (down: boolean) => {
    input.current.b = down ? input.current.b | bit : input.current.b & ~bit;
    flush(true);
  };

  const serverNow = now + offset;
  const turboLeft = Math.max(0, priv.turboReadyAt - serverNow);
  const power = priv.power ? POWERUPS[priv.power] : null;
  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 200);
  const winnerName = room.players.find((p) => p.id === pub.roundWinnerId)?.name;

  let status: React.ReactNode = null;
  if (pub.phase === 'countdown') status = `Runde ${pub.round} · ${getMap(pub.mapId).name} · ${Math.ceil(remaining / 1000)}`;
  else if (pub.phase === 'roundEnd') status = winnerName ? `${winnerName} gewinnt die Runde!` : 'Unentschieden!';
  else if (!priv.inRound) status = 'Du steigst in der nächsten Runde ein';
  else if (!priv.alive) status = '💥 Zerstört – warte auf die nächste Runde';

  return (
    <Shell>
      {/* Farbstreifen + Kopfzeile */}
      <div className="absolute inset-x-0 top-0 flex h-12 items-center gap-3 bg-[#4a752c] px-4 shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
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

      <div className="absolute inset-x-0 bottom-0 top-12 flex">
        {/* Joystick-Bereich */}
        <div className="h-full w-[48%]">
          <Joystick
            color={color}
            onChange={(x, y) => {
              input.current.x = x;
              input.current.y = y;
            }}
          />
        </div>

        {/* Tasten */}
        <div className="relative h-full flex-1">
          <div className="absolute left-1/2 top-1/2 size-[min(78vh,300px)] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <PadButton label="Y" ariaLabel="Y" sub="Hupe" color="#f9ab00" size={76} haptic="light" onPress={press(BTN.honk)} />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <PadButton label="X" ariaLabel="X" sub={turboLeft > 0 ? `${Math.ceil(turboLeft / 1000)} s` : 'Turbo'} color="#4285f4" size={84} cooldown={turboLeft / 4000} haptic={turboLeft > 0 ? 'tick' : 'medium'} onPress={press(BTN.turbo)} />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <PadButton
                label={power ? power.icon : 'B'}
                ariaLabel="B"
                sub={power ? power.name : 'Spezial'}
                color={power ? power.color : '#9aa0a6'}
                size={92}
                disabled={!power}
                haptic="heavy"
                onPress={press(BTN.special)}
              />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <PadButton label="A" ariaLabel="A" sub="Feuer" color="#ea4335" size={104} haptic="medium" onPress={press(BTN.fire)} />
            </div>
          </div>
        </div>
      </div>

      {status && (
        <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center">
          <div className="flat-card px-4 py-1.5 text-lg font-black">{status}</div>
        </div>
      )}
      {priv.alive && priv.shieldUntil > serverNow && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[#4285f4] px-3 py-1 text-sm font-bold">🛡️ Schild aktiv</div>
      )}

      {menu && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-4" onClick={() => setMenu(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#578a34] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl font-black">Optionen</div>
            <SteeringSwitch value={priv.steering} onChange={(mode) => sendAction('steering', { mode })} />
            <HapticsSwitch />
            <div className="mt-3 flex gap-2">
              <button onClick={() => void goFullscreenLandscape()} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-3 py-2.5 text-lg font-black text-[#4a752c]">
                <Maximize className="size-5" /> Vollbild
              </button>
              <button onClick={() => setMenu(false)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-3 py-2.5 text-lg font-black text-white">
                <RotateCcw className="size-5" /> Weiter
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
