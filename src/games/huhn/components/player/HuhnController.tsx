import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { PlayerViewProps } from '../../../game-types';
import { CHICKEN_COLORS } from '../../game-config';
import { getMap } from '../../maps';
import type { HuhnPrivateState, HuhnPublicState } from '../../types';
import { ChickenIcon, Stars } from '../ChickenIcon';

/** Handy: ein großer Knopf – Schwerkraft umdrehen (Boden ↔ Decke) */
export function HuhnController({ me, state, sendAction }: PlayerViewProps<HuhnPublicState, HuhnPrivateState>) {
  const pub = state.public;
  const priv = state.private;
  const mine = pub.players.find((p) => p.playerId === me.id);
  const map = getMap(pub.mapId);
  const color = CHICKEN_COLORS[priv?.slot ?? 0] ?? CHICKEN_COLORS[0];
  const remaining = useCountdown(pub.phase === 'countdown' ? pub.phaseEndsAt : null, 200);
  const secs = Math.ceil(remaining / 1000);
  const onCeiling = priv?.g === -1;

  // Haptik
  const wasAlive = useRef(priv?.alive);
  useEffect(() => {
    if (wasAlive.current && priv && !priv.alive && pub.phase === 'run') haptics.play('error');
    wasAlive.current = priv?.alive;
  }, [priv?.alive, priv, pub.phase]);
  useEffect(() => {
    if (pub.phase === 'countdown' && secs > 0 && secs <= 3) haptics.play('tick');
    if (pub.phase === 'run') haptics.play('medium');
    if (pub.phase === 'roundEnd' && pub.roundWinnerId === me.id) haptics.play('success');
  }, [secs, pub.phase, pub.roundWinnerId, me.id]);

  const won = pub.roundWinnerId === me.id;
  const active = !!priv?.inRound && priv.alive && pub.phase !== 'roundEnd';

  let status: string;
  if (!priv || priv.slot < 0) status = 'Alle 8 Plätze belegt – schau am Fernseher zu.';
  else if (!priv.inRound) status = 'Du steigst in der nächsten Runde ein.';
  else if (pub.phase === 'countdown') status = secs <= 3 ? `${secs || 'Los'}…` : `Runde ${pub.round}: ${map.name}`;
  else if (won) status = '🏆 Du bist entkommen!';
  else if (!priv.alive) status = mine?.out === 'fell' ? `💨 Abgestürzt! Platz ${priv.place}` : `🚓 Geschnappt! Platz ${priv.place}`;
  else if (pub.phase === 'roundEnd') status = 'Runde vorbei';
  else status = onCeiling ? 'Du läufst an der Decke' : 'Du läufst am Boden';

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#1f2937] font-sans text-white safe-pt safe-pb" style={{ touchAction: 'none' }}>
      <header className="flex items-center gap-3 bg-[#111827] px-4 py-2.5">
        <ChickenIcon body={color.body} dark={color.dark} className="size-9" dead={!!priv?.inRound && !priv.alive && !won} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black leading-tight">{me.name}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-white/60">
            {map.name} <Stars n={map.difficulty} size="size-3" />
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tabular-nums text-[#ffd23f]">{mine?.score ?? 0}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Punkte</div>
        </div>
      </header>

      <div className="px-4 pt-3 text-center">
        <motion.div key={status} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black">
          {status}
        </motion.div>
        <div className="text-sm font-bold text-white/50">
          Runde {Math.max(1, pub.round)}/{pub.totalRounds}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-5">
        <button
          disabled={!active}
          aria-label={onCeiling ? 'Umdrehen – runter auf den Boden' : 'Umdrehen – rauf an die Decke'}
          onPointerDown={(e) => {
            e.preventDefault();
            haptics.play('light');
            sendAction('flip');
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="relative flex aspect-square w-[min(80vw,60vh,440px)] select-none flex-col items-center justify-center gap-1 rounded-full shadow-[0_12px_0_rgba(0,0,0,0.35)] transition-transform active:translate-y-2 active:shadow-[0_3px_0_rgba(0,0,0,0.35)] disabled:opacity-40"
          style={{ background: `radial-gradient(circle at 35% 30%, #fff6, transparent 60%), ${color.body}` }}
        >
          {onCeiling ? <ArrowDown className="size-[min(14vw,10vh)] text-[#1f2937]" strokeWidth={3} /> : <ArrowUp className="size-[min(14vw,10vh)] text-[#1f2937]" strokeWidth={3} />}
          <motion.div animate={{ rotate: onCeiling ? 180 : 0, scaleX: onCeiling ? -1 : 1 }} transition={{ type: 'spring', stiffness: 380, damping: 20 }}>
            <ChickenIcon body={color.body} dark={color.dark} className="size-[min(30vw,22vh)] drop-shadow-lg" />
          </motion.div>
          <span className="text-[min(7vw,5vh)] font-black text-[#1f2937]">Umdrehen!</span>
        </button>
      </div>
      <p className="px-6 pb-4 text-center text-sm font-bold text-white/60">Tippen = zwischen Boden und Decke wechseln · Lücken, Polizisten und das Zurückfallen vermeiden · andere wegschubsen!</p>
    </div>
  );
}
