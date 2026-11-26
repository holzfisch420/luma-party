import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Startaufstellung: Startampel zählt herunter, Autos rauschen vorbei, Knöpfe sind Startplätze */
export function RacerTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const [lights, setLights] = useState(0);
  useEffect(() => {
    // Startampel: 1…5 rot, dann grün, in Schleife
    let n = 0;
    const id = setInterval(() => {
      n = (n + 1) % 8;
      setLights(n);
      if (n >= 1 && n <= 5) playSfx('count-tick', { vol: 0.25, rate: 1.4 });
      if (n === 6) playSfx('count-go', { vol: 0.35 });
    }, 650);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2b2f3a] text-white">
      {/* Asphalt mit Streifen */}
      <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,transparent_0_6vw,rgba(255,255,255,0.05)_6vw_6.2vw)]" />
      <div className="absolute inset-x-0 top-[48vh] h-[1.2vh] [background:repeating-linear-gradient(90deg,#fff_0_4vw,transparent_4vw_8vw)] opacity-60" />
      {/* Zielflagge-Streifen */}
      <div className="absolute inset-y-0 right-[6vw] w-[4vw] [background:conic-gradient(#fff_25%,#111_0_50%,#fff_0_75%,#111_0)_0_0/2vw_2vw]" />
      {/* vorbeirauschende Autos */}
      {['#3ec1f3', '#ff5c8d', '#ffd23f'].map((c, i) => (
        <motion.div key={c} className="absolute h-[4.5vh] w-[8vw] rounded-[1.2vw]" style={{ top: `${40 + i * 6}vh`, background: c, boxShadow: `0 0 30px ${c}` }} initial={{ x: '-20vw' }} animate={{ x: '130vw' }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 + i * 1.3, delay: i * 0.9, ease: 'easeIn' }}>
          <span className="absolute right-[12%] top-[18%] h-[64%] w-[22%] rounded bg-black/40" />
        </motion.div>
      ))}
      {/* Titel + Ampel */}
      <div className="absolute left-[6vw] top-[6vh] flex items-center gap-[3vw]">
        <h1 className="font-bangers text-[8vw] leading-none tracking-wide [text-shadow:0.4vw_0.4vw_0_#7c5cff,0.8vw_0.8vw_0_#ff5c8d]" style={{ fontStyle: 'italic' }}>
          {meta.name}
        </h1>
        <div className="flex gap-[0.8vw] rounded-[1.2vw] bg-black/70 p-[1vw] shadow-xl">
          {[1, 2, 3, 4, 5].map((k) => (
            <span key={k} className="size-[3vw] rounded-full border-2 border-black/60" style={{ background: lights === 6 || lights === 7 ? '#2fdc5f' : lights >= k ? '#ff2e2e' : '#3a1414', boxShadow: lights >= k && lights <= 7 ? `0 0 18px ${lights >= 6 ? '#2fdc5f' : '#ff2e2e'}` : 'none' }} />
          ))}
        </div>
      </div>
      {/* Startplätze */}
      <div className="absolute bottom-[10vh] left-[6vw] grid w-[70vw] grid-cols-2 gap-x-[4vw] gap-y-[2vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ x: f ? '1.5vw' : 0, skewX: -8 }}
              className={`relative flex items-center gap-[1.4vw] border-l-[0.6vw] px-[1.6vw] py-[1.4vh] text-left font-bangers tracking-wider ${i % 2 ? 'mt-[4vh]' : ''} ${start ? 'text-[2.8vw]' : 'text-[2vw]'} ${start && blocked ? 'opacity-50' : ''}`}
              style={{ borderColor: f ? '#ffd23f' : 'rgba(255,255,255,0.5)', background: f ? 'linear-gradient(90deg,rgba(124,92,255,0.85),rgba(255,92,141,0.75))' : 'rgba(0,0,0,0.35)' }}
            >
              <span className="text-[1.4vw] text-white/60">P{i + 1}</span>
              {it.label}
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[3vh] left-[6vw] flex items-center gap-4">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-white/55">{controlLine(room)}</span>
      </div>
    </div>
  );
}
