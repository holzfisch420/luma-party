import { motion } from 'framer-motion';

const isLetter = (ch: string) => /[\p{L}\p{N}]/u.test(ch);

/** Gesuchtes Wort als Comic-Platzhalter: _ _ _ _ (aufgedeckte Hinweise ploppen auf). */
export function WordMask({ mask, size = 'md' }: { mask: (string | null)[]; size?: 'sm' | 'md' | 'lg' }) {
  const slot = { sm: 'w-4 h-7 text-xl', md: 'w-6 h-10 text-3xl', lg: 'w-9 h-14 text-5xl' }[size];
  const bar = { sm: 'h-[3px]', md: 'h-1', lg: 'h-[5px]' }[size];
  const letters = mask.filter((c) => c === null || isLetter(c)).length;
  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={`Gesuchtes Wort mit ${letters} Buchstaben`}>
      <div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-1">
        {mask.map((ch, i) =>
          ch === ' ' ? (
            <span key={i} className="w-4" />
          ) : (
            <span key={i} className={`${slot} font-bangers relative flex items-end justify-center uppercase`}>
              {ch !== null && (
                <motion.span initial={{ scale: 2.2, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} className={isLetter(ch) ? 'text-[#e2565c]' : ''}>
                  {ch}
                </motion.span>
              )}
              {(ch === null || isLetter(ch)) && <span className={`absolute bottom-0 w-full rounded-full bg-ink ${bar}`} style={{ transform: `rotate(${(i % 3) - 1}deg)` }} />}
            </span>
          ),
        )}
      </div>
      <span className="text-xs font-bold">{letters} Buchstaben</span>
    </div>
  );
}
