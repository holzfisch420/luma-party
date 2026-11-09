/**
 * Zeichnet einen „Knubbel“ als SVG: glänzende Vinyl-Spielzeugfigur mit Licht von oben links,
 * Reflexlicht von unten, Glanzpunkten und weichem Bodenschatten.
 * `look="home"` = weich (Launcher), `look="comic"` = dicke schwarze Kontur (Spiele).
 */
import { useId, type ReactNode } from 'react';
import { BG_COLORS, BODY_COLORS, EYE_COLORS, SLIDER_MAX, type AvatarConfig } from '../../shared/avatar';

/** Farbe aufhellen (amt > 0) oder abdunkeln (amt < 0) */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Hintergrund eines Avatars als CSS (für runde Rahmen, Kacheln usw.) */
export function avatarBackground(a: AvatarConfig): string {
  const bg = BG_COLORS[a.bg] ?? BG_COLORS[0];
  return `radial-gradient(circle at 50% 38%, ${shade(bg, 0.55)}, ${bg} 55%, ${shade(bg, -0.12)})`;
}

interface Props {
  avatar: AvatarConfig;
  look?: 'home' | 'comic';
  /** 'bust' = näher ran (runde Avatare), 'full' = ganze Figur */
  crop?: 'bust' | 'full';
  /** Hintergrundfarbe mitzeichnen */
  background?: boolean;
  className?: string;
  title?: string;
}

interface ShapeInfo {
  path: string;
  /** Mitte des Gesichts */
  cy: number;
  /** oberster Punkt in der Mitte (für Extras) */
  top: number;
  /** halbe Breite auf Augenhöhe (begrenzt den Augenabstand) */
  half: number;
  /** Ansatz für breite Extras (Ohren, Hörner, Krone, Mütze) – bei spitzen Formen tiefer */
  crown?: number;
}

const SHAPES: ShapeInfo[] = [
  { path: 'M50 24 a32 32 0 1 1 -0.01 0 Z', cy: 54, top: 24, half: 30 },
  { path: 'M50 21 C70 21 82 47 82 64 C82 81 68 90 50 90 C32 90 18 81 18 64 C18 47 30 21 50 21 Z', cy: 59, top: 21, half: 31 },
  { path: 'M38 25 H62 C75 25 81 31 81 44 V72 C81 84 75 89 62 89 H38 C25 89 19 84 19 72 V44 C19 31 25 25 38 25 Z', cy: 55, top: 25, half: 31 },
  { path: 'M50 15 C57 31 82 44 82 64 C82 81 68 90 50 90 C32 90 18 81 18 64 C18 44 43 31 50 15 Z', cy: 62, top: 15, half: 30, crown: 33 },
  { path: 'M42 32 H58 C74 32 86 43 86 58 C86 73 74 84 58 84 H42 C26 84 14 73 14 58 C14 43 26 32 42 32 Z', cy: 57, top: 32, half: 36 },
  { path: 'M18 57 C18 37 32 24 50 24 C68 24 82 37 82 57 V86 Q77 80 71 86 Q65 92 59 86 Q54 80 50 86 Q46 92 41 86 Q35 80 29 86 Q23 92 18 86 Z', cy: 52, top: 24, half: 31 },
  { path: 'M28 86 C15 86 10 72 19 64 C12 53 21 40 34 44 C37 31 59 27 65 40 C78 36 91 48 84 60 C93 66 89 86 74 86 Z', cy: 62, top: 33, half: 33 },
];

const INK = '#232032';

