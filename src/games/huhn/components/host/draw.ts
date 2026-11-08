/**
 * Canvas-Zeichnungen der Hühnerjagd. Koordinaten: (x, gy) = Fußpunkt links/mittig am Boden,
 * u = Pixel pro Spureinheit, t = Zeit in Sekunden (für Animationen). Alles schaut nach links,
 * dem Huhn entgegen – außer dem Huhn selbst.
 */
import type { HuhnTheme } from '../../maps';

type C = CanvasRenderingContext2D;

function ellipse(g: C, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

function roundRect(g: C, x: number, y: number, w: number, h: number, r: number, fill: string) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}

// ------------------------------------------------------------------ Huhn

export function drawChicken(
  g: C,
  x: number,
  gy: number,
  u: number,
  y: number,
  color: { body: string; dark: string },
  t: number,
  state: { alive: boolean; holding: boolean; speed: number; winner?: boolean; caughtAt?: number },
) {
  const s = u;
  const air = y > 0.02;
  const by = gy - y * u;
  g.save();
  g.translate(x, by);
  if (!state.alive && state.caughtAt !== undefined) {
    // geschnappt: kippt um
    const k = Math.min(1, (t - state.caughtAt) * 4);
    g.rotate(-0.9 * k);
  } else if (air) g.rotate(-Math.min(0.35, Math.max(-0.3, y * 0.1)));

  // Schatten am Boden
  if (air) {
    g.save();
    g.translate(0, y * u);
    ellipse(g, 0, 0, 0.3 * s * Math.max(0.4, 1 - y * 0.25), 0.06 * s, 'rgba(0,0,0,0.18)');
    g.restore();
  }

  // Beine
  g.strokeStyle = '#f59e0b';
  g.lineWidth = Math.max(2, 0.06 * s);
  g.lineCap = 'round';
  const run = state.alive && !air ? t * (8 + state.speed * 1.4) : 0;
  for (const off of [0, Math.PI]) {
    const a = air ? 0.5 : Math.sin(run + off) * 0.7;
    g.beginPath();
    g.moveTo(0.02 * s, -0.16 * s);
    g.lineTo(0.02 * s + Math.sin(a) * 0.16 * s, -0.16 * s + Math.cos(a) * 0.16 * s);
    g.stroke();
  }

  // Schwanzfedern
  g.beginPath();
  g.moveTo(-0.28 * s, -0.42 * s);
  g.lineTo(-0.5 * s, -0.66 * s);
  g.lineTo(-0.46 * s, -0.44 * s);
  g.lineTo(-0.54 * s, -0.4 * s);
  g.closePath();
  g.fillStyle = color.dark;
  g.fill();

  // Körper
  ellipse(g, 0, -0.38 * s, 0.34 * s, 0.25 * s, color.body);
  // Flügel – flattert in der Luft
  const flap = air || state.holding ? Math.sin(t * 30) * 0.6 : 0.15;
  ellipse(g, -0.06 * s, -0.4 * s, 0.17 * s, 0.1 * s, color.dark, -0.3 - flap);
  // Kopf
  ellipse(g, 0.24 * s, -0.62 * s, 0.15 * s, 0.15 * s, color.body);
  // Kamm
  g.fillStyle = '#ef4444';
  for (let i = 0; i < 3; i++) ellipse(g, (0.16 + i * 0.06) * s, -0.78 * s + Math.abs(i - 1) * 0.02 * s, 0.045 * s, 0.05 * s, '#ef4444');
  // Schnabel
  g.beginPath();
  g.moveTo(0.37 * s, -0.64 * s);
  g.lineTo(0.5 * s, -0.6 * s);
  g.lineTo(0.37 * s, -0.56 * s);
  g.closePath();
  g.fillStyle = '#f59e0b';
  g.fill();
  // Kehllappen
  ellipse(g, 0.36 * s, -0.51 * s, 0.03 * s, 0.05 * s, '#ef4444');
  // Auge
  if (state.alive) {
    ellipse(g, 0.28 * s, -0.66 * s, 0.035 * s, 0.035 * s, '#1f2937');
    ellipse(g, 0.29 * s, -0.67 * s, 0.012 * s, 0.012 * s, '#fff');
  } else {
    g.strokeStyle = '#1f2937';
    g.lineWidth = Math.max(1.5, 0.025 * s);
    g.beginPath();
    g.moveTo(0.25 * s, -0.69 * s);
    g.lineTo(0.31 * s, -0.63 * s);
    g.moveTo(0.31 * s, -0.69 * s);
    g.lineTo(0.25 * s, -0.63 * s);
    g.stroke();
  }
  // Krone für den Rundensieger
  if (state.winner) {
    g.beginPath();
    const cx = 0.22 * s;
    const cy = -0.86 * s;
    g.moveTo(cx - 0.12 * s, cy + 0.06 * s);
    g.lineTo(cx - 0.12 * s, cy - 0.06 * s);
    g.lineTo(cx - 0.06 * s, cy);
    g.lineTo(cx, cy - 0.1 * s);
    g.lineTo(cx + 0.06 * s, cy);
    g.lineTo(cx + 0.12 * s, cy - 0.06 * s);
    g.lineTo(cx + 0.12 * s, cy + 0.06 * s);
    g.closePath();
    g.fillStyle = '#facc15';
    g.fill();
  }
  g.restore();
}

