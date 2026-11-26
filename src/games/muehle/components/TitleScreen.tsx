import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';
import type { Cell } from '../logic/rules';
import { MillBoard } from './MillBoard';

/** Holztisch mit schräg liegendem Brett – bei jedem Wechsel fällt ein Stein, Knöpfe sind Spielsteine */
export function MuehleTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const [board, setBoard] = useState<Cell[]>(() => Array(24).fill(null));
  useEffect(() => {
    // bei jedem Fokuswechsel einen Stein setzen (abwechselnd weiß/schwarz), voll = neu anfangen
    setBoard((b) => {
      const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
      if (free.length < 4) return Array(24).fill(null);
      const next = [...b];
      next[free[Math.floor(Math.random() * free.length)]!] = b.filter(Boolean).length % 2 ? 'b' : 'w';
      return next;
    });
    playSfx('thunk-1', { vol: 0.4, vary: 0.1 });
  }, [focus]);
  return (
    <div className="absolute inset-0 overflow-hidden text-[#f3d9a4]" style={{ background: 'repeating-linear-gradient(92deg,#5a3a22 0 3vw,#4e321d 3vw 4.5vw,#62402a 4.5vw 7vw), #4e321d' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_45%,rgba(255,220,160,0.25),transparent_60%),radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.55))]" />
      <div className="absolute left-[4vw] top-[50%] -translate-y-1/2 [perspective:1000px]">
        <motion.div initial={{ rotateX: 70, opacity: 0 }} animate={{ rotateX: 38, opacity: 1 }} transition={{ duration: 1.2 }} className="[transform:rotateZ(-8deg)]">
          <MillBoard board={board} className="size-[76vh] drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]" />
        </motion.div>
      </div>
      <div className="absolute right-[5vw] top-[8vh] w-[42vw] text-center">
        <h1 className="font-stage text-[9vw] font-black leading-none text-[#f3d9a4] [text-shadow:0_4px_0_#24150b,0_0_30px_rgba(243,217,164,0.35)]">{meta.name}</h1>
        <p className="mt-2 text-2xl font-bold text-[#e8c48a]">{meta.tagline}</p>
      </div>
      {/* Spielsteine */}
      <div className="absolute bottom-[14vh] right-[5vw] flex w-[42vw] flex-wrap justify-center gap-[1.6vw]">
        {items.map((it, i) => {
          const f = focus === i;
          const white = i % 2 === 0;
          const start = it.action.kind === 'start';
          const size = start ? 13 : 9.5;
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ y: f ? -14 : 0, scale: f ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              className={`relative grid place-items-center rounded-full text-center font-black leading-tight ${start && blocked ? 'opacity-60' : ''}`}
              style={{
                width: `${size}vw`,
                height: `${size}vw`,
                fontSize: start ? '1.8vw' : '1.15vw',
                background: white ? 'radial-gradient(circle at 35% 30%,#fff,#d9cfbd 75%)' : 'radial-gradient(circle at 35% 30%,#5a524c,#151210 75%)',
                color: white ? '#3d2414' : '#f3d9a4',
                boxShadow: `${f ? '0 0 0 0.5vw #ffd23f,' : ''} 0 1vh 1.4vh rgba(0,0,0,0.55), inset 0 0 0 0.6vw ${white ? 'rgba(170,150,120,0.35)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span className="px-2">{it.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[4vh] right-[5vw] flex items-center gap-3">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-[#e8c48a]/70">{controlLine(room)}</span>
      </div>
    </div>
  );
}