export function AvatarFace({ avatar: a, look = 'home', crop = 'full', background = false, className = '', title }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const id = (k: string) => `${uid}-${k}`;
  const shape = SHAPES[a.shape] ?? SHAPES[0]!;
  const base = BODY_COLORS[a.color] ?? BODY_COLORS[0];
  const eyeColor = EYE_COLORS[a.eyeColor] ?? EYE_COLORS[0];
  const bg = BG_COLORS[a.bg] ?? BG_COLORS[0];
  const comic = look === 'comic';
  const dark = shade(base, -0.62);

  // Regler → Maße
  const k = (v: number) => (v - SLIDER_MAX / 2) / (SLIDER_MAX / 2); // -1 … 1
  const er = 6.4 * (1 + k(a.eyeSize) * 0.38);
  const gap = Math.min(shape.half - er - 3, 14.5 + k(a.eyeGap) * 6);
  const ey = shape.cy - 4 - k(a.eyeY) * 7;
  const ms = 1 + k(a.mouthSize) * 0.4;
  const my = Math.max(ey + er + 5, shape.cy + 12 - k(a.mouthY) * 6);
  const lx = 50 - gap;
  const rx = 50 + gap;

  const viewBox = crop === 'bust' ? '9 10 82 82' : '0 0 100 100';
  const outline = comic ? { stroke: '#161616', strokeWidth: 3, strokeLinejoin: 'round' as const } : {};

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={title ?? 'Avatar'}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={id('body')} cx="34%" cy="26%" r="85%">
          <stop offset="0" stopColor={shade(base, 0.5)} />
          <stop offset="0.42" stopColor={base} />
          <stop offset="1" stopColor={shade(base, -0.38)} />
        </radialGradient>
        <radialGradient id={id('bounce')} cx="55%" cy="112%" r="62%">
          <stop offset="0" stopColor={shade(base, 0.6)} stopOpacity="0.55" />
          <stop offset="1" stopColor={shade(base, 0.6)} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('bg')} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor={shade(bg, 0.55)} />
          <stop offset="0.6" stopColor={bg} />
          <stop offset="1" stopColor={shade(bg, -0.15)} />
        </radialGradient>
        <radialGradient id={id('sclera')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dcdce8" />
        </radialGradient>
        <radialGradient id={id('iris')} cx="50%" cy="65%" r="60%">
          <stop offset="0" stopColor={shade(eyeColor, 0.45)} />
          <stop offset="1" stopColor={eyeColor} />
        </radialGradient>
        <linearGradient id={id('mouth')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a0f1f" />
          <stop offset="1" stopColor="#6e1e35" />
        </linearGradient>
        <radialGradient id={id('gold')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.5" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#c78a00" />
        </radialGradient>
        <radialGradient id={id('accent')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffd6e7" />
          <stop offset="0.5" stopColor="#ff5c8d" />
          <stop offset="1" stopColor="#b8204f" />
        </radialGradient>
        <radialGradient id={id('leaf')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#d8f5a2" />
          <stop offset="0.5" stopColor="#5fbf3a" />
          <stop offset="1" stopColor="#2b7a1d" />
        </radialGradient>
        <radialGradient id={id('ivory')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9cbb0" />
        </radialGradient>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <clipPath id={id('clip')}>
          <path d={shape.path} />
        </clipPath>
      </defs>

      {background && <rect x="0" y="0" width="100" height="100" fill={`url(#${id('bg')})`} />}

      {/* Bodenschatten */}
      <ellipse cx="50" cy="93" rx="27" ry="4.2" fill="#000" opacity="0.2" filter={`url(#${id('soft')})`} />

      {/* Extras hinter dem Körper */}
      <Extra kind={a.extra} layer="back" top={shape.top} crown={shape.crown ?? shape.top} base={base} id={id} />

      {/* Körper */}
      <path d={shape.path} fill={`url(#${id('body')})`} {...outline} />
      <g clipPath={`url(#${id('clip')})`}>
        <path d={shape.path} fill={`url(#${id('bounce')})`} />
        {/* Kantenschatten unten für Volumen */}
        <ellipse cx="50" cy="104" rx="44" ry="16" fill={shade(base, -0.5)} opacity="0.22" filter={`url(#${id('soft')})`} />
      </g>
      {/* Glanzlichter */}
      <ellipse cx="36" cy={shape.top + 11} rx="10" ry="5.5" fill="#fff" opacity="0.6" transform={`rotate(-28 36 ${shape.top + 11})`} filter={`url(#${id('blur')})`} />
      <circle cx="29" cy={shape.top + 19} r="2" fill="#fff" opacity="0.85" />

      {/* Bäckchen */}
      {a.cheeks && (
        <g opacity="0.55" filter={`url(#${id('soft')})`}>
          <ellipse cx={lx - 3} cy={ey + er + 5} rx="5.5" ry="3.4" fill="#ff6b8b" />
          <ellipse cx={rx + 3} cy={ey + er + 5} rx="5.5" ry="3.4" fill="#ff6b8b" />
        </g>
      )}

      {/* Augenbrauen */}
      <Brows kind={a.brows} lx={lx} rx={rx} y={ey - er - 3.5} r={er} color={dark} />

      {/* Augen */}
      <Eye kind={a.eyes} x={lx} y={ey} r={er} side="left" id={id} base={base} comic={comic} />
      <Eye kind={a.eyes} x={rx} y={ey} r={er} side="right" id={id} base={base} comic={comic} />

      {/* Mund */}
      <g transform={`translate(50 ${my}) scale(${ms}) translate(-50 ${-my})`}>
        <Mouth kind={a.mouth} y={my} id={id} />
      </g>

      {/* Extras vor dem Körper */}
      <Extra kind={a.extra} layer="front" top={shape.top} crown={shape.crown ?? shape.top} base={base} id={id} />
    </svg>
  );
}

// ------------------------------------------------------------------ Augen

function Glint({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <>
      <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.3} ry={r * 0.24} fill="#fff" opacity="0.95" />
      <circle cx={x + r * 0.3} cy={y + r * 0.28} r={r * 0.12} fill="#fff" opacity="0.85" />
    </>
  );
}

function Eye({ kind, x, y, r, side, id, base, comic }: { kind: number; x: number; y: number; r: number; side: 'left' | 'right'; id: (k: string) => string; base: string; comic: boolean }) {
  const ring = comic ? { stroke: '#161616', strokeWidth: 1.6 } : { stroke: shade(base, -0.45), strokeWidth: 0.6, strokeOpacity: 0.6 };
  const arc = (up: boolean) => (
    <path
      d={up ? `M${x - r} ${y + r * 0.3} Q${x} ${y - r * 0.9} ${x + r} ${y + r * 0.3}` : `M${x - r} ${y - r * 0.2} Q${x} ${y + r * 0.8} ${x + r} ${y - r * 0.2}`}
      fill="none"
      stroke={INK}
      strokeWidth={Math.max(1.6, r * 0.38)}
      strokeLinecap="round"
    />
  );
  switch (kind) {
    case 1: // Oval
      return (
        <g>
          <ellipse cx={x} cy={y} rx={r * 0.78} ry={r * 1.15} fill={`url(#${id('sclera')})`} {...ring} />
          <ellipse cx={x} cy={y + r * 0.2} rx={r * 0.52} ry={r * 0.78} fill={`url(#${id('iris')})`} />
          <ellipse cx={x} cy={y + r * 0.25} rx={r * 0.26} ry={r * 0.42} fill={INK} />
          <Glint x={x} y={y} r={r * 0.9} />
        </g>
      );
    case 2: // Kulleraugen
      return (
        <g>
          <circle cx={x} cy={y} r={r * 1.08} fill={`url(#${id('sclera')})`} {...ring} />
          <circle cx={x} cy={y + r * 0.08} r={r * 0.92} fill={`url(#${id('iris')})`} />
          <circle cx={x} cy={y + r * 0.12} r={r * 0.48} fill={INK} />
          <ellipse cx={x - r * 0.35} cy={y - r * 0.38} rx={r * 0.38} ry={r * 0.3} fill="#fff" />
          <circle cx={x + r * 0.38} cy={y + r * 0.4} r={r * 0.16} fill="#fff" />
        </g>
      );
    case 3: // Fröhlich
      return arc(true);
    case 4: // Schläfrig
      return (
        <g>
          <circle cx={x} cy={y} r={r} fill={`url(#${id('sclera')})`} {...ring} />
          <circle cx={x} cy={y + r * 0.25} r={r * 0.6} fill={`url(#${id('iris')})`} />
          <circle cx={x} cy={y + r * 0.3} r={r * 0.3} fill={INK} />
          <path d={`M${x - r * 1.05} ${y + r * 0.05} A${r * 1.05} ${r * 1.05} 0 0 1 ${x + r * 1.05} ${y + r * 0.05} Z`} fill={shade(base, 0.05)} />
          <path d={`M${x - r * 1.05} ${y + r * 0.05} L${x + r * 1.05} ${y + r * 0.05}`} stroke={INK} strokeWidth={r * 0.18} strokeLinecap="round" />
        </g>
      );
    case 5: // Punkte
      return (
        <g>
          <circle cx={x} cy={y} r={r * 0.5} fill={INK} />
          <circle cx={x - r * 0.16} cy={y - r * 0.18} r={r * 0.15} fill="#fff" />
        </g>
      );
    case 6: {
      // Sterne
      const pts = Array.from({ length: 10 }, (_, i) => {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.42 : r * 0.95;
        return `${x + Math.cos(ang) * rr},${y + Math.sin(ang) * rr}`;
      }).join(' ');
      return (
        <g>
          <circle cx={x} cy={y} r={r * 1.05} fill={`url(#${id('sclera')})`} {...ring} />
          <polygon points={pts} fill={`url(#${id('iris')})`} />
          <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.18} fill="#fff" />
        </g>
      );
    }
    case 7: // Zwinkern
      if (side === 'right') return arc(true);
      break;
  }
  // Glanz (Standard)
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${id('sclera')})`} {...ring} />
      <circle cx={x} cy={y + r * 0.15} r={r * 0.64} fill={`url(#${id('iris')})`} />
      <circle cx={x} cy={y + r * 0.18} r={r * 0.32} fill={INK} />
      <Glint x={x} y={y} r={r} />
    </g>
  );
}

function Brows({ kind, lx, rx, y, r, color }: { kind: number; lx: number; rx: number; y: number; r: number; color: string }) {
  if (kind === 0) return null;
  const w = r * 0.95;
  const line = (x: number, dir: 1 | -1) => {
    switch (kind) {
      case 2: // hochgezogen
        return `M${x - w} ${y - 1.5} Q${x} ${y - 5} ${x + w} ${y - 1.5}`;
      case 3: // grimmig: zur Mitte hin tiefer
        return `M${x - w} ${y - 2 * dir} L${x + w} ${y + 2 * dir}`;
      case 4: // besorgt: zur Mitte hin höher
        return `M${x - w} ${y + 2 * dir} L${x + w} ${y - 2 * dir}`;
      default: // sanft
        return `M${x - w} ${y + 0.5} Q${x} ${y - 2.2} ${x + w} ${y + 0.5}`;
    }
  };
  return (
    <g stroke={color} strokeWidth={Math.max(1.6, r * 0.32)} strokeLinecap="round" fill="none">
      <path d={line(lx, 1)} />
      <path d={line(rx, -1)} />
    </g>
  );
}

// ------------------------------------------------------------------ Mund

function Mouth({ kind, y, id }: { kind: number; y: number; id: (k: string) => string }) {
  const fill = `url(#${id('mouth')})`;
  const stroke = { stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (kind) {
    case 1: // Grinsen
      return (
        <g>
          <path d={`M41 ${y - 2} Q50 ${y - 1} 59 ${y - 2} Q58 ${y + 8} 50 ${y + 8} Q42 ${y + 8} 41 ${y - 2} Z`} fill={fill} />
          <path d={`M42 ${y - 1.6} Q50 ${y - 0.6} 58 ${y - 1.6} L57.6 ${y + 1.2} Q50 ${y + 2} 42.4 ${y + 1.2} Z`} fill="#fff" />
          <ellipse cx="50" cy={y + 6} rx="4" ry="1.6" fill="#ff7a9a" />
        </g>
      );
    case 2: // Staunen
      return (
        <g>
          <ellipse cx="50" cy={y + 2} rx="4.2" ry="5" fill={fill} />
          <ellipse cx="50" cy={y + 5} rx="2.6" ry="1.6" fill="#ff7a9a" />
        </g>
      );
    case 3: // Zunge
      return (
        <g>
          <path d={`M42 ${y - 1} Q50 ${y + 7} 58 ${y - 1} Z`} fill={fill} />
          <path d={`M46.5 ${y + 1.5} Q46.5 ${y + 8} 50 ${y + 8} Q53.5 ${y + 8} 53.5 ${y + 1.5} Z`} fill="#ff6f91" />
          <path d={`M50 ${y + 2.5} V${y + 6}`} stroke="#d9466d" strokeWidth="0.8" />
          <path d={`M41 ${y - 1} Q50 ${y + 1} 59 ${y - 1}`} {...stroke} />
        </g>
      );
    case 4: // Katzenmund
      return <path d={`M43 ${y} Q46.5 ${y + 4} 50 ${y} Q53.5 ${y + 4} 57 ${y}`} {...stroke} />;
    case 5: // Neutral
      return <path d={`M44.5 ${y + 1} H55.5`} {...stroke} />;
    case 6: // Zähnchen
      return (
        <g>
          <path d={`M42 ${y - 1} Q50 ${y + 8} 58 ${y - 1} Z`} fill={fill} />
          <path d={`M45 ${y} L46.5 ${y + 2.8} L48 ${y + 0.3} Z M52 ${y + 0.3} L53.5 ${y + 2.8} L55 ${y} Z`} fill="#fff" />
          <path d={`M41.5 ${y - 1} Q50 ${y + 0.6} 58.5 ${y - 1}`} {...stroke} strokeWidth={1.6} />
        </g>
      );
    case 7: // Schmollen
      return (
        <g>
          <ellipse cx="50" cy={y + 2} rx="3.4" ry="2.4" fill="#ff7a9a" />
          <path d={`M46.6 ${y + 2} Q50 ${y + 0.5} 53.4 ${y + 2}`} stroke="#c2385e" strokeWidth="0.9" fill="none" />
        </g>
      );
    default: // Lächeln
      return <path d={`M42.5 ${y} Q50 ${y + 6} 57.5 ${y}`} {...stroke} />;
  }
}

// ------------------------------------------------------------------ Extras

function Extra({ kind, layer, top: tip, crown, base, id }: { kind: number; layer: 'back' | 'front'; top: number; crown: number; base: string; id: (k: string) => string }) {
  // Antenne und Blatt sitzen auf der Spitze, alles Breite am Kopfansatz
  const top = kind === 1 || kind === 4 ? tip : crown;
  let node: ReactNode = null;
  if (layer === 'back') {
    if (kind === 3) {
      // Katzenohren (hinter dem Körper)
      node = (
        <g>
          {[-1, 1].map((d) => (
            <g key={d}>
              <path d={`M${50 + d * 12} ${top + 8} L${50 + d * 24} ${top - 9} L${50 + d * 28} ${top + 14} Z`} fill={`url(#${id('body')})`} />
              <path d={`M${50 + d * 15.5} ${top + 8} L${50 + d * 23.5} ${top - 3} L${50 + d * 25.5} ${top + 11} Z`} fill="#ff9fbd" />
            </g>
          ))}
        </g>
      );
    } else if (kind === 2) {
      // Hörner
      node = (
        <g>
          {[-1, 1].map((d) => (
            <path key={d} d={`M${50 + d * 10} ${top + 9} Q${50 + d * 18} ${top - 4} ${50 + d * 26} ${top - 8} Q${50 + d * 24} ${top + 6} ${50 + d * 21} ${top + 13} Z`} fill={`url(#${id('ivory')})`} />
          ))}
        </g>
      );
    }
    return node;
  }
  switch (kind) {
    case 1: // Antenne
      return (
        <g>
          <path d={`M50 ${top + 2} Q48 ${top - 6} 52 ${top - 12}`} stroke={shade(base, -0.4)} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="52" cy={top - 14} r="4.6" fill={`url(#${id('accent')})`} />
          <circle cx="50.6" cy={top - 15.6} r="1.3" fill="#fff" opacity="0.9" />
        </g>
      );
    case 4: // Blatt
      return (
        <g>
          <path d={`M50 ${top + 2} Q50 ${top - 4} 52 ${top - 8}`} stroke="#3c8d2f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d={`M52 ${top - 8} Q60 ${top - 18} 70 ${top - 12} Q62 ${top - 2} 52 ${top - 8} Z`} fill={`url(#${id('leaf')})`} />
          <path d={`M52 ${top - 8} Q50 ${top - 16} 42 ${top - 16} Q42 ${top - 8} 52 ${top - 8} Z`} fill={`url(#${id('leaf')})`} />
        </g>
      );
    case 5: // Krone
      return (
        <g>
          <path d={`M38 ${top + 5} L36 ${top - 9} L43.5 ${top - 2} L50 ${top - 13} L56.5 ${top - 2} L64 ${top - 9} L62 ${top + 5} Z`} fill={`url(#${id('gold')})`} stroke="#b07800" strokeWidth="0.6" />
          <circle cx="50" cy={top - 1} r="2.2" fill="#e8384f" />
          <circle cx="42" cy={top + 1} r="1.4" fill="#3ec1f3" />
          <circle cx="58" cy={top + 1} r="1.4" fill="#3ec1f3" />
          <circle cx="49.3" cy={top - 1.8} r="0.7" fill="#fff" />
        </g>
      );
    case 6: // Schleife
      return (
        <g transform={`translate(64 ${top + 6}) rotate(18)`}>
          <path d="M0 0 L-11 -7 Q-13 0 -11 7 Z" fill={`url(#${id('accent')})`} />
          <path d="M0 0 L11 -7 Q13 0 11 7 Z" fill={`url(#${id('accent')})`} />
          <circle cx="0" cy="0" r="3.2" fill={`url(#${id('accent')})`} />
          <circle cx="-1" cy="-1" r="0.9" fill="#fff" opacity="0.8" />
        </g>
      );
    case 7: // Mütze
      return (
        <g>
          <path d={`M27 ${top + 13} Q27 ${top - 8} 50 ${top - 9} Q73 ${top - 8} 73 ${top + 13} Z`} fill={`url(#${id('accent')})`} />
          <rect x="25" y={top + 9} width="50" height="8" rx="4" fill="#fff" opacity="0.92" />
          <path d={`M30 ${top + 13} H70`} stroke="#e9e9ef" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="50" cy={top - 11} r="5" fill="#fff" />
          <circle cx="48.4" cy={top - 12.6} r="1.4" fill="#fff" opacity="0.9" />
        </g>
      );
  }
  return null;
}
