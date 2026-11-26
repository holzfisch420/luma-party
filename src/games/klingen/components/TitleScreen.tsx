import { motion } from 'framer-motion';
import { BlockedHint, controlLine } from '../../../components/game-menu/primitives';
import type { TitleScreenProps } from '../../game-types';
import { KlingenCover } from './Cover';

/** Zirkuszelt: Scheinwerfer, drehendes Rad, Knöpfe als Glühbirnen-Schilder */
export function KlingenTitleScreen({ meta, room, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const starts = items.map((it, i) => ({ it, i })).filter(({ it }) => it.action.kind === 'start');
  const rest = items.map((it, i) => ({ it, i })).filter(({ it }) => it.action.kind !== 'start');
  const sign = ({ it, i }: { it: (typeof items)[number]; i: number }, big: boolean) => {
    const f = focus === i;
    return (
      <motion.button
        key={it.id}
        onMouseEnter={() => setFocus(i)}
        onClick={() => activate(i)}
        animate={{ scale: f ? 1.1 : 1, rotate: f ? 0 : big ? (i % 2 ? 2 : -2) : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className={`relative rounded-[1.4vw] border-[0.35vw] border-[#e8b84a] font-stage font-black text-[#ffe9a8] shadow-[0_12px_30px_rgba(0,0,0,0.6)] ${big ? 'px-[3vw] py-[2.4vh] text-[3.4vw]' : 'px-[1.8vw] py-[1.2vh] text-[1.8vw]'} ${big && blocked ? 'opacity-60' : ''}`}
        style={{ background: f ? 'linear-gradient(#b3161f,#6b0a12)' : 'linear-gradient(#4a0d12,#2b0609)' }}
      >
        {/* Glühbirnen rundherum */}
        <span className="pointer-events-none absolute inset-[-0.7vw] rounded-[1.8vw]" style={{ backgroundImage: 'radial-gradient(circle, #ffe9a8 0 3px, transparent 4px)', backgroundSize: '1.6vw 1.6vw', WebkitMask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)', padding: '0.6vw', opacity: f ? 1 : 0.35 }} />
        <span className={f ? '[text-shadow:0_0_14px_rgba(255,213,107,0.9)]' : ''}>{it.label}</span>
      </motion.button>
    );
  };
  return (
    <div className="circus-bg absolute inset-0 overflow-hidden text-white">
      {/* Scheinwerfer */}
      {[-1, 1].map((s) => (
        <motion.div
          key={s}
          className="pointer-events-none absolute bottom-0 h-[130vh] w-[18vw] origin-bottom mix-blend-screen"
          style={{ left: s < 0 ? '8vw' : 'auto', right: s > 0 ? '8vw' : 'auto', background: 'linear-gradient(to top, rgba(255,240,190,0.4), transparent 85%)', clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)' }}
          animate={{ rotate: s < 0 ? [18, -10, 18] : [-18, 10, -18] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-x-0 top-[5vh] flex justify-center">
        <motion.div initial={{ y: -200 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }} className="marquee font-stage text-[6.5vw] font-black leading-none tracking-tight text-[#ffe9a8] [text-shadow:0_0_24px_rgba(255,213,107,0.75)]">
          {meta.name}
        </motion.div>
      </div>
      {/* drehendes Rad */}
      <div className="absolute left-1/2 top-[24vh] size-[40vh] -translate-x-1/2 overflow-hidden rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <KlingenCover meta={meta} focused />
      </div>
      <div className="absolute inset-x-0 bottom-[17vh] flex items-end justify-center gap-[4vw]">{starts.map((s) => sign(s, true))}</div>
      <div className="absolute inset-x-0 bottom-[6vh] flex items-end justify-center gap-[2vw]">{rest.map((s) => sign(s, false))}</div>
      <div className="absolute bottom-[1.5vh] inset-x-0 flex items-center justify-center gap-4">
        <BlockedHint blocked={blocked} className="!py-1 !text-sm" />
        <span className="text-sm font-bold text-white/70">{controlLine(room)}</span>
      </div>
    </div>
  );
}
