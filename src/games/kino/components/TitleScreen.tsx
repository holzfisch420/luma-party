import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

const NEON = ['#ff4d6d', '#2ee6ff', '#ffd23f', '#b197fc', '#51cf66', '#ff922b'];

/** Kinosaal: Leuchtreklame, Sitzreihen, Neon-Knöpfe – Filme/Serien/Beides starten direkt */
export function KinoTitleScreen({ room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#5a0f2e,#14060f_70%)] text-white">
      {/* Leinwand mit Projektor-Licht */}
      <div className="absolute left-1/2 top-[5vh] h-[34vh] w-[62vw] -translate-x-1/2 rounded-[1vw] bg-[linear-gradient(#2a1020,#1a0a14)] shadow-[0_0_80px_rgba(255,77,109,0.35)] ring-4 ring-[#3a1424]" />
      <motion.div className="pointer-events-none absolute bottom-[18vh] left-1/2 h-[60vh] w-[70vw] -translate-x-1/2" style={{ background: 'linear-gradient(to top, rgba(255,230,200,0.14), transparent)', clipPath: 'polygon(48% 100%, 52% 100%, 100% 0, 0 0)' }} animate={{ opacity: [0.6, 1, 0.7, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      {/* Leuchtreklame */}
      <div className="absolute left-1/2 top-[11vh] -translate-x-1/2 text-center">
        <motion.div
          className="whitespace-nowrap text-[7vw] font-black italic leading-none tracking-tight text-[#ffe3ea]"
          style={{ textShadow: '0 0 8px #ff4d6d, 0 0 24px #ff4d6d, 0 0 60px #ff2e63' }}
          animate={{ opacity: [1, 0.6, 1, 1, 0.8, 1] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.6, 0.62, 0.64] }}
        >
          Couch-Match
        </motion.div>
        <div className="mt-2 text-2xl font-bold text-[#ffc9d6]">Wischt euch zum perfekten Filmabend 🍿</div>
      </div>
      {/* Neon-Knöpfe */}
      <div className="absolute inset-x-0 top-[47vh] flex flex-wrap items-center justify-center gap-[2vw] px-[6vw]">
        {items.map((it, i) => {
          const f = focus === i;
          const c = NEON[i % NEON.length]!;
          const start = it.action.kind === 'start';
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ scale: f ? 1.12 : 1 }}
              className={`rounded-[1.2vw] border-[0.3vw] px-[2.2vw] py-[1.6vh] font-black italic ${start ? 'text-[2.8vw]' : 'text-[1.8vw]'} ${start && blocked ? 'opacity-50' : ''}`}
              style={{
                borderColor: c,
                color: f ? '#fff' : c,
                background: f ? `${c}33` : 'rgba(0,0,0,0.35)',
                boxShadow: f ? `0 0 18px ${c}, inset 0 0 18px ${c}88` : `0 0 6px ${c}55`,
                textShadow: f ? `0 0 12px ${c}` : 'none',
              }}
            >
              {it.label}
            </motion.button>
          );
        })}
      </div>
      {/* Sitzreihen */}
      <div className="absolute inset-x-0 bottom-0 h-[24vh]">
        {[0, 1].map((row) => (
          <div key={row} className="absolute inset-x-[-2vw] flex justify-center gap-[0.6vw]" style={{ bottom: `${row * 9}vh`, transform: `scale(${1 - row * 0.12})` }}>
            {Array.from({ length: 18 - row * 2 }).map((_, k) => (
              <div key={k} className="h-[13vh] w-[5.4vw] rounded-t-[1.6vw] bg-[linear-gradient(#7a1430,#3a0818)] shadow-[inset_0_6px_0_rgba(255,255,255,0.08)]" />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute bottom-[2vh] inset-x-0 flex flex-col items-center gap-1">
        <BlockedHint blocked={blocked} />
        <span className="text-sm font-bold text-white/60">{controlLine(room)}</span>
      </div>
    </div>
  );
}
