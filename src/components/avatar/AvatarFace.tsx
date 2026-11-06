/**
 * Zeichnet einen Avatar aus Bausteinen als SVG (eigene Grafik, Mii-ähnlicher Stil).
 * `look="home"` = weiche Konturen (Launcher), `look="comic"` = dicke schwarze Kontur (Spiele).
 */
import { useId, type ReactNode, type SVGProps } from 'react';
import { EYE_COLORS, HAIR_COLORS, SHIRT_COLORS, SKIN_TONES, type AvatarConfig } from '../../shared/avatar';

/** Farbe aufhellen (amt > 0) oder abdunkeln (amt < 0) */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const INK = '#2a1d17';

interface Props {
  avatar: AvatarConfig;
  look?: 'home' | 'comic';
  /** 'bust' = Kopf + Schultern (für runde Avatare), 'full' = ganze Fläche (Editor) */
  crop?: 'bust' | 'full';
  className?: string;
  title?: string;
}

export function AvatarFace({ avatar: a, look = 'home', crop = 'full', className = '', title }: Props) {
  const clipId = useId().replace(/:/g, '');
  const skin = SKIN_TONES[a.skin] ?? SKIN_TONES[0];
  const skinShade = shade(skin, -0.18);
  const hair = HAIR_COLORS[a.hairColor] ?? HAIR_COLORS[0];
  const shirt = SHIRT_COLORS[a.shirt] ?? SHIRT_COLORS[0];
  const comic = look === 'comic';
  const line = (base: string) => (comic ? { stroke: '#161616', strokeWidth: 4 } : { stroke: shade(base, -0.28), strokeWidth: 1.6 });
  const narrow = a.face === 1;
  const earX = narrow ? 52 : 46;

  return (
    <svg viewBox={crop === 'bust' ? '22 12 156 156' : '0 0 200 200'} className={className} role="img" aria-label={title ?? 'Avatar'}>
      <defs>
        <clipPath id={`head-${clipId}`}>
          <HeadShape face={a.face} />
        </clipPath>
      </defs>

      {/* Haare hinten */}
      <BackHair style={a.hair} color={hair} line={line(hair)} />

      {/* Körper */}
      <rect x="86" y="138" width="28" height="24" fill={skinShade} {...(comic ? { stroke: '#161616', strokeWidth: 3 } : {})} />
      <path d="M26 202 C28 168 58 152 100 152 C142 152 172 168 174 202 Z" fill={shirt} {...line(shirt)} />
      <path d="M86 153 L100 168 L114 153" fill="none" stroke={shade(shirt, -0.3)} strokeWidth="3" strokeLinejoin="round" />

      {/* Ohren */}
      <circle cx={earX} cy="100" r="11" fill={skin} {...line(skin)} />
      <circle cx={200 - earX} cy="100" r="11" fill={skin} {...line(skin)} />

      {/* Kopf */}
      <g>
        <HeadShape face={a.face} fill={skin} {...line(skin)} />
      </g>

      <g clipPath={`url(#head-${clipId})`}>
        {a.facialHair === 4 && <Stubble color={hair} />}
        {a.cheeks && (
          <>
            <ellipse cx="68" cy="119" rx="10" ry="6.5" fill="#ff7f98" opacity="0.45" />
            <ellipse cx="132" cy="119" rx="10" ry="6.5" fill="#ff7f98" opacity="0.45" />
          </>
        )}
      </g>

      {a.facialHair === 2 && <path d="M48 108 C50 150 76 166 100 166 C124 166 150 150 152 108 C146 128 130 142 100 142 C70 142 54 128 48 108 Z" fill={hair} {...line(hair)} />}
      {a.facialHair === 3 && <path d="M90 140 C92 156 108 156 110 140 C104 144 96 144 90 140 Z" fill={hair} {...line(hair)} />}

      <Brows style={a.brows} color={a.hair === 0 && a.hairColor < 6 ? shade(skin, -0.45) : shade(hair, -0.1)} />
      <Eyes style={a.eyes} iris={EYE_COLORS[a.eyeColor] ?? EYE_COLORS[0]} />
      <Nose style={a.nose} color={skinShade} />
      {(a.facialHair === 1 || a.facialHair === 2) && (
        <path d="M80 126 C86 116 96 118 100 122 C104 118 114 116 120 126 C112 124 106 126 100 128 C94 126 88 124 80 126 Z" fill={shade(hair, -0.1)} {...(comic ? { stroke: '#161616', strokeWidth: 2.5 } : {})} />
      )}
      <Mouth style={a.mouth} />

      {/* Haare vorne */}
      <FrontHair style={a.hair} color={hair} line={line(hair)} />

      <Glasses style={a.glasses} />
    </svg>
  );
}

