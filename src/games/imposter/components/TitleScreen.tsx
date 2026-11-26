import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Dunkel, Glitch-Titel, Schattengestalt – Knöpfe sind Geheimakten */
export function ImposterTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_70%_40%,#3b1a5c,#0a0612_65%)] text-white">
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0_2px,transparent_2px_5px)]" />
      {/* Schattengestalt */}
      <motion.div className="absolute bottom-0 right-[10vw] h-[78vh] w-[34vw]" animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <svg viewBox="0 0 300 420" className="size-full">
          <defs>
            <radialGradient id="imp-glow" cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor="#7c3aed" stopOpacity="0.55" />
              <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="150" cy="170" rx="170" ry="190" fill="url(#imp-glow)" />
          <path d="M150 40 C90 40 70 100 72 150 C40 190 20 300 10 420 L290 420 C280 300 260 190 228 150 C230 100 210 40 150 40 Z" fill="#050208" />
          <motion.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ transformOrigin: '150px 140px' }}>
            <ellipse cx="125" cy="140" rx="14" ry="6" fill="#e9d5ff" />
            <ellipse cx="175" cy="140" rx="14" ry="6" fill="#e9d5ff" />
          </motion.g>
          <text x="150" y="300" textAnchor="middle" fontSize="70" fill="#7c3aed" opacity="0.6" fontWeight="900">?</text>
        </svg>
      </motion.div>

      {/* Glitch-Titel */}
      <div className="absolute left-[6vw] top-[8vh]">
        <div className="relative font-bangers text-[9vw] leading-none tracking-wider">
          <motion.span className="absolute inset-0 text-[#ff2e63]" animate={{ x: [0, -6, 4, 0], opacity: [0.8, 0.6, 0.8] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2.2 }}>
            IMPOSTER
          </motion.span>
          <motion.span className="absolute inset-0 text-[#2ee6ff]" animate={{ x: [0, 6, -4, 0], opacity: [0.8, 0.6, 0.8] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2.2, delay: 0.05 }}>
            IMPOSTER
          </motion.span>
          <span className="relative">IMPOSTER</span>
        </div>
        <p className="mt-2 font-typewriter text-2xl text-[#c4b5fd]">Alle kennen das Wort. Fast alle.</p>
      </div>

      {/* Akten */}
      <div className="absolute bottom-[12vh] left-[6vw] flex flex-col gap-[1.2vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              initial={{ x: '-40vw' }}
              animate={{ x: f ? '2.5vw' : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: f ? 0 : 0.1 + i * 0.06 }}
              className={`relative flex w-[30vw] items-center gap-4 rounded-r-xl rounded-tl-xl px-6 py-[1.4vh] text-left font-typewriter text-[1.8vw] font-bold shadow-[0_10px_24px_rgba(0,0,0,0.6)] ${start && blocked ? 'opacity-50' : ''}`}
              style={{ background: f ? 'linear-gradient(90deg,#e8c98a,#d9b06a)' : 'linear-gradient(90deg,#4a3b26,#3a2e1e)', color: f ? '#2a1a0c' : '#d6c4a0' }}
            >
              <span className="absolute -top-3 left-4 h-4 w-20 rounded-t-md" style={{ background: f ? '#e8c98a' : '#4a3b26' }} />
              <span className="text-[1.2vw] opacity-60">#{String(i + 1).padStart(3, '0')}</span>
              {it.label}
              {f && (
                <motion.span initial={{ scale: 2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} className="ml-auto rounded border-[3px] border-[#c1121f] px-2 font-bangers text-[1.2vw] tracking-widest text-[#c1121f]">
                  {start ? 'STRENG GEHEIM' : 'AKTE'}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[4vh] left-[6vw] flex items-center gap-4">
        <BlockedHint blocked={blocked} />
        <span className="font-typewriter text-lg text-white/45">{controlLine(room)}</span>
      </div>
    </div>
  );
}
