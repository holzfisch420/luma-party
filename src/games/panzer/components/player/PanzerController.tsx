import { motion } from 'framer-motion';
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
            <div className="font-bangers text-4xl">Arena voll!</div>
            <p className="mt-2 font-bold text-white/70">Es können höchstens 8 Panzer mitfahren – schau am Fernseher zu.</p>
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
  return <div className="comic touch-none-all fixed inset-0 overflow-hidden bg-[#2d2a26] [background-image:radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.6px)] [background-size:20px_20px]">{children}</div>;
}

function RotateHint() {
  return (
    <Shell>
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center text-white">
        <motion.div animate={{ rotate: [0, -90, -90, 0] }} transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.35, 0.75, 1] }}>
          <Smartphone className="size-20" strokeWidth={1.8} />
        </motion.div>
        <div>
          <div className="font-bangers text-4xl">Handy quer halten!</div>
          <p className="mt-2 font-bold text-white/70">Links fährst du mit dem Joystick, rechts sind die Tasten.</p>
        </div>
        <button onClick={() => void goFullscreenLandscape()} className="comic-box-sm flex items-center gap-2 bg-pop-yellow px-4 py-2 font-bangers text-xl text-ink">
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
    <div className="comic fixed inset-0 overflow-y-auto bg-[#2d2a26] p-4 safe-pt safe-pb [background-image:radial-gradient(rgba(255,255,255,0.06)_1.5px,transparent_1.6px)] [background-size:20px_20px]">
      <div className={`mx-auto flex max-w-3xl gap-5 ${landscape ? 'flex-row items-start' : 'flex-col'}`}>
        <div className={`flex flex-col items-center gap-3 ${landscape ? 'w-56 shrink-0' : ''}`}>
          <div className="font-bangers text-3xl text-white">Dein Panzer</div>
          <motion.div key={priv.color} initial={{ scale: 0.6, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
            <TankIcon color={priv.color} className="size-32 drop-shadow-xl" angle={-60} />
          </motion.div>
          <div className="font-bangers text-2xl text-pop-yellow">{TANK_COLORS[priv.color]!.name}</div>
          <button
            onClick={() => sendAction('ready', { ready: !ready })}
            className={`comic-box font-bangers flex w-full items-center justify-center gap-2 px-5 py-3 text-3xl ${ready ? 'bg-pop-green' : 'bg-pop-yellow'}`}
          >
            {ready ? (
              <>
                <Check className="size-7" strokeWidth={3} /> Bereit!
              </>
            ) : (
              'Bereit?'
            )}
          </button>
          <div className="text-center text-xs font-bold text-white/60">Start, wenn alle bereit sind – spätestens in {Math.ceil(remaining / 1000)} s</div>
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
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border-[3px] border-ink transition ${active ? 'bg-pop-yellow shadow-[3px_3px_0_#161616]' : 'bg-white'} ${owner ? 'opacity-40' : ''}`}
                  aria-label={`${c.name}${owner ? ` (vergeben an ${owner})` : ''}`}
                >
                  <TankIcon color={i} className="size-4/5" angle={-90} />
                  {owner && <span className="absolute inset-x-0 bottom-0.5 truncate px-0.5 text-[9px] font-bold">{owner}</span>}
                </button>
              );
            })}
          </div>
          <SteeringSwitch value={priv.steering} onChange={(mode) => sendAction('steering', { mode })} />
          {!landscape && (
            <button onClick={() => void goFullscreenLandscape()} className="comic-box-sm mt-4 flex w-full items-center justify-center gap-2 bg-white px-4 py-2 font-bangers text-xl">
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
    <div className="mt-4 rounded-xl border-[3px] border-ink bg-white p-2">
      <div className="mb-1.5 px-1 text-sm font-bold">Steuerung</div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['tank', 'Panzer', '↑↓ fahren · ←→ drehen'],
            ['direction', 'Richtung', 'Panzer fährt dorthin, wohin du zeigst'],
          ] as const
        ).map(([v, label, hint]) => (
          <button key={v} onClick={() => onChange(v)} className={`rounded-lg border-2 border-ink px-2 py-1.5 text-left ${value === v ? 'bg-pop-yellow' : 'bg-white'}`}>
            <div className="font-bangers text-xl leading-none">{label}</div>
            <div className="text-[11px] font-bold leading-tight">{hint}</div>
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

  // Vibration beim Zerstören
  const wasAlive = useRef(priv.alive);
  useEffect(() => {
    if (wasAlive.current && !priv.alive && pub.phase !== 'countdown') navigator.vibrate?.([120, 60, 220]);
    wasAlive.current = priv.alive;
  }, [priv.alive, pub.phase]);

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
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 border-b-[3px] border-ink px-4 py-1.5" style={{ background: color }}>
        <TankIcon color={priv.color} className="size-8" angle={-90} dead={!priv.alive} />
        <div className="min-w-0 flex-1 truncate font-bangers text-xl text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)]">
          {room.players.find((p) => p.id === meId)?.name}
          <span className="ml-3 text-base">
            {'★'.repeat(mine?.score ?? 0)}
            <span className="opacity-40">{'☆'.repeat(Math.max(0, pub.winScore - (mine?.score ?? 0)))}</span>
          </span>
        </div>
        <button onClick={() => setMenu((m) => !m)} className="grid size-9 place-items-center rounded-lg border-2 border-ink bg-white" aria-label="Optionen">
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
              <PadButton label="Y" sub="Hupe" color="#ffd93b" size={76} onPress={press(BTN.honk)} />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <PadButton label="X" sub={turboLeft > 0 ? `${Math.ceil(turboLeft / 1000)} s` : 'Turbo'} color="#3aa8ff" size={84} cooldown={turboLeft / 4000} onPress={press(BTN.turbo)} />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <PadButton
                label={power ? power.icon : 'B'}
                sub={power ? power.name : 'Spezial'}
                color={power ? power.color : '#d7d7d7'}
                size={92}
                disabled={!power}
                onPress={press(BTN.special)}
              />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <PadButton label="A" sub="Feuer" color="#3fd07a" size={104} onPress={press(BTN.fire)} />
            </div>
          </div>
        </div>
      </div>

      {status && (
        <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center">
          <div className="comic-box-sm bg-white px-4 py-1 font-bangers text-xl">{status}</div>
        </div>
      )}
      {priv.alive && priv.shieldUntil > serverNow && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border-2 border-ink bg-[#4fc3f7] px-2 py-0.5 text-sm font-bold">🛡️ Schild aktiv</div>
      )}

      {menu && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 p-4" onClick={() => setMenu(false)}>
          <div className="comic-box w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-bangers text-3xl">Optionen</div>
            <SteeringSwitch value={priv.steering} onChange={(mode) => sendAction('steering', { mode })} />
            <div className="mt-3 flex gap-2">
              <button onClick={() => void goFullscreenLandscape()} className="comic-box-sm flex flex-1 items-center justify-center gap-2 bg-pop-yellow px-3 py-2 font-bangers text-xl">
                <Maximize className="size-5" /> Vollbild
              </button>
              <button onClick={() => setMenu(false)} className="comic-box-sm flex flex-1 items-center justify-center gap-2 px-3 py-2 font-bangers text-xl">
                <RotateCcw className="size-5" /> Weiter
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