function HeadShape({ face, ...rest }: { face: number } & SVGProps<SVGElement>) {
  const props = rest as Record<string, unknown>;
  switch (face) {
    case 1:
      return <ellipse cx="100" cy="95" rx="50" ry="62" {...props} />;
    case 2:
      return <rect x="46" y="36" width="108" height="118" rx="30" {...props} />;
    case 3:
      return <path d="M44 82 C44 44 70 34 100 34 C130 34 156 44 156 82 C156 122 128 152 100 157 C72 152 44 122 44 82 Z" {...props} />;
    default:
      return <ellipse cx="100" cy="95" rx="56" ry="58" {...props} />;
  }
}

type LineProps = { stroke: string; strokeWidth: number };

function BackHair({ style, color, line }: { style: number; color: string; line: LineProps }) {
  switch (style) {
    case 5:
      return <path d="M38 90 C34 40 66 22 100 22 C134 22 166 40 162 90 L168 176 C152 184 140 180 134 170 L134 110 L66 110 L66 170 C60 180 48 184 32 176 Z" fill={color} {...line} />;
    case 6:
      return <path d="M36 92 C32 40 66 22 100 22 C134 22 168 40 164 92 L166 140 C150 148 138 142 132 134 L68 134 C62 142 50 148 34 140 Z" fill={color} {...line} />;
    case 7:
      return (
        <g>
          <path d="M136 44 C178 34 192 84 176 122 C170 104 162 86 146 70 Z" fill={color} {...line} />
          <circle cx="146" cy="52" r="7" fill="#ff5d73" {...line} />
        </g>
      );
    case 8:
      return <circle cx="100" cy="24" r="19" fill={color} {...line} />;
    default:
      return null;
  }
}

