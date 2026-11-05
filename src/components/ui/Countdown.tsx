import { motion } from 'framer-motion';
import { useCountdown } from '../../app/session/hooks';

/** Kreisförmiger Countdown, synchron zur Serverzeit. */
export function Countdown({ endsAt, durationMs, size = 64, stroke = 6 }: { endsAt: number; durationMs: number; size?: number; stroke?: number }) {
  const remaining = useCountdown(endsAt, 100);
  const seconds = Math.ceil(remaining / 1000);
  const fraction = durationMs > 0 ? remaining / durationMs : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const urgent = seconds <= 10 && remaining > 0;
  const color = urgent ? '#fb7185' : fraction < 0.5 ? '#fbbf24' : '#34d399';
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-label={`${seconds} Sekunden`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.4s' }}
        />
      </svg>
      <motion.span
        key={urgent ? seconds : 'calm'}
        initial={urgent ? { scale: 1.35 } : false}
        animate={{ scale: 1 }}
        className="absolute font-semibold tabular-nums"
        style={{ fontSize: size * 0.32, color: urgent ? '#fecdd3' : 'white' }}
      >
        {seconds}
      </motion.span>
    </div>
  );
}
