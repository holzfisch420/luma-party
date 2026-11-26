import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';

/** Arena von oben: Radar dreht sich, ein Panzer zielt auf den gewählten Knopf, Metallplatten mit Warnstreifen */
export function PanzerTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const n = items.length;
  // Turm zeigt auf den gewählten Knopf (Knöpfe stehen rechts untereinander)
  const angle = -25 + (50 * focus) / Math.max(1, n - 1);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#c9a86a] text-[#1f1a10]" style={{ backgroundImage: 'linear-gradient(rgba(60,40,10,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(60,40,10,0.12) 2px, transparent 2px)', backgroundSize: '6vw 6vw' }}>
      {/* Mauern */}
      <div className="absolute left-[4vw] top-[54vh] h-[3vh] w-[20vw] bg-[#6b5a3a] shadow-[0_6px_0_#4a3e26]" />
      <div className="absolute left-[34vw] top-[22vh] h-[26vh] w-[2.4vw] bg-[#6b5a3a] shadow-[6px_0_0_#4a3e26]" />
      {/* Radar */}
      <div className="absolute bottom-[6vh] left-[4vw] size-[30vh] overflow-hidden rounded-full border-4 border-[#2f4a2f] bg-[#0f2410]/85">
        <div className="absolute inset-[25%] rounded-full border border-[#3fdc5f]/40" />
        <div className="absolute inset-[5%] rounded-full border border-[#3fdc5f]/30" />
        <motion.div className="absolute inset-0" style={{ background: 'conic-gradient(from 0deg, rgba(63,220,95,0.55), transparent 22%)' }} animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
        {[0, 1, 2].map((k) => (
          <motion.span key={k} className="absolute size-[1.6vh] rounded-full bg-[#ff5c5c]" style={{ left: `${30 + k * 18}%`, top: `${35 + ((k * 23) % 40)}%` }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: k }} />
        ))}
      </div>
      {/* Panzer */}
      <div className="absolute left-[38vw] top-[50vh] size-[14vw]">
        <div className="absolute inset-[10%] rounded-[1vw] bg-[#e8873a] shadow-[0_1vh_0_#7a4b2a]">
          <div className="absolute inset-y-[-8%] left-0 w-[22%] rounded bg-[#3a3326] [background:repeating-linear-gradient(0deg,#3a3326_0_0.6vw,#5a5040_0.6vw_1.2vw)]" />
          <div className="absolute inset-y-[-8%] right-0 w-[22%] rounded bg-[#3a3326] [background:repeating-linear-gradient(0deg,#3a3326_0_0.6vw,#5a5040_0.6vw_1.2vw)]" />
        </div>
        <motion.div className="absolute left-1/2 top-1/2 h-[1.6vw] w-[11vw] origin-left" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
          <div className="absolute left-0 top-0 h-full w-full rounded-full bg-[#7a4b2a]" />
        </motion.div>
        <div className="absolute left-1/2 top-1/2 size-[6vw] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#7a4b2a] bg-[#f6c453]" />
      </div>
      <div className="absolute left-[4vw] top-[6vh]">
        <h1 className="text-[7.5vw] font-black uppercase leading-none tracking-[0.12em] text-[#1f1a10] [text-shadow:0.3vw_0.3vw_0_#f6c453]" style={{ fontFamily: 'var(--font-typewriter)' }}>
          {meta.name}
        </h1>
        <p className="mt-2 text-2xl font-black text-[#3a2e1a]">{meta.tagline}</p>
      </div>
      {/* Metallplatten */}
      <div className="absolute right-[5vw] top-[22vh] flex flex-col gap-[2vh]">
        {items.map((it, i) => {
          const f = focus === i;
          const start = it.action.kind === 'start';
          return (
            <motion.button
              key={it.id}
              onMouseEnter={() => setFocus(i)}
              onClick={() => activate(i)}
              animate={{ x: f ? '-1.5vw' : 0, scale: f ? 1.05 : 1 }}
              className={`relative w-[28vw] overflow-hidden rounded-lg border-[0.3vw] border-[#2a2a2a] px-[2vw] py-[1.6vh] text-left font-black uppercase tracking-[0.15em] shadow-[0_8px_0_#1a1a1a] ${start ? 'text-[2.2vw]' : 'text-[1.6vw]'} ${start && blocked ? 'opacity-60' : ''}`}
              style={{ background: 'linear-gradient(#9aa1a8,#6e757c)', fontFamily: 'var(--font-typewriter)', color: f ? '#1a1a1a' : '#2b2f33' }}
            >
              {f && <span className="absolute inset-y-0 left-0 w-[1.6vw] [background:repeating-linear-gradient(45deg,#ffd23f_0_0.6vw,#1a1a1a_0.6vw_1.2vw)]" />}
              <span className={f ? 'pl-[1.4vw]' : ''}>{it.label}</span>
              <span className="absolute right-3 top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#4a4f55]" />
            </motion.button>
          );
        })}
      </div>
      <div className="absolute bottom-[3vh] right-[5vw] flex items-center gap-3">
        <BlockedHint blocked={blocked} />
        <span className="text-lg font-bold text-[#3a2e1a]/70">{controlLine(room)}</span>
      </div>
    </div>
  );
}
