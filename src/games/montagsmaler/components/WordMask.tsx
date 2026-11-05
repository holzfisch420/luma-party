import { motion } from 'framer-motion';

/** Zeigt das gesuchte Wort als Platzhalter: _ _ _ _ (aufgedeckte Hinweise erscheinen animiert). */
export function WordMask({ mask, size = 'md' }: { mask: (string | null)[]; size?: 'sm' | 'md' | 'lg' }) {
  const slot = { sm: 'w-4 h-6 text-base', md: 'w-6 h-9 text-2xl', lg: 'w-9 h-12 text-4xl' }[size];
  const letters = mask.filter((c) => c === null || /[\p{L}\p{N}]/u.test(c)).length;
  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Gesuchtes Wort mit ${letters} Buchstaben`}>
      <div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-2">
        {mask.map((ch, i) =>
          ch === ' ' ? (
            <span key={i} className="w-4" />
          ) : (
            <span key={i} className={`${slot} relative flex items-end justify-center font-bold uppercase`}>
              {ch !== null && (
                <motion.span initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={/[\p{L}\p{N}]/u.test(ch) ? 'text-amber-200' : 'text-white/70'}>
                  {ch}
                </motion.span>
              )}
              {(ch === null || /[\p{L}\p{N}]/u.test(ch)) && <span className="absolute bottom-0 h-[3px] w-full rounded-full bg-white/70" />}
            </span>
          ),
        )}
      </div>
      <span className="text-xs font-medium text-white/45 tabular-nums">{letters} Buchstaben</span>
    </div>
  );
}
