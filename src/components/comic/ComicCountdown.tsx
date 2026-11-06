import { motion } from 'framer-motion';
import { useCountdown } from '../../app/session/hooks';

/** Comic-Countdown: Kreis mit dicker Kontur und tickendem Füllstand; wackelt in den letzten 10 s. */
export function ComicCountdown({ endsAt, durationMs, size = 72 }: { endsAt: number; durationMs: number; size?: number }) {
  const remaining = useCountdown(endsAt, 100);
  const seconds = Math.ceil(remaining / 1000);
  const fraction = durationMs > 0 ? Math.min(1, remaining / durationMs) : 0;
  const urgent = seconds <= 10 && remaining > 0;
  const fill = urgent ? '#ff4b4b' : fraction < 0.5 ? '#ffd93b' : '#3fd07a';
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <motion.div
      animate={urgent ? { rotate: [0, -6, 6, -4, 0] } : { rotate: 0 }}
      transition={urgent ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : undefined}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${seconds} Sekunden`}
    >
      <svg viewBox="0 0 100 100" className="size-full overflow-visible">
        <circle cx="53" cy="53" r="46" fill="#161616" />
        <circle cx="50" cy="50" r="46" fill="#fff" stroke="#161616" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={r / 2}
          fill="none"
          stroke={fill}
          strokeWidth={r}
          strokeDasharray={`${(c / 2) * fraction} ${c}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.3s' }}
        />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#161616" strokeWidth="5" />
      </svg>
      <span className="font-bangers absolute inset-0 grid place-items-center text-ink [-webkit-text-stroke:1.5px_#fff] [paint-order:stroke_fill]" style={{ fontSize: size * 0.42 }}>
        {seconds}
      </span>
    </motion.div>
  );
}