function FrontHair({ style, color, line }: { style: number; color: string; line: LineProps }) {
  const p = (d: string, extra: ReactNode = null) => (
    <g>
      <path d={d} fill={color} {...line} />
      {extra}
    </g>
  );
  switch (style) {
    case 1:
      return p('M44 92 C40 40 68 28 100 28 C132 28 160 40 156 92 C150 70 132 60 112 60 C96 60 80 56 70 50 C60 62 50 74 44 92 Z');
    case 2:
      return p('M42 96 C38 44 66 26 102 26 C136 26 162 44 158 96 C156 74 148 60 136 56 C118 70 86 72 60 62 C52 70 46 82 42 96 Z');
    case 3:
      return p('M44 88 L40 52 L58 58 L60 30 L78 46 L92 20 L104 44 L122 22 L128 48 L148 32 L146 58 L162 52 L156 88 C140 64 60 64 44 88 Z');
    case 4:
      return (
        <g fill={color} {...line}>
          {[
            [48, 84, 13],
            [52, 64, 16],
            [66, 46, 18],
            [86, 34, 19],
            [110, 32, 19],
            [132, 40, 18],
            [148, 58, 16],
            [154, 80, 13],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      );
    case 5:
      return p('M44 96 C40 44 68 28 100 28 C132 28 160 44 156 96 C148 66 124 50 100 52 C76 50 52 66 44 96 Z', <path d="M100 30 L100 52" stroke={shade(color, -0.35)} strokeWidth="2.5" />);
    case 6:
      return p('M44 76 C44 40 70 28 100 28 C130 28 156 40 156 76 Z');
    case 7:
      return p('M44 90 C42 42 70 30 100 30 C130 30 158 42 156 90 C148 64 126 54 100 54 C74 54 52 64 44 90 Z');
    case 8:
      return p('M44 88 C42 42 70 32 100 32 C130 32 158 42 156 88 C148 64 126 56 100 56 C74 56 52 64 44 88 Z');
    case 9:
      return p('M88 62 L84 14 L100 4 L116 14 L112 62 Z');
    default:
      return null;
  }
}

function Eyes({ style, iris }: { style: number; iris: string }) {
  const pair = (render: (x: number, side: 1 | -1) => ReactNode) => (
    <>
      {render(80, -1)}
      {render(120, 1)}
    </>
  );
  switch (style) {
    case 1:
      return pair((x) => (
        <g key={x}>
          <ellipse cx={x} cy="96" rx="10" ry="11" fill="#fff" stroke={INK} strokeWidth="2.2" />
          <circle cx={x} cy="97" r="6" fill={iris} />
          <circle cx={x} cy="97" r="3" fill={INK} />
          <circle cx={x + 2} cy="94" r="1.8" fill="#fff" />
        </g>
      ));
    case 2:
      return pair((x) => <path key={x} d={`M${x - 9} 99 Q${x} 87 ${x + 9} 99`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />);
    case 3:
      return pair((x) => (
        <g key={x}>
          <ellipse cx={x} cy="98" rx="6.5" ry="4.5" fill={INK} />
          <path d={`M${x - 9} 95 L${x + 9} 95`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      ));
    case 4:
      return pair((x, side) => (
        <g key={x}>
          <path d={`M${x - 10} 97 Q${x} 87 ${x + 10} 97 Q${x} 104 ${x - 10} 97 Z`} fill="#fff" stroke={INK} strokeWidth="2.2" />
          <circle cx={x + side} cy="96.5" r="4" fill={iris} />
          <circle cx={x + side} cy="96.5" r="2" fill={INK} />
        </g>
      ));
    case 5:
      return pair((x, side) => (
        <g key={x}>
          <ellipse cx={x} cy="97" rx="5.5" ry="7.5" fill={INK} />
          <circle cx={x + 1.5} cy="94" r="1.8" fill="#fff" />
          <path d={`M${x + side * 4} 90 l${side * 5} -4 M${x + side * 6} 94 l${side * 6} -2`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ));
    case 6:
      return pair((x) => <circle key={x} cx={x} cy="97" r="3.6" fill={INK} />);
    default:
      return pair((x) => (
        <g key={x}>
          <ellipse cx={x} cy="97" rx="5.5" ry="7.5" fill={INK} />
          <circle cx={x + 1.5} cy="94" r="1.8" fill="#fff" />
        </g>
      ));
  }
}

function Brows({ style, color }: { style: number; color: string }) {
  const w = style === 1 ? 7 : style === 4 ? 2.2 : 4;
  const d =
    style === 2
      ? ['M69 82 Q80 70 91 80', 'M109 80 Q120 70 131 82']
      : style === 3
        ? ['M69 76 L91 84', 'M109 84 L131 76']
        : ['M70 82 Q80 76 90 80', 'M110 80 Q120 76 130 82'];
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function Nose({ style, color }: { style: number; color: string }) {
  switch (style) {
    case 1:
      return <path d="M101 102 L95 116 L103 117" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
    case 2:
      return <circle cx="100" cy="112" r="7" fill={color} />;
    case 3:
      return <path d="M100 100 L92 118 L105 118 Z" fill={color} />;
    default:
      return <ellipse cx="100" cy="113" rx="4.5" ry="3.2" fill={color} />;
  }
}

function Mouth({ style }: { style: number }) {
  switch (style) {
    case 1:
      return (
        <g>
          <path d="M84 126 Q100 150 116 126 Z" fill="#7a1f2b" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M92 138 Q100 132 108 138 Q100 144 92 138 Z" fill="#ff7f98" />
        </g>
      );
    case 2:
      return <path d="M88 132 L112 132" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
    case 3:
      return <ellipse cx="100" cy="133" rx="6" ry="8" fill="#7a1f2b" stroke={INK} strokeWidth="2.5" />;
    case 4:
      return (
        <g>
          <path d="M86 128 Q100 140 114 128" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M96 134 Q100 146 106 134" fill="#ff6f8c" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 5:
      return <path d="M88 133 Q104 137 115 126" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
    case 6:
      return (
        <g>
          <path d="M82 126 Q100 148 118 126 Z" fill="#fff" stroke={INK} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M84 129 L116 129" stroke={INK} strokeWidth="1.5" />
        </g>
      );
    default:
      return <path d="M86 128 Q100 140 114 128" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  }
}

function Glasses({ style }: { style: number }) {
  const c = '#222';
  switch (style) {
    case 1:
      return (
        <g fill="none" stroke={c} strokeWidth="3.5">
          <circle cx="80" cy="97" r="13" />
          <circle cx="120" cy="97" r="13" />
          <path d="M93 96 Q100 92 107 96 M67 95 L50 92 M133 95 L150 92" />
        </g>
      );
    case 2:
      return (
        <g fill="rgba(255,255,255,0.15)" stroke={c} strokeWidth="3.5">
          <rect x="65" y="87" width="30" height="21" rx="4" />
          <rect x="105" y="87" width="30" height="21" rx="4" />
          <path d="M95 95 L105 95 M65 94 L50 91 M135 94 L150 91" fill="none" />
        </g>
      );
    case 3:
      return (
        <g stroke={c} strokeWidth="3">
          <path d="M63 88 L97 88 L94 104 Q80 112 66 104 Z" fill="#1d1d24" />
          <path d="M103 88 L137 88 L134 104 Q120 112 106 104 Z" fill="#1d1d24" />
          <path d="M97 90 L103 90 M63 89 L50 88 M137 89 L150 88" fill="none" />
          <path d="M70 92 L78 92" stroke="#fff" strokeWidth="2" opacity=".6" />
        </g>
      );
    case 4:
      return (
        <g fill="rgba(255,255,255,0.18)" stroke={c} strokeWidth="5">
          <circle cx="79" cy="98" r="17" />
          <circle cx="121" cy="98" r="17" />
          <path d="M96 96 L104 96" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

function Stubble({ color }: { color: string }) {
  const dots: ReactNode[] = [];
  for (let y = 118; y < 160; y += 6) {
    for (let x = 56; x < 146; x += 6) {
      if ((x - 100) ** 2 / 46 ** 2 + (y - 112) ** 2 / 48 ** 2 > 1) continue;
      if (y < 128 && Math.abs(x - 100) < 30) continue;
      dots.push(<circle key={`${x}-${y}`} cx={x + ((y / 6) % 2) * 3} cy={y} r="1.1" fill={color} />);
    }
  }
  return <g opacity="0.55">{dots}</g>;
}
