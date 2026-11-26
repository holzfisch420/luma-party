import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Landstraße: ein Huhn rennt hin und her, Knöpfe sind gelbe Verkehrsschilder */
export function HuhnTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(#7fd3ff,#c8ecff_55%)] text-[#1d2a44]">
      {/* Wolken */}
      {[0, 1, 2].map((k) => (
        <motion.div key={k} className="absolute h-[8vh] w-[16vw] rounded-full bg-white/90 shadow-[2vw_1vh_0_-0.5vw_white,-3vw_1vh_0_-1vw_white]" style={{ top: `${6 + k * 9}vh` }} initial={{ x: `${-20 + k * 40}vw` }} animate={{ x: '120vw' }} transition={{ duration: 40 + k * 10, repeat: Infinity, ease: 'linear' }} />
      ))}
      {/* Hügel */}
      <div className="absolute inset-x-[-10vw] bottom-[20vh] h-[30vh] rounded-[50%] bg-[#7ccf4e]" />
      <div className="absolute inset-x-0 bottom-[16vh] h-[18vh] bg-[#5fb83a]" />
      {/* Straße */}
      <div className="absolute inset-x-0 bottom-0 h-[18vh] bg-[#4a4f5c]">
        <div className="absolute inset-x-0 top-1/2 h-[1vh] -translate-y-1/2 [background:repeating-linear-gradient(90deg,#fff_0_5vw,transparent_5vw_9vw)]" />
      </div>
      {/* rennendes Huhn */}
      <motion.div className="absolute bottom-[5vh] text-[9vh]" animate={{ x: ['-10vw', '105vw'], scaleX: [1, 1] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}>
        <motion.span className="inline-block" animate={{ y: [0, -14, 0] }} transition={{ duration: 0.3, repeat: Infinity }}>
          🐔
        </motion.span>
      </motion.div>
      <div className="absolute left-[6vw] top-[8vh]">
        <motion.h1 initial={{ rotate: -8, scale: 0.6 }} animate={{ rotate: -3, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="font-bangers text-[8.5vw] leading-none tracking-wide text-[#ff8c42] [text-shadow:0.3vw_0.3vw_0_#1d4ed8,0.6vw_0.6vw_0_#1d2a44]">
          {meta.name}
        </motion.h1>
        <p className="mt-2 text-3xl font-black">{meta.tagline}</p>
      </div>
      {/* Schilder am Straßenrand */}
      <div className="absolute bottom-[17vh] right-[3vw] flex items-end gap-[1.4vw]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          const size = start ? 14 : 11.5;
          return (
            <button key={it.id} onMouseEnter={() => setFocus(i)} onClick={() => activate(i)} className={`flex flex-col items-center ${start && blocked ? 'opacity-60' : ''}`}>
              <motion.div
                animate={{ rotate: f ? [0, -6, 6, -3, 0] : 0, y: f ? -10 : 0 }}
                transition={{ duration: 0.5 }}
                className="grid rotate-45 place-items-center rounded-[1vw] border-[0.5vw] border-[#1d2a44] shadow-lg"
                style={{ width: `${size * 0.72}vw`, height: `${size * 0.72}vw`, background: f ? '#ffd23f' : '#ffe680' }}
              >
                <span className={`-rotate-45 px-2 text-center font-black leading-tight ${start ? 'text-[1.7vw]' : it.label.length > 9 ? 'text-[0.95vw]' : 'text-[1.15vw]'}`}>{it.label}</span>
              </motion.div>
              <div className="w-[0.6vw] bg-[#8b8f99]" style={{ height: `${6 + (i % 2) * 3}vh` }} />
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-[1.5vh] left-[2vw] flex items-center gap-3">
        <BlockedHint blocked={blocked} className="!py-1 !text-sm" />
        <span className="text-sm font-bold text-white/80">{controlLine(room)}</span>
      </div>
    </div>
  );
}
