/** Zeichnen von Rad und Messern (Canvas 2D) – gemeinsam für Handy und Fernseher. */
import { canvasDpr } from '../../../app/canvas-dpr';

export interface StuckKnife {
  /** Position im Rad (Bogenmaß) */
  a: number;
  color: string;
  /** Hindernis (vorgegeben) */
  fixed?: boolean;
}

/** malt ein Messer direkt (teuer – wird nur für vorgezeichnete Bilder benutzt) */
function paintKnife(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, len: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(dir + Math.PI); // Spitze am Ursprung, Griff nach hinten
  const blade = len * 0.56;
  const w = len * 0.11;
  // Klinge
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, '#f4f7fb');
  g.addColorStop(0.5, '#c3ccd8');
  g.addColorStop(1, '#8e9aab');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(blade * 0.35, -w * 1.05, blade, -w * 0.75);
  ctx.lineTo(blade, w * 0.75);
  ctx.lineTo(blade * 0.2, w * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,50,70,0.35)';
  ctx.lineWidth = Math.max(1, len * 0.012);
  ctx.stroke();
  // Parierstange
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(blade - len * 0.02, -w * 1.25, len * 0.05, w * 2.5);
  // Griff in Spielerfarbe
  ctx.fillStyle = color;
  const hx = blade + len * 0.03;
  const hl = len - hx;
  ctx.beginPath();
  ctx.roundRect(hx, -w * 0.85, hl, w * 1.7, w * 0.8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(hx + hl * 0.1, -w * 0.55, hl * 0.8, w * 0.35);
  ctx.restore();
}

/** Rad mit steckenden Messern; `boss` zeigt einen Käselaib statt Holz */
/** malt den Radkörper um den Ursprung (teuer – wird einmal vorgezeichnet) */
function paintWheelBody(ctx: CanvasRenderingContext2D, r: number, opts: { boss?: boolean }) {
  ctx.save();
  // Schatten
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = r * 0.12;
  ctx.shadowOffsetY = r * 0.05;
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
  if (opts.boss) {
    g.addColorStop(0, '#ffe8a3');
    g.addColorStop(1, '#f2b84b');
  } else {
    g.addColorStop(0, '#d79a5c');
    g.addColorStop(1, '#8a4b24');
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  if (opts.boss) {
    // Käselöcher
    ctx.fillStyle = 'rgba(200,130,30,0.45)';
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const d = r * (0.2 + ((i * 37) % 60) / 100);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.06 + (i % 3) * 0.03), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#d99a2b';
  } else {
    // bemalte Zielscheibe eines Messerwerfers: rot-weiße Ringe auf Holz
    const rings = ['#b3161f', '#f3e3c3', '#b3161f', '#f3e3c3', '#b3161f'];
    rings.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.88 - i * 0.17), 0, Math.PI * 2);
      ctx.fill();
    });
    // Holzmaserung durchscheinen lassen (nur innerhalb der Scheibe)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(70,35,12,0.18)';
    ctx.lineWidth = Math.max(1, r * 0.012);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(-r, -r + i * r * 0.25);
      ctx.bezierCurveTo(-r * 0.3, -r + i * r * 0.25 + r * 0.06, r * 0.3, -r + i * r * 0.25 - r * 0.06, r, -r + i * r * 0.25);
      ctx.stroke();
    }
    ctx.restore();
    // Sterne zwischen den Ringen
    ctx.fillStyle = '#e8b84a';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const d = r * 0.795;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.028, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#5e2f12';
  }
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.stroke();
  // Markierung, damit man die Drehung sieht
  ctx.fillStyle = opts.boss ? '#d99a2b' : '#e8b84a';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = opts.boss ? '#a8741c' : '#5e2f12';
  ctx.lineWidth = r * 0.025;
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ vorgezeichnete Bilder (schnell)

const sprites = new Map<string, HTMLCanvasElement>();
function sprite(key: string, w: number, h: number, scale: number, paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = sprites.get(key);
  if (c) return c;
  if (sprites.size > 60) sprites.clear();
  c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * scale));
  c.height = Math.max(1, Math.ceil(h * scale));
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  paint(g);
  sprites.set(key, c);
  return c;
}

/** aktuelle Pixeldichte des Zeichenkontexts */
const scaleOf = (ctx: CanvasRenderingContext2D) => Math.max(1, Math.min(3, Math.abs(ctx.getTransform().a)));

/** Messer, Spitze bei (x, y), zeigt in Richtung `dir` (Bogenmaß, 0 = rechts) */
export function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, len: number, color: string, alpha = 1) {
  const s = scaleOf(ctx);
  const pad = 2;
  const w = len + pad * 2;
  const h = len * 0.3;
  const img = sprite(`k|${Math.round(len)}|${color}|${s}`, w, h, s, (g) => paintKnife(g, pad, h / 2, -Math.PI, len, color));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(dir + Math.PI);
  ctx.drawImage(img, -pad, -h / 2, w, h);
  ctx.restore();
}

/** Rad mit steckenden Messern; `boss` zeigt einen Käselaib statt Holz */
export function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  knives: readonly StuckKnife[],
  opts: { boss?: boolean; flash?: number; knifeLen?: number } = {},
) {
  const len = opts.knifeLen ?? r * 0.95;
  // Messer zuerst (hinter dem Rad hervorstehend)
  for (const k of knives) {
    const wa = k.a + angle;
    const tipR = r * 0.72;
    drawKnife(ctx, cx + Math.cos(wa) * tipR, cy + Math.sin(wa) * tipR, wa + Math.PI, len, k.fixed ? '#5b6170' : k.color);
  }
  const s = scaleOf(ctx);
  const R = r * 1.25; // Platz für den Schatten
  const body = sprite(`w|${Math.round(r)}|${opts.boss ? 1 : 0}|${s}`, R * 2, R * 2, s, (g) => {
    g.translate(R, R);
    paintWheelBody(g, r, opts);
  });
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(body, -R, -R, R * 2, R * 2);
  if (opts.flash) {
    ctx.fillStyle = `rgba(255,255,255,${opts.flash})`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Canvas auf Gerätepixel einstellen */
export function fitCanvas(canvas: HTMLCanvasElement): { w: number; h: number; dpr: number } {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = canvasDpr(w, h);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}
