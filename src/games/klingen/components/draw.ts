/** Zeichnen von Rad und Messern (Canvas 2D) – gemeinsam für Handy und Fernseher. */

export interface StuckKnife {
  /** Position im Rad (Bogenmaß) */
  a: number;
  color: string;
  /** Hindernis (vorgegeben) */
  fixed?: boolean;
}

/** Messer, Spitze bei (x, y), zeigt in Richtung `dir` (Bogenmaß, 0 = rechts) */
export function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, len: number, color: string, alpha = 1) {
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
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
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
    // Jahresringe
    ctx.strokeStyle = 'rgba(70,35,12,0.35)';
    ctx.lineWidth = Math.max(1, r * 0.018);
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(r * 0.02 * i, 0, r * (0.16 * i), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5e2f12';
  }
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.stroke();
  // Markierung, damit man die Drehung sieht
  ctx.fillStyle = opts.boss ? '#d99a2b' : '#5e2f12';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
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
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}
