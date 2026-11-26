import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

const NOTE_COLORS = ['#fff27a', '#ffb3d1', '#a8e6ff', '#b8f5a8', '#ffd59e', '#e2c8ff'];

/** Karopapier mit Kritzeleien – der Titel wird live gezeichnet, Knöpfe sind Klebezettel */
export function MontagsmalerTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#fbf8ef] text-[#2b2b2b]"
      style={{ backgroundImage: 'linear-gradient(#cfe3f3 1.5px, transparent 1.5px), linear-gradient(90deg, #cfe3f3 1.5px, transparent 1.5px)', backgroundSize: '44px 44px' }}
    >
      {/* roter Rand wie im Schulheft */}
      <div className="absolute inset-y-0 left-[9vw] w-[3px] bg-[#f08a8a]" />
      {/* Kritzeleien, die sich selbst zeichnen */}
      <svg viewBox="0 0 1600 900" className="pointer-events-none absolute inset-0 size-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[
          { d: 'M1330 150 m-60 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0', c: '#f4b400', w: 9 },
          { d: 'M1260 150 L1215 150 M1400 150 L1445 150 M1330 80 L1330 40 M1330 220 L1330 260 M1280 100 L1250 70 M1380 200 L1410 230 M1380 100 L1410 70 M1280 200 L1250 230', c: '#f4b400', w: 7 },
          { d: 'M180 760 L180 640 L260 570 L340 640 L340 760 Z M240 760 L240 700 L285 700 L285 760', c: '#333', w: 8 },
          { d: 'M1180 790 C1230 720, 1290 860, 1350 780 S1470 720, 1530 790', c: '#3bb273', w: 8 },
          { d: 'M120 300 q25 -40 50 0 q25 40 50 0 q25 -40 50 0', c: '#e85d75', w: 7 },
        ].map((p, i) => (
          <motion.path key={i} d={p.d} stroke={p.c} strokeWidth={p.w} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.3 + i * 0.35, ease: 'easeInOut' }} />
        ))}
      </svg>

      <div className="absolute left-[12vw] top-[9vh]">
        <motion.h1
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
          className="font-hand text-[9vw] font-bold leading-none tracking-tight text-[#222]"
        >
          Montagsmaler
        </motion.h1>
        <motion.svg viewBox="0 0 600 30" className="-mt-2 w-[42vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <motion.path d="M5 18 C150 5, 300 28, 595 10" stroke="#e85d75" strokeWidth="8" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 0.7 }} />
        </motion.svg>
        <p className="mt-2 font-hand text-4xl text-[#555]">Zeichne. Rate. Lach dich schlapp.</p>
      </div>

      {/* Klebezettel */}
      <div className="absolute bottom-[12vh] left-[12vw] right-[5vw] flex flex-wrap items-end gap-[1.6vw]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          const rot = [-4, 3, -2, 5, -3, 2][i % 6]!;
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              initial={{ y: 80, opacity: 0, rotate: rot * 3 }}
              animate={{ y: f ? -18 : 0, opacity: 1, rotate: f ? 0 : rot, scale: f ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: focus === -1 ? 0 : 0 }}
              className={`relative flex flex-col justify-between p-4 text-left font-hand shadow-[4px_8px_14px_rgba(0,0,0,0.18)] ${start ? 'h-[23vh] w-[15vw]' : 'h-[18vh] w-[11vw]'} ${start && blocked ? 'opacity-60' : ''}`}
              style={{ background: start ? '#fff27a' : NOTE_COLORS[(i + 1) % NOTE_COLORS.length] }}
            >
              {/* Klebestreifen */}
              <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg] bg-white/60 shadow-sm" />
              <span className={`${start ? 'text-[3.2vw]' : 'text-[2vw]'} font-bold leading-none`}>{it.label}</span>
              {f && (
                <motion.span initial={{ width: 0 }} animate={{ width: '80%' }} className="block h-[5px] rounded-full bg-[#e85d75]" />
              )}
              {f && <Pencil className="absolute -right-5 -top-5 size-10 rotate-12 text-[#333]" />}
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[3vh] left-[12vw] flex items-center gap-4">
        <BlockedHint blocked={blocked} />
        <span className="font-hand text-2xl text-[#777]">{controlLine(room)}</span>
      </div>
    </div>
  );
}
