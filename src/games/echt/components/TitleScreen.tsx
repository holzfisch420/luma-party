import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

const CARDS = ['#fff6d6', '#ffd3e0', '#d6f0ff', '#e2ffd6', '#f1e0ff'];
// Positionen der Zettel auf der Pinnwand (in % vom Bildschirm)
const SPOTS = [
  { x: 56, y: 16, r: -4 },
  { x: 76, y: 28, r: 5 },
  { x: 58, y: 48, r: 3 },
  { x: 78, y: 60, r: -5 },
  { x: 60, y: 76, r: -2 },
  { x: 80, y: 84, r: 4 },
];

/** Ermittlungs-Pinnwand: Zettel mit roten Fäden, der Titel bekommt einen Stempel */
export function EchtTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const spot = (i: number) => SPOTS[i % SPOTS.length]!;
  return (
    <div
      className="absolute inset-0 overflow-hidden text-[#3b2a1a]"
      style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%), #b8814a',
        backgroundImage:
          'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(#9a6532 1.2px, transparent 1.3px), radial-gradient(#e0b083 1px, transparent 1.1px)',
        backgroundSize: 'auto, 14px 14px, 22px 22px',
        backgroundPosition: '0 0, 0 0, 7px 9px',
      }}
    >
      {/* Holzrahmen */}
      <div className="pointer-events-none absolute inset-0 border-[18px] border-[#6b4423] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />
      {/* rote Fäden vom Titel zum gewählten Zettel */}
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {items.map((_, i) => {
          const s = spot(i);
          return (
            <motion.line
              key={i}
              x1="30"
              y1="38"
              x2={s.x + 7}
              y2={s.y + 2}
              stroke="#c1121f"
              strokeWidth={focus === i ? 0.45 : 0.18}
              animate={{ opacity: focus === i ? 1 : 0.35 }}
            />
          );
        })}
      </svg>
      {/* Titel-Zettel mit Stempel */}
      <motion.div
        initial={{ rotate: -12, y: -400 }}
        animate={{ rotate: -3, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className="absolute left-[7vw] top-[18vh] w-[40vw] bg-[#fffdf5] px-10 pb-10 pt-12 shadow-[8px_14px_30px_rgba(0,0,0,0.35)]"
      >
        <span className="absolute left-1/2 top-3 size-7 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff9a9a,#d62828_60%,#8b0f0f)] shadow" />
        <h1 className="font-typewriter text-[5.6vw] leading-none">Echt jetzt?</h1>
        <p className="mt-4 font-typewriter text-2xl text-[#6b5640]">Wer kennt wen wirklich – und wer lügt am besten?</p>
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: -14 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 12 }}
          className="absolute -bottom-6 right-6 rounded-xl border-[6px] border-[#2b8a3e] px-5 py-1 font-bangers text-6xl tracking-wider text-[#2b8a3e] opacity-90"
        >
          ECHT!
        </motion.div>
      </motion.div>
      {/* Knöpfe als angepinnte Zettel */}
      {items.map((it, i) => {
        const s = spot(i);
        const f = focus === i;
        const start = it.action.kind === 'start';
        return (
          <motion.button
            key={it.id}
            onMouseEnter={() => setFocus(i)}
            onClick={() => activate(i)}
            initial={{ scale: 0, rotate: s.r * 4 }}
            animate={{ scale: f ? 1.12 : 1, rotate: f ? 0 : s.r, y: f ? -6 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: f ? 0 : 0.2 + i * 0.08 }}
            className={`absolute w-[15vw] px-5 pb-5 pt-7 text-left shadow-[5px_9px_18px_rgba(0,0,0,0.35)] ${start && blocked ? 'opacity-60' : ''}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, background: start ? '#ffe066' : CARDS[i % CARDS.length] }}
          >
            <span className="absolute left-1/2 top-2 size-5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff9a9a,#d62828_60%,#8b0f0f)] shadow" />
            <span className={`font-typewriter font-bold leading-tight ${start ? 'text-[2.4vw]' : 'text-[1.8vw]'}`}>{it.label}</span>
            {f && (
              <motion.span initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -right-3 -top-3 grid size-10 rotate-12 place-items-center rounded-full border-4 border-[#2b8a3e] bg-white/80 font-bangers text-2xl text-[#2b8a3e]">
                ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}
      <div className="absolute bottom-[5vh] left-[7vw] flex flex-col items-start gap-2">
        <BlockedHint blocked={blocked} />
        <span className="rounded bg-[#fffdf5]/85 px-3 py-1 font-typewriter text-lg text-[#6b5640]">{controlLine(room)}</span>
      </div>
    </div>
  );
}
