import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';
import { MARK_COLORS } from './shared';

const TITLE = 'WORTKNACKER';
// Farben der Titelkacheln (wie ein gelöstes Rätsel, das sich aufdeckt)
const TITLE_MARKS = 'gygxgggyxgg';

/** Buchstabenkacheln: der Titel klappt Kachel für Kachel um, Knöpfe sind Rate-Zeilen */
export function WortTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh] overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,#2c4a7a,#0d1426_70%)] text-white">
      {/* schwebende Buchstaben im Hintergrund */}
      {'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('').map((ch, i) => (
        <motion.span
          key={ch}
          className="pointer-events-none absolute select-none font-black text-white/[0.05]"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, fontSize: `${3 + (i % 4)}vw` }}
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, ease: 'easeInOut' }}
        >
          {ch}
        </motion.span>
      ))}
      <div className="flex gap-[0.7vw]">
        {TITLE.split('').map((ch, i) => {
          const m = TITLE_MARKS[i] as 'g' | 'y' | 'x';
          return (
            <motion.div
              key={i}
              initial={{ rotateX: 0, backgroundColor: '#1b2a4a' }}
              animate={{ rotateX: [0, 90, 0], backgroundColor: ['#1b2a4a', '#1b2a4a', MARK_COLORS[m].bg] }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5, times: [0, 0.5, 1] }}
              className="grid size-[6.4vw] place-items-center rounded-[0.8vw] border-[3px] border-white/20 text-[4vw] font-black shadow-lg"
            >
              {ch}
            </motion.div>
          );
        })}
      </div>
      <p className="-mt-[2vh] text-2xl font-bold text-white/70">Fünf Buchstaben, sechs Versuche – wer knackt es zuerst?</p>

      {/* Knöpfe als Rate-Zeilen */}
      <div className="flex flex-col items-center gap-[1.4vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          const letters = it.label.toUpperCase().split('');
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ scale: f ? 1.08 : 1 }}
              className={`flex gap-[0.35vw] ${start && blocked ? 'opacity-50' : ''}`}
            >
              {letters.map((ch, j) => (
                <motion.span
                  key={j}
                  animate={{ backgroundColor: f ? (start ? MARK_COLORS.g.bg : MARK_COLORS.y.bg) : 'rgba(255,255,255,0.08)', rotateX: f ? [0, 90, 0] : 0 }}
                  transition={{ delay: f ? j * 0.03 : 0, duration: 0.3 }}
                  className={`grid place-items-center rounded-[0.5vw] border-2 font-black ${f ? 'border-transparent' : 'border-white/15'} ${start ? 'size-[3.6vw] text-[2.2vw]' : 'size-[2.8vw] text-[1.7vw]'}`}
                >
                  {ch === ' ' ? '' : ch}
                </motion.span>
              ))}
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[4vh] flex flex-col items-center gap-2">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-white/45">{controlLine(room)}</span>
      </div>
    </div>
  );
}
