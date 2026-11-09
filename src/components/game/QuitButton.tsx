import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Spiel beenden – für den Spielleiter (Handy) und den Hauptbildschirm.
 * Erst tippen öffnet eine Rückfrage, damit niemand aus Versehen ein laufendes Spiel abbricht.
 */
export function QuitButton({ onQuit, className = '', size = 'md', compact = false }: { onQuit: () => void; className?: string; size?: 'sm' | 'md'; compact?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  // Rückfrage schließt sich nach ein paar Sekunden von selbst
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 5000);
    return () => clearTimeout(t);
  }, [confirm]);
  const h = size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm';
  return (
    <div className={`flex items-center gap-1.5 font-sans ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {confirm ? (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`flex items-center gap-1 rounded-full bg-white/95 p-1 pl-3 font-extrabold text-[#3c4043] shadow-lg backdrop-blur ${h}`}>
            Spiel beenden?
            <button onClick={onQuit} className="h-full rounded-full bg-[#e03131] px-3 font-black text-white">
              Ja
            </button>
            <button onClick={() => setConfirm(false)} className="h-full rounded-full bg-black/10 px-3 font-black">
              Nein
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="quit"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setConfirm(true)}
            aria-label="Spiel beenden"
            title="Spiel beenden"
            className={`flex items-center justify-center gap-1 rounded-full bg-black/25 font-extrabold text-white/90 backdrop-blur transition hover:bg-black/40 ${compact ? 'size-8 opacity-70' : `px-3 ${h}`}`}
          >
            <X className="size-4" strokeWidth={3} /> {!compact && 'Beenden'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
