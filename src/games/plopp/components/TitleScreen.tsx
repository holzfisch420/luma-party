import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playOneOf } from '../../../app/audio/sfx';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';
import { Ocean, Puffer } from './shared';

/** Unterwasser: Knöpfe sind Luftblasen, der Kugelfisch bläht sich bei jedem Wechsel auf */
export function PloppTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const [puff, setPuff] = useState(0.2);
  useEffect(() => {
    setPuff(0.75);
    playOneOf(['bubble-1', 'bubble-2', 'bubble-3'], { vol: 0.35, vary: 0.15 });
    const t = setTimeout(() => setPuff(0.2), 260);
    return () => clearTimeout(t);
  }, [focus]);
  const n = items.length;
  return (
    <div className="absolute inset-0 overflow-hidden text-white">
      <Ocean />
      {/* Titel mit wackelnden Buchstaben */}
      <div className="absolute inset-x-0 top-[7vh] flex flex-col items-center">
        <div className="flex">
          {'Plopp!'.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="font-black text-[10vw] leading-none tracking-tight drop-shadow-[0_8px_0_rgba(0,30,60,0.45)]"
              animate={{ y: [0, -18, 0], rotate: [0, i % 2 ? 4 : -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <p className="text-3xl font-black text-[#ffd23f] drop-shadow">Antwort tippen, Fisch weitergeben – bevor er platzt!</p>
      </div>
      {/* Kugelfisch */}
      <motion.div className="absolute right-[5vw] top-[30vh] -scale-x-100" animate={{ y: [0, -16, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <Puffer tension={puff} size={Math.round(window.innerHeight * 0.36)} />
      </motion.div>
      {/* Blasen-Knöpfe im Bogen */}
      <div className="absolute inset-x-[24vw] bottom-[9vh] top-[42vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          const x = (i / Math.max(1, n - 1)) * 100;
          const y = 40 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 40;
          const size = start ? 16 : 11.5;
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              className={`absolute grid -translate-x-1/2 place-items-center rounded-full border-[3px] text-center font-black leading-tight backdrop-blur-[2px] ${f ? 'border-white bg-white/35' : 'border-white/60 bg-white/10'} ${start && blocked ? 'opacity-60' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${size}vw`, height: `${size}vw`, fontSize: start ? '2.2vw' : '1.45vw', boxShadow: 'inset -10px -14px 24px rgba(255,255,255,0.25), inset 8px 10px 18px rgba(0,40,80,0.25)' }}
              animate={{ y: [0, -12, 0], scale: f ? 1.18 : 1 }}
              transition={{ y: { duration: 2.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }, scale: { type: 'spring', stiffness: 300, damping: 14 } }}
            >
              <span className="absolute left-[22%] top-[16%] h-[14%] w-[24%] rotate-[-30deg] rounded-full bg-white/70" />
              <span className="px-2 drop-shadow-[0_2px_2px_rgba(0,30,60,0.6)]">{it.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[3vh] inset-x-0 flex flex-col items-center gap-2">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-white/70">{controlLine(room)}</span>
      </div>
    </div>
  );
}
