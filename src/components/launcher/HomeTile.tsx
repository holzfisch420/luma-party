import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface HomeTileProps {
  label: string;
  art: ReactNode;
  focused: boolean;
  /** Text in der Leiste unten, wenn ausgewählt (z. B. „Start“) */
  actionLabel?: string;
  /** Sprechblase mit Namen über der Kachel anzeigen */
  showBubble?: boolean;
  onClick?: () => void;
  size?: 'md' | 'lg';
  /** füllt die vorgegebene Rasterzelle (statt quadratisch) */
  fill?: boolean;
}

/**
 * Kachel im Home-Menü-Stil: glänzender weißer Rahmen, bei Auswahl cyanfarbener Rahmen,
 * „Start“-Leiste und eine Sprechblase mit dem Namen.
 */
export function HomeTile({ label, art, focused, actionLabel, showBubble = true, onClick, fill = false }: HomeTileProps) {
  return (
    <div className={`relative ${fill ? 'size-full' : 'aspect-square w-full'}`}>
      <AnimatePresence>
        {focused && showBubble && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="pointer-events-none absolute bottom-[calc(100%-14%)] left-1/2 z-30 -translate-x-1/2"
          >
            <div className="relative whitespace-nowrap rounded-[18px] border border-[#dfe3e8] bg-white/95 px-[clamp(0.9rem,1.6vw,1.8rem)] py-[clamp(0.4rem,0.8vw,0.9rem)] text-[clamp(1.1rem,2.1vw,2.6rem)] font-extrabold text-home-text shadow-[0_10px_25px_-8px_rgba(40,50,70,0.35)]">
              {label}
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[12px] border-t-[14px] border-x-transparent border-t-white/95 drop-shadow-[0_1px_0_#dfe3e8]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* drehender Lichtrahmen hinter der ausgewählten Kachel */}
      {focused && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tile-glow" />}
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-current={focused}
        tabIndex={-1}
        animate={{ scale: focused ? 1.08 : 1, y: focused ? -4 : 0 }}
        whileTap={{ scale: focused ? 1.02 : 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        className={`absolute inset-0 rounded-[24%] p-[6%] outline-none ${
          focused
            ? 'z-20 bg-gradient-to-b from-[#4fd3ee] to-[#18a9cb] shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_12px_28px_-8px_rgba(17,146,179,0.7)]'
            : 'home-tile z-10'
        }`}
      >
        <div className="relative size-full overflow-hidden rounded-[19%] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
          {art}
          {/* Glanz */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
          {focused && <div className="tile-sheen" />}
        </div>
        <AnimatePresence>
          {focused && actionLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-[6%] bottom-[4%] rounded-b-[19%] bg-gradient-to-b from-[#2cc0e0]/0 via-[#18a9cb]/90 to-[#138fae] pb-[4%] pt-[10%] text-center text-[clamp(0.85rem,1.6vw,2rem)] font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,0.25)]"
            >
              {actionLabel}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export function EmptyTile({ fill = false }: { fill?: boolean }) {
  return <div className={`${fill ? 'size-full' : 'aspect-square w-full'} rounded-[24%] border border-white/70 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`} aria-hidden />;
}
