import { motion } from 'framer-motion';

export function RoomCodeDisplay({ code, size = 'md' }: { code: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-16 text-4xl rounded-2xl' : 'size-10 text-2xl rounded-xl';
  return (
    <div className="flex items-center gap-3" aria-label={`Raumcode ${code.split('').join(' ')}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Raumcode</span>
      <div className="flex gap-1.5">
        {code.split('').map((ch, i) => (
          <motion.span
            key={`${code}-${i}`}
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 22 }}
            className={`${box} grid place-items-center bg-white font-bold text-black shadow-lg shadow-white/10`}
          >
            {ch}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
