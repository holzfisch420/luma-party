/**
 * Canvas-Renderer für die Arena (Hauptbildschirm).
 * Zeichnet Boden, Wände, Reifenspuren, Panzer, Geschosse, Minen, Kisten und Effekte
 * und interpoliert zwischen den Positions-Frames des Servers (~20 Hz → 60 fps).
 */
import { POWER_IDS, POWERUPS, TANK_COLORS } from '../../game-config';
import { MAP_H, MAP_W, type ArenaMap } from '../../maps';
import { BULLET_KIND, TANK_FLAG, type Fx, type PanzerFrame } from '../../types';
import { panzerSounds } from './sounds';

const INTERP_DELAY = 110; // ms Puffer für flüssige Bewegung
const INK = '#161616';

const THEMES: Record<ArenaMap['theme'], { floor: string; speck: string; wall: string; wallTop: string; track: string }> = {
  sand: { floor: '#ecd9a7', speck: '#dcc48b', wall: '#c4703f', wallTop: '#de8b55', track: 'rgba(92,62,30,0.30)' },
  grass: { floor: '#94cf6b', speck: '#80bd58', wall: '#4b8a3b', wallTop: '#62a64e', track: 'rgba(52,72,24,0.34)' },
  snow: { floor: '#eef4f8', speck: '#d9e5ee', wall: '#8fbbd6', wallTop: '#b3d5ea', track: 'rgba(80,110,140,0.30)' },
  asphalt: { floor: '#a3a8ad', speck: '#93989e', wall: '#636b74', wallTop: '#7c858f', track: 'rgba(30,30,32,0.32)' },
};

interface TankView {
  slot: number;
  x: number;
  y: number;
  a: number;
  flags: number;
}

interface Effect {
  kind: Fx['t'];
  start: number;
  data: Fx;
}

