/** Zeichnen von Rad und Messern (Canvas 2D) – gemeinsam für Handy und Fernseher. */
import { canvasDpr } from '../../../app/canvas-dpr';
import type { BossId } from '../logic/bosses';
import type { WheelSim } from '../logic/sim';
import { BOSS_ART } from './bosses-draw';
import { paintSkin } from './knife-skins';
import { OBSTACLE_SKIN } from '../logic/knives';

export interface StuckKnife {
  /** Position im Rad (Bogenmaß) */
  a: number;
  /** Messer-Aussehen (siehe logic/knives.ts) */
  skin?: number;
  /** Spielerfarbe am Griff (gemeinsames Rad) */
  accent?: string;
  /** Hindernis (vorgegeben) */
  fixed?: boolean;
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
  if (sprites.size > 120) sprites.clear();
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
export function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, len: number, skin: number, alpha = 1, accent?: string) {
  const s = scaleOf(ctx);
  const pad = Math.max(2, len * 0.06);
  const w = len + pad * 2;
  const h = len * 0.42;
  const img = sprite(`k|${Math.round(len)}|${skin}|${accent ?? ''}|${s}`, w, h, s, (g) => {
    g.translate(pad, h / 2);
    paintSkin(g, len, skin, accent);
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(dir + Math.PI);
  ctx.drawImage(img, -pad, -h / 2, w, h);
  ctx.restore();
}

function starPath(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}

/** Messerlänge relativ zum Radius */
export const KNIFE_LEN = 0.78;

export interface WheelOpts {
  /** Boss-Aussehen (sonst bemalte Zielscheibe) */
  bossId?: BossId | null;
  /** Simulation für Boss-Animationen und Mechaniken */
  sim?: WheelSim;
  /** nur das Aussehen, ohne Schilde/Monde/Fangarm (gemeinsames Rad) */
  visualOnly?: boolean;
  /** Bonus-Sterne (Position im Rad) */
  stars?: readonly number[];
  flash?: number;
  knifeLen?: number;
  /** Deckkraft des Rads (Geist) */
  alpha?: number;
  /** Zeit für Animationen ohne Simulation (Sekunden) */
  t?: number;
}

/** Rad mit steckenden Messern, Boss-Aussehen und Bonus-Sternen */
export function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number, knives: readonly StuckKnife[], opts: WheelOpts = {}) {
  const len = opts.knifeLen ?? r * KNIFE_LEN;
  const art = opts.bossId ? BOSS_ART[opts.bossId] : null;
  // Messer zuerst (hinter dem Rad hervorstehend)
  for (const k of knives) {
    const wa = k.a + angle;
    const tipR = r * 0.72;
    drawKnife(ctx, cx + Math.cos(wa) * tipR, cy + Math.sin(wa) * tipR, wa + Math.PI, len, k.fixed ? OBSTACLE_SKIN : (k.skin ?? 0), 1, k.accent);
  }
  const s = scaleOf(ctx);
  const R = r * 1.25; // Platz für den Schatten
  const body = sprite(`w|${Math.round(r)}|${opts.bossId ?? '-'}|${s}`, R * 2, R * 2, s, (g) => {
    g.translate(R, R);
    if (art) {
      g.shadowColor = 'rgba(0,0,0,0.4)';
      g.shadowBlur = r * 0.12;
      g.shadowOffsetY = r * 0.05;
      art.body(g, r);
    } else paintWheelBody(g, r, {});
  });
  ctx.save();
  ctx.globalAlpha *= opts.alpha ?? 1;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(body, -R, -R, R * 2, R * 2);
  if (art?.overlay && opts.sim) art.overlay(ctx, r, opts.sim);
  // Bonus-Sterne funkeln auf dem Rad
  if (opts.stars?.length) {
    const tw = 1 + 0.12 * Math.sin((opts.sim?.t ?? opts.t ?? 0) * 6);
    for (const a of opts.stars) {
      const x = Math.cos(a) * r * 0.8;
      const y = Math.sin(a) * r * 0.8;
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#7a4a00';
      ctx.lineWidth = r * 0.02;
      starPath(ctx, x, y, r * 0.11 * tw);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (opts.flash) {
    ctx.fillStyle = `rgba(255,255,255,${opts.flash})`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Teile in Bildschirmrichtung (Schilde, Monde, Fangarm, Dunkelheit …)
  if (art?.front && opts.sim && !opts.visualOnly) art.front(ctx, cx, cy, r, opts.sim);
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
