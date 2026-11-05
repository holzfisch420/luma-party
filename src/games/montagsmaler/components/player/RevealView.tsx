import { motion } from 'framer-motion';
import type { MontagsmalerPublicState } from '../../types';

const REASONS: Record<string, string> = {
  time: 'Die Zeit ist abgelaufen.',
  'all-guessed': 'Alle haben es erraten!',
  'drawer-left': 'Der Zeichner hat die Verbindung verloren.',
  skipped: 'Der Zug wurde übersprungen.',
};

export function RevealView({ state, meId }: { state: MontagsmalerPublicState; meId: string }) {
  const gain = state.turnGains[meId] ?? 0;
  const myScore = state.scores.find((s) => s.playerId === meId)?.score ?? 0;
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-sm font-medium text-white/50">{REASONS[state.reveal?.reason ?? 'time']}</div>
      <div>
        <div className="text-sm uppercase tracking-[0.16em] text-white/45">Das Wort war</div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-2 text-5xl font-bold tracking-tight">
          {state.reveal?.word}
        </motion.div>
      </div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl px-8 py-5 ${gain > 0 ? 'bg-emerald-400/15' : 'bg-white/[0.06]'}`}
      >
        <div className={`text-4xl font-bold tabular-nums ${gain > 0 ? 'text-emerald-300' : 'text-white/50'}`}>+{gain}</div>
        <div className="mt-1 text-sm text-white/55">Gesamt: {myScore} Punkte</div>
      </motion.div>
      <p className="text-sm text-white/40">Nächster Zug beginnt gleich …</p>
    </div>
  );
}
