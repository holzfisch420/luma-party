import { AnimatePresence, motion } from 'framer-motion';
import { MILLS, POINTS, type Cell, type Side } from '../logic/rules';

const S = 100;
const px = (i: number) => POINTS[i]![0] * S;
const py = (i: number) => POINTS[i]![1] * S;

/** glänzender Spielstein */
export function Stone({ side, size = 1 }: { side: Side; size?: number }) {
  return (
    <svg viewBox="-50 -50 100 100" style={{ width: `${size}em`, height: `${size}em` }}>
      <circle r="44" fill={side === 'w' ? '#f4efe4' : '#2a2522'} stroke={side === 'w' ? '#b8a98d' : '#000'} strokeWidth="5" />
      <circle r="30" fill="none" stroke={side === 'w' ? '#d8cdb6' : '#423a35'} strokeWidth="5" />
      <ellipse cx="-14" cy="-18" rx="16" ry="9" fill="#fff" opacity={side === 'w' ? 0.8 : 0.22} />
    </svg>
  );
}

interface Props {
  board: Cell[];
  /** antippbare Punkte (leer = Ziel, eigener Stein = auswählbar) */
  active?: number[];
  /** Ziele des ausgewählten Steins */
  targets?: number[];
  /** Steine, die weggenommen werden dürfen */
  removable?: number[];
  selected?: number | null;
  last?: { from?: number; to?: number; removed?: number } | null;
  onPoint?: (i: number) => void;
  className?: string;
}

export function MillBoard({ board, active = [], targets = [], removable = [], selected, last, onPoint, className = '' }: Props) {
  const lines: [number, number][] = [];
  for (const [a, , c] of MILLS) lines.push([a, c]);
  // aktive Mühlen hervorheben
  const glowing = MILLS.filter((m) => board[m[0]] && m.every((q) => board[q] === board[m[0]]));
  return (
    <svg viewBox="-60 -60 720 720" className={`select-none ${className}`}>
      <defs>
        <radialGradient id="mb-wood" cx="40%" cy="30%" r="90%">
          <stop offset="0" stopColor="#e9c48a" />
          <stop offset="1" stopColor="#b9864b" />
        </radialGradient>
        <radialGradient id="mb-w" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9cfbd" />
        </radialGradient>
        <radialGradient id="mb-b" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5a524c" />
          <stop offset="1" stopColor="#151210" />
        </radialGradient>
      </defs>
      <rect x="-60" y="-60" width="720" height="720" rx="40" fill="url(#mb-wood)" stroke="#6b4423" strokeWidth="10" />
      {/* Holzmaserung */}
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M-60 ${-40 + i * 80} C 150 ${-20 + i * 80}, 450 ${-60 + i * 80}, 660 ${-35 + i * 80}`} stroke="#8a5a2b" strokeOpacity="0.12" strokeWidth="6" fill="none" />
      ))}
      {lines.map(([a, b], i) => (
        <line key={i} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} stroke="#4a2c14" strokeWidth="9" strokeLinecap="round" />
      ))}
      {glowing.map((m, i) => (
        <line key={`g${i}`} x1={px(m[0])} y1={py(m[0])} x2={px(m[2])} y2={py(m[2])} stroke="#ffd23f" strokeWidth="16" strokeLinecap="round" opacity="0.75" />
      ))}
      {POINTS.map((_, i) => (
        <circle key={`p${i}`} cx={px(i)} cy={py(i)} r="13" fill="#4a2c14" />
      ))}
      {/* Markierung des letzten Zugs */}
      {last?.from !== undefined && <circle cx={px(last.from)} cy={py(last.from)} r="30" fill="none" stroke="#ffd23f" strokeWidth="5" strokeDasharray="8 8" />}
      {last?.removed !== undefined && <text x={px(last.removed)} y={py(last.removed) + 14} textAnchor="middle" fontSize="44" fill="#c92a2a" fontWeight="900">✕</text>}
      <AnimatePresence>
        {board.map((c, i) =>
          c ? (
            <motion.g
              key={`s${i}-${c}`}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20 }}
              style={{ originX: `${px(i)}px`, originY: `${py(i)}px` }}
            >
              <circle cx={px(i) + 4} cy={py(i) + 7} r="36" fill="#000" opacity="0.25" />
              <circle cx={px(i)} cy={py(i)} r="36" fill={`url(#mb-${c})`} stroke={c === 'w' ? '#a8977a' : '#000'} strokeWidth="4" />
              <circle cx={px(i)} cy={py(i)} r="23" fill="none" stroke={c === 'w' ? '#d2c5ab' : '#3d3530'} strokeWidth="4" />
              {last?.to === i && <circle cx={px(i)} cy={py(i)} r="42" fill="none" stroke="#ffd23f" strokeWidth="6" />}
            </motion.g>
          ) : null,
        )}
      </AnimatePresence>
      {/* Hinweise zum Antippen */}
      {active.map((i) =>
        board[i] ? (
          <circle key={`a${i}`} cx={px(i)} cy={py(i)} r="44" fill="none" stroke="#81e6ff" strokeWidth="5" opacity="0.8" />
        ) : (
          <circle key={`a${i}`} cx={px(i)} cy={py(i)} r="16" fill="#81e6ff" opacity="0.85" />
        ),
      )}
      {targets.map((i) => (
        <circle key={`t${i}`} cx={px(i)} cy={py(i)} r="20" fill="#2fb67c" opacity="0.9">
          <animate attributeName="r" values="16;22;16" dur="1.2s" repeatCount="indefinite" />
        </circle>
      ))}
      {removable.map((i) => (
        <circle key={`r${i}`} cx={px(i)} cy={py(i)} r="46" fill="none" stroke="#ff4d4d" strokeWidth="7">
          <animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite" />
        </circle>
      ))}
      {selected != null && <circle cx={px(selected)} cy={py(selected)} r="46" fill="none" stroke="#ffd23f" strokeWidth="8" />}
      {/* große, unsichtbare Tippflächen */}
      {onPoint &&
        POINTS.map((_, i) => <circle key={`h${i}`} cx={px(i)} cy={py(i)} r="48" fill="transparent" onPointerDown={(e) => (e.preventDefault(), onPoint(i))} />)}
    </svg>
  );
}
