import { motion } from 'framer-motion';
import { Burst } from '../../../../components/comic/Burst';
import { fitWord } from '../../../../components/comic/fit-text';
import type { MontagsmalerPublicState } from '../../types';

const REASONS: Record<string, string> = {
  time: 'Zeit abgelaufen!',
  'all-guessed': 'Alle haben es erraten!',
  'drawer-left': 'Der Zeichner ist weg …',
  skipped: 'Zug übersprungen',
};

export function RevealView({ state, meId }: { state: MontagsmalerPublicState; meId: string }) {
  const gain = state.turnGains[meId] ?? 0;
  const myScore = state.scores.find((s) => s.playerId === meId)?.score ?? 0;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="comic-box-sm -rotate-2 px-3 py-1 text-base font-bold">{REASONS[state.reveal?.reason ?? 'time']}</div>
      <motion.div initial={{ scale: 0.2, rotate: 15 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 13 }}>
        <Burst className="aspect-[1.5] w-80" spikes={18}>
          <div className="text-base font-bold">Das Wort war:</div>
          <div className="font-bangers leading-none" style={{ fontSize: fitWord(state.reveal?.word ?? '', 3, 8) }}>{state.reveal?.word}</div>
        </Burst>
      </motion.div>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className={`comic-box rotate-1 px-8 py-3 ${gain > 0 ? 'bg-pop-green' : ''}`}>
        <div className="font-bangers text-5xl leading-none">+{gain}</div>
        <div className="text-sm font-bold">Gesamt: {myScore} Punkte</div>
      </motion.div>
      <p className="text-sm font-bold">Nächster Zug kommt gleich …</p>
    </div>
  );
}
