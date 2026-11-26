import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Bühne: Vorhang geht auf, ein Spotlight folgt dem gewählten Knopf */
export function TheaterTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 250);
    return () => clearTimeout(t);
  }, []);
  const n = items.length;
  const xOf = (i: number) => 14 + (72 * (i + 0.5)) / n; // Bühnenbreite in %
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#120607] text-[#fff3dc]">
      {/* Bühnenrückwand */}
      <div className="absolute inset-x-[8vw] top-[6vh] bottom-[22vh] bg-[radial-gradient(ellipse_at_50%_20%,#4a1f12,#1a0906_75%)]" />
      {/* Bühnenboden */}
      <div className="absolute inset-x-0 bottom-0 h-[24vh] bg-[linear-gradient(#5a3018,#2b160a)] [background-image:repeating-linear-gradient(90deg,rgba(0,0,0,0.25)_0_2px,transparent_2px_90px),linear-gradient(#5a3018,#2b160a)]" />
      {/* Spotlight */}
      <motion.div
        className="pointer-events-none absolute top-0 h-full w-[26vw] -translate-x-1/2"
        animate={{ left: `${xOf(focus)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        style={{ background: 'linear-gradient(rgba(255,240,200,0.0), rgba(255,240,200,0.16) 60%, rgba(255,240,200,0.28))', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)' }}
      />
      <motion.div className="pointer-events-none absolute bottom-[8vh] h-[8vh] w-[24vw] -translate-x-1/2 rounded-[50%] bg-[#fff0c8]/30 blur-md" animate={{ left: `${xOf(focus)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />

      <div className="absolute inset-x-0 top-[16vh] text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="font-stage text-[7.5vw] font-black italic leading-none text-[#ffe9a8] [text-shadow:0_4px_0_#4a0d12,0_0_40px_rgba(255,213,107,0.5)]">
          Textprobe
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-3 font-stage text-3xl italic text-[#f3d9a4]">
          Vorhang auf – wer kann seinen Text?
        </motion.p>
      </div>

      {/* Knöpfe auf der Bühnenkante */}
      <div className="absolute inset-x-[14vw] bottom-[11vh] flex">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          return (
            <div key={it.id} className="flex flex-1 justify-center">
              <motion.button
                onMouseEnter={() => setFocus(i)}
                onClick={() => activate(i)}
                animate={{ y: f ? -10 : 0, scale: f ? 1.12 : 1 }}
                className={`font-stage text-[2.2vw] font-black italic ${f ? 'text-[#fff7e0] [text-shadow:0_0_20px_rgba(255,230,150,0.9)]' : 'text-[#f3d9a4]/55'} ${start && blocked ? 'opacity-60' : ''}`}
              >
                {it.label}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Vorhang */}
      {[-1, 1].map((side) => (
        <motion.div
          key={side}
          className="absolute top-0 h-full w-[52vw]"
          style={{
            [side < 0 ? 'left' : 'right']: 0,
            background: 'repeating-linear-gradient(90deg,#8b0f1a 0 3vw,#b3161f 3vw 5vw,#7a0c16 5vw 6vw)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
          }}
          initial={{ x: 0 }}
          animate={{ x: open ? `${side * 42}vw` : 0 }}
          transition={{ duration: 1.4, ease: [0.6, 0, 0.3, 1] }}
        />
      ))}
      {/* Volant oben */}
      <div className="absolute inset-x-0 top-0 h-[7vh] bg-[repeating-linear-gradient(90deg,#9e1220_0_4vw,#7a0c16_4vw_8vw)] shadow-[0_8px_20px_rgba(0,0,0,0.6)] [border-bottom:6px_solid_#e8b84a]" />
      <div className="absolute bottom-[3vh] inset-x-0 flex flex-col items-center gap-2">
        <BlockedHint blocked={blocked} />
        <span className="font-stage text-lg italic text-[#f3d9a4]/60">{controlLine(room)}</span>
      </div>
    </div>
  );
}