/** Gitterstäbe über einem geschnappten Huhn */
export function drawCage(g: C, x: number, gy: number, u: number) {
  g.save();
  roundRect(g, x - 0.48 * u, gy - 1.05 * u, 0.96 * u, 0.1 * u, 0.04 * u, '#475569');
  g.strokeStyle = '#475569';
  g.lineWidth = Math.max(2, 0.05 * u);
  for (let i = 0; i < 5; i++) {
    const bx = x - 0.4 * u + i * 0.2 * u;
    g.beginPath();
    g.moveTo(bx, gy - 0.98 * u);
    g.lineTo(bx, gy);
    g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------------ Polizei

const NAVY = '#1e3a8a';
const BLUE = '#2563eb';
export const POLICE = { NAVY, BLUE };
const SKIN = '#f1c27d';

export function drawCop(g: C, x: number, gy: number, u: number, t: number, id: number) {
  const s = u;
  const cx = x + 0.25 * s;
  const step = t * 9 + id;
  g.save();
  // Beine
  g.strokeStyle = '#111827';
  g.lineWidth = 0.1 * s;
  g.lineCap = 'round';
  for (const off of [0, Math.PI]) {
    const a = Math.sin(step + off) * 0.5;
    g.beginPath();
    g.moveTo(cx, gy - 0.42 * s);
    g.lineTo(cx + Math.sin(a) * 0.22 * s, gy - 0.04 * s);
    g.stroke();
  }
  // Körper
  roundRect(g, cx - 0.2 * s, gy - 0.86 * s, 0.4 * s, 0.48 * s, 0.1 * s, BLUE);
  roundRect(g, cx - 0.2 * s, gy - 0.46 * s, 0.4 * s, 0.07 * s, 0.02 * s, '#111827'); // Gürtel
  ellipse(g, cx + 0.08 * s, gy - 0.72 * s, 0.035 * s, 0.035 * s, '#facc15'); // Abzeichen
  // Arme nach vorne (links) – greifen
  g.strokeStyle = BLUE;
  g.lineWidth = 0.09 * s;
  const grab = Math.sin(step * 1.3) * 0.08 * s;
  g.beginPath();
  g.moveTo(cx - 0.1 * s, gy - 0.78 * s);
  g.lineTo(cx - 0.42 * s, gy - 0.7 * s + grab);
  g.stroke();
  ellipse(g, cx - 0.44 * s, gy - 0.7 * s + grab, 0.05 * s, 0.05 * s, SKIN);
  // Handschellen
  g.strokeStyle = '#cbd5e1';
  g.lineWidth = Math.max(1.5, 0.025 * s);
  g.beginPath();
  g.arc(cx - 0.52 * s, gy - 0.66 * s + grab, 0.04 * s, 0, Math.PI * 2);
  g.stroke();
  // Kopf
  ellipse(g, cx, gy - 0.98 * s, 0.13 * s, 0.13 * s, SKIN);
  ellipse(g, cx - 0.07 * s, gy - 0.99 * s, 0.02 * s, 0.025 * s, '#1f2937');
  // Schnurrbart
  ellipse(g, cx - 0.08 * s, gy - 0.92 * s, 0.07 * s, 0.025 * s, '#5b3a1e');
  // Mütze
  roundRect(g, cx - 0.15 * s, gy - 1.15 * s, 0.3 * s, 0.1 * s, 0.04 * s, NAVY);
  roundRect(g, cx - 0.21 * s, gy - 1.06 * s, 0.2 * s, 0.035 * s, 0.015 * s, '#111827');
  ellipse(g, cx, gy - 1.1 * s, 0.03 * s, 0.03 * s, '#facc15');
  g.restore();
}






// ------------------------------------------------------------------ Hintergrund

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}


export function drawFar(g: C, theme: HuhnTheme, x: number, base: number, seg: number, u: number, r: number, laneH: number) {
  g.fillStyle = theme.far;
  switch (theme.deco) {
    case 'farm':
    case 'highway': {
      g.beginPath();
      g.moveTo(x, base);
      g.quadraticCurveTo(x + seg / 2, base - (0.5 + r * 0.6) * u, x + seg, base);
      g.fill();
      break;
    }
    default: {
      const bw = seg * (0.55 + r * 0.4);
      const bh = Math.min(laneH * 0.85, (0.9 + r * 1.3) * u);
      g.fillRect(x, base - bh, bw, bh);
      if (theme.night || theme.deco === 'station') {
        g.fillStyle = theme.night ? 'rgba(253,224,71,0.55)' : 'rgba(255,255,255,0.25)';
        for (let wy = base - bh + 0.15 * u; wy < base - 0.2 * u; wy += 0.28 * u)
          for (let wx = x + 0.12 * u; wx < x + bw - 0.15 * u; wx += 0.3 * u) if (hash(wx * 7 + wy) > 0.45) g.fillRect(wx, wy, 0.1 * u, 0.12 * u);
      }
    }
  }
}

export function drawNear(g: C, theme: HuhnTheme, x: number, base: number, u: number, r: number, t: number) {
  switch (theme.deco) {
    case 'farm':
      // Zaun + ab und zu eine Scheune
      g.fillStyle = '#f5f5f4';
      for (let i = 0; i < 4; i++) g.fillRect(x + i * 0.85 * u, base - 0.42 * u, 0.07 * u, 0.42 * u);
      g.fillRect(x, base - 0.34 * u, 3.4 * u, 0.05 * u);
      g.fillRect(x, base - 0.2 * u, 3.4 * u, 0.05 * u);
      if (r > 0.8) {
        g.fillStyle = '#b91c1c';
        g.fillRect(x + 1.2 * u, base - 0.95 * u, 1 * u, 0.95 * u);
        g.beginPath();
        g.moveTo(x + 1.1 * u, base - 0.95 * u);
        g.lineTo(x + 1.7 * u, base - 1.35 * u);
        g.lineTo(x + 2.3 * u, base - 0.95 * u);
        g.fillStyle = '#7f1d1d';
        g.fill();
        g.fillStyle = '#fef3c7';
        g.fillRect(x + 1.55 * u, base - 0.5 * u, 0.3 * u, 0.5 * u);
      }
      break;
    case 'village': {
      const hw = (1.2 + r * 0.6) * u;
      const hh = (0.8 + r * 0.4) * u;
      g.fillStyle = theme.near;
      g.fillRect(x + 0.4 * u, base - hh, hw, hh);
      g.beginPath();
      g.moveTo(x + 0.3 * u, base - hh);
      g.lineTo(x + 0.4 * u + hw / 2, base - hh - 0.45 * u);
      g.lineTo(x + 0.5 * u + hw, base - hh);
      g.fillStyle = '#9a3412';
      g.fill();
      g.fillStyle = '#fef9c3';
      g.fillRect(x + 0.6 * u, base - hh + 0.2 * u, 0.25 * u, 0.25 * u);
      g.fillStyle = '#78350f';
      g.fillRect(x + 0.4 * u + hw - 0.5 * u, base - 0.45 * u, 0.28 * u, 0.45 * u);
      break;
    }
    case 'market': {
      const cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
      const c = cols[Math.floor(r * cols.length)]!;
      g.fillStyle = '#a16207';
      g.fillRect(x + 0.4 * u, base - 0.75 * u, 0.06 * u, 0.75 * u);
      g.fillRect(x + 1.7 * u, base - 0.75 * u, 0.06 * u, 0.75 * u);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? '#fff' : c;
        g.fillRect(x + 0.3 * u + i * 0.25 * u, base - 0.95 * u, 0.25 * u, 0.22 * u);
      }
      g.fillStyle = '#d97706';
      g.fillRect(x + 0.35 * u, base - 0.4 * u, 1.45 * u, 0.12 * u);
      for (let i = 0; i < 5; i++) ellipse(g, x + (0.5 + i * 0.28) * u, base - 0.45 * u, 0.09 * u, 0.07 * u, ['#ef4444', '#f97316', '#84cc16'][i % 3]!);
      break;
    }
    case 'highway':
      g.fillStyle = '#9ca3af';
      g.fillRect(x, base - 0.3 * u, 3.4 * u, 0.08 * u);
      for (let i = 0; i < 4; i++) g.fillRect(x + i * 0.85 * u, base - 0.3 * u, 0.06 * u, 0.3 * u);
      if (r > 0.5) {
        g.fillStyle = '#6b7280';
        g.fillRect(x + 1.6 * u, base - 1.6 * u, 0.06 * u, 1.6 * u);
        g.fillRect(x + 1.3 * u, base - 1.6 * u, 0.35 * u, 0.05 * u);
        ellipse(g, x + 1.33 * u, base - 1.54 * u, 0.06 * u, 0.03 * u, '#fef08a');
      }
      break;
    case 'station':
      if (r > 0.45) {
        g.fillStyle = '#e2e8f0';
        g.fillRect(x + 0.3 * u, base - 1.1 * u, 2.4 * u, 1.1 * u);
        g.fillStyle = '#1d4ed8';
        g.fillRect(x + 0.3 * u, base - 1.1 * u, 2.4 * u, 0.26 * u);
        g.fillStyle = '#fff';
        g.font = `900 ${0.18 * u}px Nunito, sans-serif`;
        g.textAlign = 'center';
        g.fillText('POLIZEI', x + 1.5 * u, base - 0.91 * u);
        g.fillStyle = '#93c5fd';
        for (let i = 0; i < 3; i++) g.fillRect(x + (0.55 + i * 0.75) * u, base - 0.68 * u, 0.4 * u, 0.3 * u);
        // Blaulicht auf dem Dach
        ellipse(g, x + 2.5 * u, base - 1.15 * u, 0.06 * u, 0.05 * u, Math.floor(t * 4) % 2 ? '#3b82f6' : '#1e3a8a');
      } else {
        g.fillStyle = '#64748b';
        g.fillRect(x + 0.5 * u, base - 0.5 * u, 0.05 * u, 0.5 * u);
        g.fillRect(x + 0.5 * u, base - 0.5 * u, 2 * u, 0.04 * u);
      }
      break;
    case 'city':
      g.fillStyle = theme.near;
      g.fillRect(x + 0.2 * u, base - (1.1 + r) * u, 1.5 * u, (1.1 + r) * u);
      g.fillStyle = 'rgba(253,224,71,0.7)';
      for (let wy = base - (1 + r) * u; wy < base - 0.3 * u; wy += 0.3 * u)
        for (let wx = x + 0.35 * u; wx < x + 1.55 * u; wx += 0.32 * u) if (hash(wx + wy * 3) > 0.55) g.fillRect(wx, wy, 0.12 * u, 0.14 * u);
      // Straßenlaterne
      g.fillStyle = '#4b5563';
      g.fillRect(x + 2.4 * u, base - 1.3 * u, 0.05 * u, 1.3 * u);
      {
        const lamp = g.createRadialGradient(x + 2.42 * u, base - 1.3 * u, 0, x + 2.42 * u, base - 1.3 * u, 1.1 * u);
        lamp.addColorStop(0, 'rgba(254,240,138,0.45)');
        lamp.addColorStop(1, 'rgba(254,240,138,0)');
        g.fillStyle = lamp;
        g.fillRect(x + 1.3 * u, base - 2.4 * u, 2.3 * u, 2.4 * u);
      }
      break;
  }
}