function shadeHex(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

export class ArenaRenderer {
  private ctx: CanvasRenderingContext2D;
  private map: ArenaMap | null = null;
  private staticLayer = document.createElement('canvas');
  private trackLayer = document.createElement('canvas');
  private frames: { at: number; f: PanzerFrame }[] = [];
  private effects: Effect[] = [];
  private colors = new Map<number, number>(); // slot → Farbindex
  private lastStamp = new Map<number, { x: number; y: number; dist: number }>();
  private lastFade = 0;
  private raf = 0;
  private scale = 40;
  private ox = 0;
  private oy = 0;


  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    const loop = (now: number) => {
      this.render(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  setColors(players: { slot: number; color: number }[]) {
    this.colors = new Map(players.map((p) => [p.slot, p.color]));
  }

  setMap(map: ArenaMap) {
    const changed = this.map?.id !== map.id;
    this.map = map;
    this.resize(true);
    if (changed) this.clearRound();
  }

  /** neue Runde: Spuren und Effekte zurücksetzen */
  clearRound() {
    const t = this.trackLayer.getContext('2d')!;
    t.clearRect(0, 0, this.trackLayer.width, this.trackLayer.height);
    this.frames = [];
    this.effects = [];
    this.lastStamp.clear();
  }

  pushFrame(f: PanzerFrame) {
    const now = performance.now();
    this.frames.push({ at: now, f });
    if (this.frames.length > 12) this.frames.shift();
    for (const fx of f.fx) {
      this.effects.push({ kind: fx.t, start: now + INTERP_DELAY, data: fx });
      setTimeout(() => this.sound(fx), INTERP_DELAY);
    }
  }

  private sound(fx: Fx) {
    if (fx.t === 'shot') panzerSounds.shot();
    else if (fx.t === 'boom') panzerSounds.boom(fx.s);
    else if (fx.t === 'laser') panzerSounds.laser();
    else if (fx.t === 'pickup') panzerSounds.pickup();
    else if (fx.t === 'honk') panzerSounds.honk();
    else if (fx.t === 'pop') panzerSounds.pop();
  }

  // ------------------------------------------------------------------ Layout

  resize(force = false) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (!force && w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = Math.max(1, w);
    this.canvas.height = Math.max(1, h);

    const margin = 0.6;
    this.scale = Math.min(w / (MAP_W + margin * 2), h / (MAP_H + margin * 2));
    this.ox = (w - MAP_W * this.scale) / 2;
    this.oy = (h - MAP_H * this.scale) / 2;
    const tw = Math.round(MAP_W * this.scale);
    const th = Math.round(MAP_H * this.scale);
    // Spuren beim Skalieren mitnehmen
    if (this.trackLayer.width !== tw || this.trackLayer.height !== th) {
      const old = document.createElement('canvas');
      old.width = this.trackLayer.width;
      old.height = this.trackLayer.height;
      if (old.width && old.height) old.getContext('2d')!.drawImage(this.trackLayer, 0, 0);
      this.trackLayer.width = tw;
      this.trackLayer.height = th;
      if (old.width && old.height) this.trackLayer.getContext('2d')!.drawImage(old, 0, 0, tw, th);
    }
    this.buildStatic();
  }

  private buildStatic() {
    const map = this.map;
    const c = this.staticLayer;
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, c.width, c.height);
    if (!map) return;
    const th = THEMES[map.theme];
    const s = this.scale;
    g.save();
    g.translate(this.ox, this.oy);
    // Rahmen-Schatten
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(-0.35 * s + 0.15 * s, -0.35 * s + 0.15 * s, (MAP_W + 0.7) * s, (MAP_H + 0.7) * s);
    // Boden
    g.fillStyle = th.floor;
    g.fillRect(0, 0, MAP_W * s, MAP_H * s);
    // Sprenkel (deterministisch)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.fillStyle = th.speck;
    for (let i = 0; i < MAP_W * MAP_H * 3; i++) {
      const x = rnd() * MAP_W * s;
      const y = rnd() * MAP_H * s;
      const r = (0.03 + rnd() * 0.06) * s;
      g.beginPath();
      g.ellipse(x, y, r * 1.6, r, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    // feines Kachelraster
    g.strokeStyle = 'rgba(0,0,0,0.05)';
    g.lineWidth = 1;
    for (let x = 1; x < MAP_W; x++) {
      g.beginPath();
      g.moveTo(x * s, 0);
      g.lineTo(x * s, MAP_H * s);
      g.stroke();
    }
    for (let y = 1; y < MAP_H; y++) {
      g.beginPath();
      g.moveTo(0, y * s);
      g.lineTo(MAP_W * s, y * s);
      g.stroke();
    }
    // Wände: Schatten, Seite, Oberseite, Kontur
    const inner = map.walls.filter((w) => w.x >= 0 && w.y >= 0 && w.x + w.w <= MAP_W && w.y + w.h <= MAP_H);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (const w of inner) g.fillRect((w.x + 0.12) * s, (w.y + 0.16) * s, w.w * s, w.h * s);
    for (const w of inner) {
      g.fillStyle = th.wall;
      g.fillRect(w.x * s, w.y * s, w.w * s, w.h * s);
      g.fillStyle = th.wallTop;
      g.fillRect((w.x + 0.08) * s, (w.y + 0.06) * s, (w.w - 0.16) * s, (w.h - 0.22) * s);
      g.strokeStyle = INK;
      g.lineWidth = Math.max(2, s * 0.06);
      g.strokeRect(w.x * s, w.y * s, w.w * s, w.h * s);
      // Fugen
      g.strokeStyle = 'rgba(0,0,0,0.18)';
      g.lineWidth = Math.max(1, s * 0.025);
      for (let x = w.x + 1; x < w.x + w.w; x++) {
        g.beginPath();
        g.moveTo(x * s, w.y * s);
        g.lineTo(x * s, (w.y + w.h) * s);
        g.stroke();
      }
      for (let y = w.y + 1; y < w.y + w.h; y++) {
        g.beginPath();
        g.moveTo(w.x * s, y * s);
        g.lineTo((w.x + w.w) * s, y * s);
        g.stroke();
      }
    }
    // Außenrahmen
    g.strokeStyle = INK;
    g.lineWidth = Math.max(4, s * 0.18);
    g.strokeRect(-g.lineWidth / 2, -g.lineWidth / 2, MAP_W * s + g.lineWidth, MAP_H * s + g.lineWidth);
    g.restore();
  }

  // ------------------------------------------------------------------ Interpolation

  private sample(now: number) {
    const t = now - INTERP_DELAY;
    const fs = this.frames;
    if (fs.length === 0) return null;
    let a = fs[0]!;
    let b = fs[fs.length - 1]!;
    for (let i = 0; i < fs.length - 1; i++) {
      if (fs[i]!.at <= t && fs[i + 1]!.at >= t) {
        a = fs[i]!;
        b = fs[i + 1]!;
        break;
      }
    }
    if (t >= b.at) a = b;
    const k = a === b ? 1 : Math.min(1, Math.max(0, (t - a.at) / (b.at - a.at)));
    const prevTanks = new Map(a.f.k.map((r) => [r[0]!, r]));
    const tanks: TankView[] = b.f.k.map((r) => {
      const p = prevTanks.get(r[0]!) ?? r;
      return { slot: r[0]!, x: p[1]! + (r[1]! - p[1]!) * k, y: p[2]! + (r[2]! - p[2]!) * k, a: lerpAngle(p[3]!, r[3]!, k), flags: r[4]! };
    });
    const prevBullets = new Map(a.f.b.map((r) => [r[0]!, r]));
    const bullets = b.f.b.map((r) => {
      const p = prevBullets.get(r[0]!);
      // Abpraller zwischen zwei Frames nicht „durch die Wand“ ziehen
      const ok = p && Math.hypot(r[1]! - p[1]!, r[2]! - p[2]!) < 0.6;
      return { x: ok ? p[1]! + (r[1]! - p[1]!) * k : r[1]!, y: ok ? p[2]! + (r[2]! - p[2]!) * k : r[2]!, kind: r[3]!, a: r[4]! };
    });
    return { tanks, bullets, mines: b.f.m, crates: b.f.c };
  }

  // ------------------------------------------------------------------ Zeichnen

  private render(now: number) {
    this.resize();
    const g = this.ctx;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.map) return;
    g.drawImage(this.staticLayer, 0, 0);
    const state = this.sample(now);
    const s = this.scale;

    if (state) this.stampTracks(state.tanks, now);
    g.drawImage(this.trackLayer, this.ox, this.oy);

    g.save();
    g.translate(this.ox, this.oy);
    g.scale(s, s);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    if (state) {
      for (const m of state.mines) this.drawMine(g, m, now);
      for (const c of state.crates) this.drawCrate(g, c, now);
      for (const t of state.tanks) this.drawTank(g, t, now);
      for (const b of state.bullets) this.drawBullet(g, b, now);
    }
    this.drawEffects(g, now, state?.tanks ?? []);
    g.restore();
  }

  private colorOf(slot: number) {
    return TANK_COLORS[this.colors.get(slot) ?? slot]?.hex ?? '#888';
  }

  /** Reifenspuren: zwei Kettenabdrücke pro Panzer, verblassen langsam */
  private stampTracks(tanks: TankView[], now: number) {
    const tg = this.trackLayer.getContext('2d')!;
    const s = this.scale;
    if (now - this.lastFade > 250) {
      this.lastFade = now;
      tg.globalCompositeOperation = 'destination-out';
      tg.fillStyle = 'rgba(0,0,0,0.035)';
      tg.fillRect(0, 0, this.trackLayer.width, this.trackLayer.height);
      tg.globalCompositeOperation = 'source-over';
    }
    tg.fillStyle = THEMES[this.map!.theme].track;
    for (const t of tanks) {
      if (t.flags & TANK_FLAG.cloak) continue;
      const last = this.lastStamp.get(t.slot);
      if (!last) {
        this.lastStamp.set(t.slot, { x: t.x, y: t.y, dist: 0 });
        continue;
      }
      const d = Math.hypot(t.x - last.x, t.y - last.y);
      if (d > 1.5) {
        // Teleport (neue Runde)
        this.lastStamp.set(t.slot, { x: t.x, y: t.y, dist: 0 });
        continue;
      }
      if (d < 0.11) continue;
      const cos = Math.cos(t.a);
      const sin = Math.sin(t.a);
      for (const side of [-1, 1]) {
        const px = t.x - sin * 0.22 * side;
        const py = t.y + cos * 0.22 * side;
        tg.save();
        tg.translate(px * s, py * s);
        tg.rotate(t.a);
        tg.fillRect(-0.07 * s, -0.065 * s, 0.14 * s, 0.13 * s);
        tg.restore();
      }
      this.lastStamp.set(t.slot, { x: t.x, y: t.y, dist: last.dist + d });
    }
  }

  private drawTank(g: CanvasRenderingContext2D, t: TankView, now: number) {
    const color = this.colorOf(t.slot);
    const dist = this.lastStamp.get(t.slot)?.dist ?? 0;
    g.save();
    g.translate(t.x, t.y);
    if (t.flags & TANK_FLAG.cloak) g.globalAlpha = 0.1 + 0.05 * Math.sin(now / 90);
    // Schatten
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(0.06, 0.08, 0.42, 0.36, 0, 0, Math.PI * 2);
    g.fill();
    g.rotate(t.a);
    const lw = 0.05;
    // Ketten
    for (const side of [-1, 1]) {
      g.fillStyle = '#2b2b2b';
      g.beginPath();
      g.roundRect(-0.37, side * 0.26 - 0.09, 0.74, 0.18, 0.06);
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = lw;
      g.stroke();
      // bewegte Kettenglieder
      g.strokeStyle = '#5a5a5a';
      g.lineWidth = 0.03;
      const off = (dist * 8) % 0.12;
      for (let x = -0.34 + off; x < 0.34; x += 0.12) {
        g.beginPath();
        g.moveTo(x, side * 0.26 - 0.07);
        g.lineTo(x, side * 0.26 + 0.07);
        g.stroke();
      }
    }
    // Wanne
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(-0.32, -0.22, 0.62, 0.44, 0.08);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.stroke();
    g.fillStyle = shadeHex(color, -0.18);
    g.fillRect(-0.3, 0.08, 0.58, 0.12);
    // Rohr
    g.fillStyle = shadeHex(color, -0.3);
    g.beginPath();
    g.roundRect(0.02, -0.055, 0.46, 0.11, 0.03);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.stroke();
    // Turm
    g.fillStyle = shadeHex(color, 0.18);
    g.beginPath();
    g.arc(0, 0, 0.17, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath();
    g.arc(-0.05, -0.05, 0.05, 0, Math.PI * 2);
    g.fill();
    // Turbo-Flammen
    if (t.flags & TANK_FLAG.turbo) {
      g.fillStyle = now % 120 < 60 ? '#ffb02e' : '#ff5a2e';
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(-0.38, side * 0.26 - 0.06);
        g.lineTo(-0.58 - Math.random() * 0.1, side * 0.26);
        g.lineTo(-0.38, side * 0.26 + 0.06);
        g.fill();
      }
    }
    g.restore();
    // Schild
    if (t.flags & TANK_FLAG.shield) {
      g.save();
      g.translate(t.x, t.y);
      const pulse = 0.5 + 0.04 * Math.sin(now / 120);
      g.fillStyle = 'rgba(80,190,255,0.18)';
      g.strokeStyle = 'rgba(40,150,240,0.9)';
      g.lineWidth = 0.05;
      g.beginPath();
      g.arc(0, 0, pulse, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.restore();
    }
  }

  private drawBullet(g: CanvasRenderingContext2D, b: { x: number; y: number; kind: number; a: number }, now: number) {
    g.save();
    g.translate(b.x, b.y);
    switch (b.kind) {
      case BULLET_KIND.missile: {
        g.rotate(b.a);
        g.fillStyle = now % 100 < 50 ? '#ffb02e' : '#ff4b2e';
        g.beginPath();
        g.moveTo(-0.14, -0.05);
        g.lineTo(-0.28 - Math.random() * 0.06, 0);
        g.lineTo(-0.14, 0.05);
        g.fill();
        g.fillStyle = '#e8e8e8';
        g.strokeStyle = INK;
        g.lineWidth = 0.035;
        g.beginPath();
        g.moveTo(0.16, 0);
        g.lineTo(0.06, -0.06);
        g.lineTo(-0.14, -0.06);
        g.lineTo(-0.14, 0.06);
        g.lineTo(0.06, 0.06);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = '#e53935';
        g.fillRect(0.0, -0.06, 0.05, 0.12);
        break;
      }
      case BULLET_KIND.frag: {
        g.fillStyle = '#2f3b2f';
        g.strokeStyle = INK;
        g.lineWidth = 0.035;
        g.beginPath();
        g.arc(0, 0, 0.15, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = now % 200 < 100 ? '#ff3b3b' : '#ffd93b';
        g.beginPath();
        g.arc(0.04, -0.04, 0.045, 0, Math.PI * 2);
        g.fill();
        break;
      }
      default: {
        const r = b.kind === BULLET_KIND.shell ? 0.085 : b.kind === BULLET_KIND.shard ? 0.05 : 0.065;
        g.fillStyle = b.kind === BULLET_KIND.mg ? '#ff9f1c' : b.kind === BULLET_KIND.shard ? '#ffd93b' : '#1b1b1b';
        g.strokeStyle = b.kind === BULLET_KIND.shell || b.kind === BULLET_KIND.pellet ? '#fff' : INK;
        g.lineWidth = 0.025;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    }
    g.restore();
  }

  private drawMine(g: CanvasRenderingContext2D, m: number[], now: number) {
    const [x, y, armed, slot] = m as [number, number, number, number];
    g.save();
    g.translate(x, y);
    g.strokeStyle = this.colorOf(slot);
    g.lineWidth = 0.05;
    g.fillStyle = '#3b3b3b';
    g.beginPath();
    g.arc(0, 0, 0.17, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (armed) {
      g.fillStyle = now % 700 < 350 ? '#ff2d2d' : '#6b1010';
      g.beginPath();
      g.arc(0, 0, 0.06, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  private drawCrate(g: CanvasRenderingContext2D, c: number[], now: number) {
    const [x, y, idx] = c as [number, number, number];
    const id = POWER_IDS[idx]!;
    const p = POWERUPS[id];
    const bob = Math.sin(now / 260 + x) * 0.04;
    g.save();
    g.translate(x, y + bob);
    g.fillStyle = p.color;
    g.globalAlpha = 0.28 + 0.12 * Math.sin(now / 200);
    g.beginPath();
    g.arc(0, 0, 0.46, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = '#fff6dc';
    g.strokeStyle = INK;
    g.lineWidth = 0.05;
    g.beginPath();
    g.roundRect(-0.28, -0.28, 0.56, 0.56, 0.08);
    g.fill();
    g.stroke();
    g.font = '0.36px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(p.icon, 0, 0.02);
    g.restore();
  }

  private drawEffects(g: CanvasRenderingContext2D, now: number, tanks: TankView[]) {
    const alive: Effect[] = [];
    for (const e of this.effects) {
      const age = now - e.start;
      if (age < 0) {
        alive.push(e);
        continue;
      }
      const d = e.data;
      let done = false;
      switch (d.t) {
        case 'boom': {
          const life = 650 * Math.max(0.6, d.s);
          const k = age / life;
          if (k >= 1) {
            done = true;
            // Brandfleck auf der Spurenebene
            if (d.s >= 1) {
              const tg = this.trackLayer.getContext('2d')!;
              tg.fillStyle = 'rgba(30,20,10,0.35)';
              tg.beginPath();
              tg.arc(d.x * this.scale, d.y * this.scale, 0.45 * this.scale * d.s, 0, Math.PI * 2);
              tg.fill();
            }
            break;
          }
          const r = (0.3 + k * 0.9) * d.s;
          g.globalAlpha = 1 - k;
          g.fillStyle = '#ffd93b';
          g.beginPath();
          g.arc(d.x, d.y, r, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ff6b2e';
          g.beginPath();
          g.arc(d.x, d.y, r * 0.65, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = INK;
          g.lineWidth = 0.05;
          g.beginPath();
          g.arc(d.x, d.y, r, 0, Math.PI * 2);
          g.stroke();
          // Trümmer
          g.fillStyle = '#3a3a3a';
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2 + d.x;
            g.fillRect(d.x + Math.cos(ang) * r * 1.2 - 0.04, d.y + Math.sin(ang) * r * 1.2 - 0.04, 0.08, 0.08);
          }
          g.globalAlpha = 1;
          break;
        }
        case 'laser': {
          const k = age / 450;
          if (k >= 1) {
            done = true;
            break;
          }
          const color = TANK_COLORS[d.c]?.hex ?? '#ff3333';
          g.globalAlpha = 1 - k;
          for (const [w, c] of [
            [0.32, color],
            [0.12, '#ffffff'],
          ] as const) {
            g.strokeStyle = c;
            g.lineWidth = w * (1 - k * 0.5);
            g.beginPath();
            g.moveTo(d.p[0]!, d.p[1]!);
            for (let i = 2; i < d.p.length; i += 2) g.lineTo(d.p[i]!, d.p[i + 1]!);
            g.stroke();
          }
          g.globalAlpha = 1;
          break;
        }
        case 'pickup': {
          const k = age / 900;
          if (k >= 1) {
            done = true;
            break;
          }
          const p = POWERUPS[POWER_IDS[d.i]!];
          g.globalAlpha = 1 - k;
          g.strokeStyle = p.color;
          g.lineWidth = 0.07;
          g.beginPath();
          g.arc(d.x, d.y, 0.3 + k * 0.6, 0, Math.PI * 2);
          g.stroke();
          this.label(g, p.name, d.x, d.y - 0.5 - k * 0.6, 0.42, p.color);
          g.globalAlpha = 1;
          break;
        }
        case 'pop': {
          const k = age / 400;
          if (k >= 1) {
            done = true;
            break;
          }
          g.globalAlpha = 1 - k;
          g.strokeStyle = '#4fc3f7';
          g.lineWidth = 0.08;
          g.beginPath();
          g.arc(d.x, d.y, 0.5 + k * 0.6, 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
          break;
        }
        case 'honk': {
          const k = age / 1000;
          const t = tanks.find((x) => x.slot === d.s);
          if (k >= 1 || !t) {
            done = k >= 1;
            if (!done) alive.push(e);
            continue;
          }
          const pop = Math.min(1, age / 120);
          g.save();
          g.translate(t.x + 0.35, t.y - 0.75);
          g.scale(pop, pop);
          g.fillStyle = '#fff';
          g.strokeStyle = INK;
          g.lineWidth = 0.05;
          g.beginPath();
          g.roundRect(-0.55, -0.24, 1.1, 0.44, 0.14);
          g.fill();
          g.stroke();
          g.restore();
          this.label(g, 'TÖÖT!', t.x + 0.35, t.y - 0.74, 0.32 * pop, INK, false);
          break;
        }
        case 'shot': {
          done = age > 90;
          break;
        }
        default:
          done = true;
      }
      if (!done) alive.push(e);
    }
    this.effects = alive;
  }

  private label(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, outline = true) {
    g.font = `${size}px Bangers, Impact, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (outline) {
      g.strokeStyle = INK;
      g.lineWidth = size * 0.22;
      g.strokeText(text, x, y);
    }
    g.fillStyle = outline ? color : INK;
    g.fillText(text, x, y);
  }
}
