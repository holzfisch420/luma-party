import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { playSfx } from '../../../app/audio/sfx';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Nachtdorf: Mond geht auf, Nebel zieht, Fenster flackern – Knöpfe sind Schilder am Wegweiser */
export function VollmondTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  useEffect(() => {
    const t = setTimeout(() => playSfx('howl', { vol: 0.5 }), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(#070b1f,#16204a_55%,#2a2350)] text-[#e9e4ff]">
      {/* Sterne */}
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute size-[3px] rounded-full bg-white"
          style={{ left: `${(i * 61) % 100}%`, top: `${(i * 29) % 55}%` }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: (i % 7) * 0.3 }}
        />
      ))}
      {/* Mond */}
      <motion.div
        initial={{ y: '40vh', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        className="absolute left-[36vw] top-[5vh] size-[17vw] rounded-full bg-[radial-gradient(circle_at_40%_40%,#fffbe6,#f3e3a0_60%,#d9c27a)] shadow-[0_0_120px_40px_rgba(255,240,180,0.35)]"
      >
        <span className="absolute left-[25%] top-[30%] size-[14%] rounded-full bg-[#d8c78e]/60" />
        <span className="absolute left-[55%] top-[55%] size-[18%] rounded-full bg-[#d8c78e]/50" />
      </motion.div>
      {/* Dorf-Silhouette */}
      <svg viewBox="0 0 1600 400" preserveAspectRatio="none" className="absolute bottom-0 h-[42vh] w-full">
        <path d="M0 400 L0 260 L60 200 L120 260 L120 230 L180 170 L240 230 L240 400 Z M200 400 L200 280 L290 210 L380 280 L380 400 Z M330 400 L330 300 L400 250 L470 300 L470 400 Z" fill="#0b0f22" />
        <path d="M500 400 L560 180 L620 400 Z M580 400 L650 140 L720 400 Z M680 400 L740 200 L800 400 Z M760 400 L830 160 L900 400 Z M1300 400 L1360 190 L1420 400 Z M1380 400 L1450 150 L1520 400 Z M1480 400 L1540 210 L1600 400 Z" fill="#070a18" />
        <path d="M880 400 L880 270 L960 210 L1040 270 L1040 400 Z M1000 400 L1000 240 L1090 170 L1180 240 L1180 400 Z M1150 400 L1150 290 L1220 240 L1290 290 L1290 400 Z" fill="#0b0f22" />
        {[
          [70, 290], [150, 270], [300, 320], [420, 330], [930, 300], [1080, 280], [1220, 320], [1050, 330],
        ].map(([x, y], i) => (
          <motion.rect key={i} x={x} y={y} width="22" height="26" rx="3" fill="#ffcc66" animate={{ opacity: [0.9, 0.35, 0.9, 0.7] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.4 }} />
        ))}
        {/* Wolfsaugen im Wald */}
        <motion.g animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 6, repeat: Infinity, times: [0, 0.5, 0.55, 0.8, 0.85] }}>
          <circle cx="690" cy="330" r="5" fill="#ff3b3b" />
          <circle cx="708" cy="330" r="5" fill="#ff3b3b" />
        </motion.g>
      </svg>
      {/* Nebel */}
      {[0, 1].map((k) => (
        <motion.div
          key={k}
          className="pointer-events-none absolute bottom-[4vh] h-[22vh] w-[160vw] rounded-[50%] bg-white/10 blur-3xl"
          initial={{ x: k ? '-60vw' : '0vw' }}
          animate={{ x: k ? ['-60vw', '0vw'] : ['0vw', '-60vw'] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
        />
      ))}

      <div className="absolute left-[6vw] top-[38vh] max-w-[46vw]">
        <motion.h1 initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0.06em' }} transition={{ duration: 1.6 }} className="font-mystery text-[7vw] font-black leading-none text-[#f3ecff] [text-shadow:0_0_30px_rgba(180,160,255,0.65)]">
          Vollmond
        </motion.h1>
        <p className="mt-3 text-2xl font-bold text-[#c8bff0]">Wer im Dorf ist in Wahrheit ein Werwolf?</p>
      </div>

      {/* Wegweiser */}
      <div className="absolute bottom-0 right-[22vw] flex h-[86vh] w-[3vw] justify-center">
        <div className="absolute inset-y-0 w-[1.4vw] rounded-t bg-gradient-to-r from-[#3b2614] to-[#5a3a1e]" />
        <div className="relative mt-[6vh] flex flex-col items-center gap-[2.2vh]">
          {items.map((it, i) => {
            const f = focus === i;
            const left = i % 2 === 1;
            const start = it.action.kind === 'start';
            return (
              <motion.button
                key={it.id}
                onMouseEnter={() => setFocus(i)}
                onClick={() => activate(i)}
                initial={{ rotate: left ? 20 : -20, opacity: 0 }}
                animate={{ rotate: f ? (left ? 3 : -3) : left ? -2 : 2, opacity: 1, x: left ? '-58%' : '58%', scale: f ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.4 + i * 0.1 }}
                className={`relative w-[19vw] px-[2vw] py-[1.4vh] font-mystery text-[1.9vw] font-black text-[#2a1a0c] shadow-[0_8px_18px_rgba(0,0,0,0.6)] ${start && blocked ? 'opacity-60' : ''}`}
                style={{
                  clipPath: left ? 'polygon(10% 0, 100% 0, 100% 100%, 10% 100%, 0 50%)' : 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%)',
                  background: f ? 'linear-gradient(#ffd98a,#e0a64e)' : 'linear-gradient(#b0804a,#8a5a2c)',
                }}
              >
                {it.label}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-[4vh] left-[6vw] flex flex-col items-start gap-2">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-[#c8bff0]/70">{controlLine(room)}</span>
      </div>
    </div>
  );
}
