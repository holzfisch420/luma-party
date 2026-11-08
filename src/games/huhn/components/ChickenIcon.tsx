import { Star } from 'lucide-react';

/** kleines Huhn als SVG (Kopfzeile, Handy) */
export function ChickenIcon({ body = '#fbf7ee', dark = '#d9cfbb', className = '', dead = false }: { body?: string; dark?: string; className?: string; dead?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M18 46 L6 28 L12 46 L4 50 Z" fill={dark} />
      <line x1="46" y1="78" x2="42" y2="94" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      <line x1="56" y1="78" x2="62" y2="94" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="46" cy="60" rx="32" ry="24" fill={body} />
      <ellipse cx="40" cy="58" rx="16" ry="9" fill={dark} transform="rotate(-18 40 58)" />
      <circle cx="70" cy="34" r="15" fill={body} />
      <circle cx="64" cy="18" r="5" fill="#ef4444" />
      <circle cx="71" cy="16" r="5.5" fill="#ef4444" />
      <circle cx="78" cy="19" r="4.5" fill="#ef4444" />
      <path d="M83 32 L96 36 L83 41 Z" fill="#f59e0b" />
      <ellipse cx="83" cy="46" rx="3" ry="5" fill="#ef4444" />
      {dead ? (
        <path d="M70 28 l6 6 M76 28 l-6 6" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <circle cx="74" cy="31" r="3.5" fill="#1f2937" />
      )}
    </svg>
  );
}

export function Stars({ n, size = 'size-4' }: { n: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Schwierigkeit ${n} von 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < n ? 'text-[#ffd23f]' : 'text-white/25'}`} fill={i < n ? '#ffd23f' : 'transparent'} />
      ))}
    </span>
  );
}
