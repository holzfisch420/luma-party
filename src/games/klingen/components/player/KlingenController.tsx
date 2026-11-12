import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import type { KlingenPrivateState, KlingenPublicState } from '../../types';
import { drawKnife } from '../draw';
import { klingenSounds } from '../sounds';
import { SoloGame } from './SoloGame';

type Props = PlayerViewProps<KlingenPublicState, KlingenPrivateState>;

export function KlingenController(props: Props) {
  const { state } = props;
  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_20%,#4a2a18_0%,#2a160c_60%,#160b05_100%)] text-white safe-pt safe-pb">
      {state.public.mode === 'solo' ? <Solo {...props} /> : <Shared {...props} />}
    </div>
  );
}

function Solo({ me, state, sendAction }: Props) {
  const pub = state.public;
  const row = pub.solo[me.id];
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 250) / 1000);
  if (!row) return <Center title="Gleich geht’s los" text="Du steigst beim nächsten Spiel ein." />;
  if (pub.phase === 'countdown')
    return <Center title={String(Math.max(1, secs))} text="Tippe irgendwo, um ein Messer zu werfen. Triff kein anderes Messer!" big />;
  if (row.done || pub.phase === 'done')
    return <Center title={`${row.cleared} ${row.cleared === 1 ? 'Stufe' : 'Stufen'}`} text={row.done ? 'Keine Leben mehr – schau auf den Fernseher, wie die anderen sich schlagen.' : 'Zeit um!'} />;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 safe-pt">
        <span className="text-xl font-black">Klingenrad</span>
        <span className={`rounded-full px-3 py-0.5 text-sm font-black tabular-nums ${secs <= 20 ? 'bg-[#e03131]' : 'bg-black/30'}`}>
          {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')} · {row.cleared} geschafft
        </span>
      </div>
      <SoloGame
        seed={pub.seed}
        startStage={row.stage}
        lives={row.lives}
        maxLives={pub.maxLives}
        active={pub.phase === 'play'}
        color={me.avatarColor}
        onProgress={(stage, stuck) => sendAction('progress', { stage, stuck })}
        onClear={(stage) => sendAction('clear', { stage })}
        onFail={(stage) => sendAction('fail', { stage })}
      />
    </>
  );
}

function Shared({ me, state, sendAction }: Props) {
  const pub = state.public;
  const row = pub.shared[me.id];
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 250) / 1000);
  const lastResult = state.private?.lastResult;
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (!lastResult || lastResult.id === seen.current) return;
    seen.current = lastResult.id;
    if (lastResult.ok) haptics.play('light');
    else {
      haptics.play('error');
      klingenSounds.clang();
    }
  }, [lastResult]);

  if (!row) return <Center title="Zuschauen" text="Du bist beim nächsten Spiel dabei." />;
  if (!row.alive) return <Center title="Raus!" text={`Du hast in Runde ${row.outRound} ein Messer getroffen. ${row.stuckTotal} Messer stecken von dir.`} />;
  const canThrow = pub.phase === 'play' && row.left > 0;
  return (
    <div className="flex h-full flex-col items-center justify-between gap-4 px-6 py-6">
      <div className="text-center">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Runde {pub.round}</div>
        <div className="text-3xl font-black">{pub.phase === 'countdown' ? `Gleich geht’s los … ${Math.max(1, secs)}` : pub.phase === 'roundEnd' ? 'Runde vorbei!' : row.left > 0 ? 'Schau aufs Rad und wirf!' : 'Alle Messer geworfen'}</div>
      </div>
      <KnifeRow left={row.left} total={pub.round} color={me.avatarColor} />
      <motion.button
        whileTap={{ scale: 0.94 }}
        disabled={!canThrow}
        onPointerDown={(e) => {
          e.preventDefault();
          if (!canThrow) return;
          haptics.play('medium');
          klingenSounds.throw();
          sendAction('throw');
        }}
        className="grid aspect-square w-[72vw] max-w-80 place-items-center rounded-full border-8 border-white/20 text-4xl font-black shadow-[0_12px_0_#7a2e00] transition disabled:opacity-35 disabled:shadow-none"
        style={{ background: `radial-gradient(circle at 35% 30%, #ffb46b, #e8590c 60%, #a33c05)` }}
      >
        WERFEN
      </motion.button>
      <p className="text-center text-sm font-bold text-white/70">Tippe, wenn eine Lücke unten am Rad ist. Triffst du ein Messer, bist du raus.</p>
    </div>
  );
}

function KnifeRow({ left, total, color }: { left: number; total: number; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const n = Math.min(total, 12);
    const w = Math.max(1, n) * 26;
    c.width = w * 2;
    c.height = 140;
    c.style.width = `${w}px`;
    c.style.height = '70px';
    const ctx = c.getContext('2d')!;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, w, 70);
    for (let i = 0; i < n; i++) drawKnife(ctx, 13 + i * 26, 4, Math.PI / 2 + Math.PI, 62, color, i < left ? 1 : 0.2);
  }, [left, total, color]);
  return <canvas ref={ref} />;
}

function Center({ title, text, big }: { title: string; text: string; big?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className={`${big ? 'text-8xl' : 'text-5xl'} font-black`}>{title}</div>
      <p className="text-lg font-bold text-white/80">{text}</p>
    </div>
  );
}
