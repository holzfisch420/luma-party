/**
 * Canvas-Renderer für die Arena (Hauptbildschirm) – flacher Stil im Geiste
 * der Google-Minispiele: Schachbrett-Boden, flache Blöcke, keine Konturen.
 * Interpoliert zwischen den Positions-Frames des Servers (~20 Hz → 60 fps)
 * und erzeugt Effekte: Leuchtspuren, Abprall-Funken, Mündungsblitze, Explosionen.
 */
import { POWER_IDS, POWERUPS, TANK_COLORS } from '../../game-config';
import { MAP_H, MAP_W, type ArenaMap } from '../../maps';
import { BULLET_KIND, TANK_FLAG, type Fx, type PanzerFrame } from '../../types';
import { panzerSounds } from './sounds';
import { canvasDpr } from '../../../../app/canvas-dpr';

const INTERP_DELAY = 110; // ms Puffer für flüssige Bewegung
export const FRAME_GREEN = '#578a34';

interface Theme {
  light: string;
  dark: string;
  wall: string;
  wallTop: string;
  track: string;
}

/** Bodenfarben je Arena-Thema (zweifarbiges Schachbrett) */
const THEMES: Record<ArenaMap['theme'], Theme> = {
  grass: { light: '#aad751', dark: '#a2d149', wall: '#4a752c', wallTop: '#5c8f37', track: 'rgba(70,100,30,0.28)' },
  sand: { light: '#e5c29f', dark: '#d7b899', wall: '#a47551', wallTop: '#b98a63', track: 'rgba(120,80,40,0.25)' },
  snow: { light: '#f1f8fd', dark: '#e3eff7', wall: '#86b3d1', wallTop: '#a1c7e0', track: 'rgba(90,130,170,0.25)' },
  asphalt: { light: '#cfd3d8', dark: '#c4c9ce', wall: '#6b737d', wallTop: '#808993', track: 'rgba(40,44,50,0.25)' },
};

interface TankView {
  slot: number;
  x: number;
  y: number;
  a: number;
  flags: number;
}

interface BulletView {
  id: number;
  x: number;
  y: number;
  kind: number;
  a: number;
  owner: number;
}

interface Effect {
  start: number;
  data: Fx;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  born: number;
  life: number;
}

function mix(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
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
  private particles: Particle[] = [];
  private trails = new Map<number, { pts: { x: number; y: number }[]; a: number; owner: number; kind: number; seen: number }>();
  private colors = new Map<number, number>();
  private lastStamp = new Map<number, { x: number; y: number; dist: number }>();
  private lastSeen = new Map<number, TankView>();
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

  clearRound() {
    this.trackLayer.getContext('2d')!.clearRect(0, 0, this.trackLayer.width, this.trackLayer.height);
    this.frames = [];
    this.effects = [];
    this.particles = [];
    this.trails.clear();
    this.lastStamp.clear();
  }

  pushFrame(f: PanzerFrame) {
    const now = performance.now();
    this.frames.push({ at: now, f });
    if (this.frames.length > 12) this.frames.shift();
    for (const fx of f.fx) {
      this.effects.push({ start: now + INTERP_DELAY, data: fx });
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

  private colorOf(slot: number) {
    return TANK_COLORS[this.colors.get(slot) ?? slot]?.hex ?? '#888888';
  }

  // ------------------------------------------------------------------ Layout

  resize(force = false) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = canvasDpr(rect.width, rect.height);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (!force && w === this.canvas.width && h === this.canvas.height) return;
    this.canvas.width = Math.max(1, w);
    this.canvas.height = Math.max(1, h);
    const margin = 0.45;
    this.scale = Math.min(w / (MAP_W + margin * 2), h / (MAP_H + margin * 2));
    this.ox = (w - MAP_W * this.scale) / 2;
    this.oy = (h - MAP_H * this.scale) / 2;
    const tw = Math.round(MAP_W * this.scale);
    const th = Math.round(MAP_H * this.scale);
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

  /** Boden (Schachbrett) und Wände (flache Blöcke) einmalig vorzeichnen */
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
    // Schachbrett
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        g.fillStyle = (x + y) % 2 === 0 ? th.light : th.dark;
        g.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(s) + 1, Math.ceil(s) + 1);
      }
    }
    const inner = map.walls.filter((w) => w.x >= 0 && w.y >= 0 && w.x + w.w <= MAP_W && w.y + w.h <= MAP_H);
    // weicher, flacher Schatten nach unten
    g.fillStyle = 'rgba(0,0,0,0.13)';
    for (const w of inner) g.fillRect(w.x * s, (w.y + 0.14) * s, w.w * s, w.h * s);
    // Blöcke: Seite (dunkel) + Oberseite (hell), leicht abgerundet
    for (const w of inner) {
      g.fillStyle = th.wall;
      g.beginPath();
      g.roundRect(w.x * s, w.y * s, w.w * s, w.h * s, s * 0.1);
      g.fill();
      g.fillStyle = th.wallTop;
      g.beginPath();
      g.roundRect(w.x * s, w.y * s, w.w * s, (w.h - 0.16) * s, s * 0.1);
      g.fill();
    }
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
    const bullets: BulletView[] = b.f.b.map((r) => {
      const p = prevBullets.get(r[0]!);
      const ok = p && Math.hypot(r[1]! - p[1]!, r[2]! - p[2]!) < 0.6;
      return { id: r[0]!, x: ok ? p[1]! + (r[1]! - p[1]!) * k : r[1]!, y: ok ? p[2]! + (r[2]! - p[2]!) * k : r[2]!, kind: r[3]!, a: r[4]!, owner: r[5] ?? 0 };
    });
    return { tanks, bullets, mines: b.f.m, crates: b.f.c };
  }

  // ------------------------------------------------------------------ Zeichnen

  private render(now: number) {
    this.resize();
    const g = this.ctx;
    g.fillStyle = FRAME_GREEN;
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.map) return;
    g.drawImage(this.staticLayer, 0, 0);
    const state = this.sample(now);
    const s = this.scale;

    if (state) {
      this.stampTracks(state.tanks, now);
      for (const t of state.tanks) this.lastSeen.set(t.slot, t);
    }
    g.drawImage(this.trackLayer, this.ox, this.oy);

    g.save();
    g.translate(this.ox, this.oy);
    g.scale(s, s);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (state) {
      this.updateTrails(state.bullets, now);
      for (const m of state.mines) this.drawMine(g, m, now);
      for (const c of state.crates) this.drawCrate(g, c, now);
      this.drawTrails(g);
      for (const t of state.tanks) this.drawTank(g, t, now);
      for (const b of state.bullets) this.drawBullet(g, b, now);
    }
    this.drawEffects(g, now, state?.tanks ?? []);
    this.drawParticles(g, now);
    g.restore();
  }

  /** Kettenabdrücke: zwei Reihen pro Panzer, verblassen langsam */
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
      if (!last || Math.hypot(t.x - last.x, t.y - last.y) > 1.5) {
        this.lastStamp.set(t.slot, { x: t.x, y: t.y, dist: last?.dist ?? 0 });
        continue;
      }
      const d = Math.hypot(t.x - last.x, t.y - last.y);
      if (d < 0.11) continue;
      const cos = Math.cos(t.a);
      const sin = Math.sin(t.a);
      for (const side of [-1, 1]) {
        tg.save();
        tg.translate((t.x - sin * 0.24 * side) * s, (t.y + cos * 0.24 * side) * s);
        tg.rotate(t.a);
        tg.fillRect(-0.06 * s, -0.07 * s, 0.12 * s, 0.14 * s);
        tg.restore();
      }
      this.lastStamp.set(t.slot, { x: t.x, y: t.y, dist: last.dist + d });
    }
  }

  // ------------------------------------------------------------------ Panzer

  private drawTank(g: CanvasRenderingContext2D, t: TankView, now: number) {
    const color = this.colorOf(t.slot);
    const dist = this.lastStamp.get(t.slot)?.dist ?? 0;
    g.save();
    g.translate(t.x, t.y);
    if (t.flags & TANK_FLAG.cloak) g.globalAlpha = 0.12 + 0.05 * Math.sin(now / 90);
    // flacher Schatten
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.beginPath();
    g.ellipse(0, 0.1, 0.42, 0.36, 0, 0, Math.PI * 2);
    g.fill();
    g.rotate(t.a);
    // Ketten
    for (const side of [-1, 1]) {
      g.fillStyle = '#4a4f55';
      g.beginPath();
      g.roundRect(-0.38, side * 0.25 - 0.1, 0.76, 0.2, 0.08);
      g.fill();
      g.fillStyle = '#3a3e43';
      const off = (dist * 8) % 0.14;
      for (let x = -0.33 + off; x < 0.34; x += 0.14) g.fillRect(x, side * 0.25 - 0.1, 0.045, 0.2);
    }
    // Wanne
    g.fillStyle = mix(color, -0.12);
    g.beginPath();
    g.roundRect(-0.32, -0.21, 0.62, 0.42, 0.1);
    g.fill();
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(-0.32, -0.21, 0.62, 0.34, 0.1);
    g.fill();
    // Rohr
    g.fillStyle = mix(color, -0.28);
    g.beginPath();
    g.roundRect(0.04, -0.06, 0.46, 0.12, 0.05);
    g.fill();
    // Turm
    g.fillStyle = mix(color, -0.12);
    g.beginPath();
    g.arc(0, 0.02, 0.18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = mix(color, 0.22);
    g.beginPath();
    g.arc(0, 0, 0.17, 0, Math.PI * 2);
    g.fill();
    // Turbo: flache Flammen
    if (t.flags & TANK_FLAG.turbo) {
      for (const side of [-1, 1]) {
        const len = 0.16 + Math.random() * 0.1;
        g.fillStyle = '#ffb02e';
        g.beginPath();
        g.ellipse(-0.42 - len / 2, side * 0.25, len, 0.07, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fff3c4';
        g.beginPath();
        g.ellipse(-0.42 - len / 4, side * 0.25, len / 2, 0.035, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    // Schild: flache, halbtransparente Blase
    if (t.flags & TANK_FLAG.shield) {
      const r = 0.52 + 0.03 * Math.sin(now / 140);
      g.fillStyle = 'rgba(66,165,245,0.22)';
      g.beginPath();
      g.arc(t.x, t.y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.beginPath();
      g.ellipse(t.x - r * 0.35, t.y - r * 0.45, r * 0.22, r * 0.11, -0.6, 0, Math.PI * 2);
      g.fill();
    }
  }

  // ------------------------------------------------------------------ Geschosse

  /** Spuren und Abprall-Funken aus den Kugelpositionen ableiten */
  private updateTrails(bullets: BulletView[], now: number) {
    const seen = new Set<number>();
    for (const b of bullets) {
      seen.add(b.id);
      let tr = this.trails.get(b.id);
      if (!tr) {
        tr = { pts: [], a: b.a, owner: b.owner, kind: b.kind, seen: now };
        this.trails.set(b.id, tr);
      }
      // Richtungswechsel = Abpraller → Funken
      let d = Math.abs(b.a - tr.a);
      if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > 0.5 && tr.pts.length > 1) this.burst(b.x, b.y, this.colorOf(b.owner), 7, 2.2, 0.05, now);
      tr.a = b.a;
      tr.seen = now;
      const last = tr.pts[tr.pts.length - 1];
      if (!last || Math.hypot(last.x - b.x, last.y - b.y) > 0.04) tr.pts.push({ x: b.x, y: b.y });
      const maxLen = b.kind === BULLET_KIND.missile ? 16 : b.kind === BULLET_KIND.shard || b.kind === BULLET_KIND.pellet ? 5 : 9;
      while (tr.pts.length > maxLen) tr.pts.shift();
      // Rauch hinter der Rakete
      if (b.kind === BULLET_KIND.missile && Math.random() < 0.6) {
        this.particles.push({ x: b.x - Math.cos(b.a) * 0.15, y: b.y - Math.sin(b.a) * 0.15, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: 0.07 + Math.random() * 0.05, color: 'rgba(255,255,255,0.75)', born: now, life: 600 });
      }
    }
    // verschwundene Kugeln: kurzer Einschlag-Puff
    for (const [id, tr] of this.trails) {
      if (seen.has(id)) continue;
      const p = tr.pts[tr.pts.length - 1];
      if (p && tr.kind !== BULLET_KIND.frag) this.burst(p.x, p.y, this.colorOf(tr.owner), 5, 1.4, 0.045, now);
      this.trails.delete(id);
    }
  }

  private drawTrails(g: CanvasRenderingContext2D) {
    for (const tr of this.trails.values()) {
      const pts = tr.pts;
      if (pts.length < 2) continue;
      const color = tr.kind === BULLET_KIND.missile ? '#ffffff' : this.colorOf(tr.owner);
      const width = tr.kind === BULLET_KIND.frag ? 0.2 : tr.kind === BULLET_KIND.missile ? 0.12 : tr.kind === BULLET_KIND.shell ? 0.14 : 0.09;
      for (let i = 1; i < pts.length; i++) {
        const k = i / (pts.length - 1);
        g.strokeStyle = alpha(color.startsWith('#') ? color : '#ffffff', 0.15 + 0.55 * k);
        g.lineWidth = width * (0.35 + 0.65 * k);
        g.beginPath();
        g.moveTo(pts[i - 1]!.x, pts[i - 1]!.y);
        g.lineTo(pts[i]!.x, pts[i]!.y);
        g.stroke();
      }
    }
  }

  private drawBullet(g: CanvasRenderingContext2D, b: BulletView, now: number) {
    const color = this.colorOf(b.owner);
    g.save();
    g.translate(b.x, b.y);
    switch (b.kind) {
      case BULLET_KIND.missile: {
        g.rotate(b.a);
        g.fillStyle = now % 100 < 50 ? '#ffb02e' : '#ff7043';
        g.beginPath();
        g.ellipse(-0.2, 0, 0.1 + Math.random() * 0.04, 0.05, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#eceff1';
        g.beginPath();
        g.roundRect(-0.15, -0.065, 0.28, 0.13, 0.06);
        g.fill();
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(0.13, -0.065);
        g.lineTo(0.22, 0);
        g.lineTo(0.13, 0.065);
        g.fill();
        g.fillRect(-0.15, -0.1, 0.07, 0.2);
        break;
      }
      case BULLET_KIND.frag: {
        const pulse = 1 + 0.12 * Math.sin(now / 60);
        g.fillStyle = alpha(color, 0.3);
        g.beginPath();
        g.arc(0, 0, 0.24 * pulse, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#37474f';
        g.beginPath();
        g.arc(0, 0, 0.15, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = now % 200 < 100 ? '#ff5252' : '#ffd740';
        g.beginPath();
        g.arc(0.045, -0.045, 0.045, 0, Math.PI * 2);
        g.fill();
        break;
      }
      default: {
        const r = b.kind === BULLET_KIND.shell ? 0.085 : b.kind === BULLET_KIND.shard ? 0.05 : 0.065;
        // farbiger Schein + heller Kern
        g.fillStyle = alpha(color, 0.35);
        g.beginPath();
        g.arc(0, 0, r * 2, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = b.kind === BULLET_KIND.mg ? '#ffe082' : '#ffffff';
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  private drawMine(g: CanvasRenderingContext2D, m: number[], now: number) {
    const [x, y, armed, slot] = m as [number, number, number, number];
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.beginPath();
    g.ellipse(0, 0.05, 0.19, 0.15, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = mix(this.colorOf(slot), -0.35);
    g.beginPath();
    g.arc(0, 0, 0.18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#455a64';
    g.beginPath();
    g.arc(0, 0, 0.12, 0, Math.PI * 2);
    g.fill();
    if (armed) {
      const on = now % 700 < 350;
      g.fillStyle = on ? '#ff5252' : '#b71c1c';
      g.beginPath();
      g.arc(0, 0, 0.055, 0, Math.PI * 2);
      g.fill();
      if (on) {
        g.fillStyle = 'rgba(255,82,82,0.25)';
        g.beginPath();
        g.arc(0, 0, 0.3, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  private drawCrate(g: CanvasRenderingContext2D, c: number[], now: number) {
    const [x, y, idx] = c as [number, number, number];
    const p = POWERUPS[POWER_IDS[idx]!];
    const bob = Math.sin(now / 260 + x) * 0.05;
    g.save();
    g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.beginPath();
    g.ellipse(0, 0.3, 0.26 - bob, 0.07, 0, 0, Math.PI * 2);
    g.fill();
    g.translate(0, bob - 0.04);
    g.fillStyle = mix(p.color, -0.2);
    g.beginPath();
    g.roundRect(-0.27, -0.25, 0.54, 0.54, 0.12);
    g.fill();
    g.fillStyle = p.color;
    g.beginPath();
    g.roundRect(-0.27, -0.27, 0.54, 0.48, 0.12);
    g.fill();
    g.font = '0.32px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(p.icon, 0, -0.02);
    g.restore();
  }

  // ------------------------------------------------------------------ Effekte

  private burst(x: number, y: number, color: string, n: number, speed: number, r: number, now: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: r * (0.6 + Math.random() * 0.8), color: i % 3 === 0 ? '#ffffff' : color, born: now, life: 260 + Math.random() * 200 });
    }
  }

  private drawParticles(g: CanvasRenderingContext2D, now: number) {
    const keep: Particle[] = [];
    for (const p of this.particles) {
      const age = (now - p.born) / p.life;
      if (age >= 1) continue;
      const t = (now - p.born) / 1000;
      const drag = 1 - Math.min(0.85, age * 0.9);
      g.globalAlpha = 1 - age;
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x + p.vx * t * drag, p.y + p.vy * t * drag, p.r * (1 - age * 0.5), 0, Math.PI * 2);
      g.fill();
      keep.push(p);
    }
    g.globalAlpha = 1;
    this.particles = keep.length > 600 ? keep.slice(-600) : keep;
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
          if (age < 20 && !(e as Effect & { spawned?: boolean }).spawned) {
            (e as Effect & { spawned?: boolean }).spawned = true;
            this.burst(d.x, d.y, '#ffb02e', Math.round(10 * d.s), 3.2 * d.s, 0.09, now);
            this.burst(d.x, d.y, '#78909c', Math.round(6 * d.s), 2 * d.s, 0.1, now);
          }
          const life = 520 * Math.max(0.7, d.s);
          const k = age / life;
          if (k >= 1) {
            done = true;
            if (d.s >= 1) {
              const tg = this.trackLayer.getContext('2d')!;
              tg.fillStyle = 'rgba(40,30,20,0.22)';
              tg.beginPath();
              tg.arc(d.x * this.scale, d.y * this.scale, 0.42 * this.scale * d.s, 0, Math.PI * 2);
              tg.fill();
            }
            break;
          }
          const ease = 1 - (1 - k) ** 3;
          g.globalAlpha = 1 - k;
          g.fillStyle = '#ffcc80';
          g.beginPath();
          g.arc(d.x, d.y, (0.3 + ease * 0.8) * d.s, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ff8a65';
          g.beginPath();
          g.arc(d.x, d.y, (0.2 + ease * 0.5) * d.s, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.arc(d.x, d.y, Math.max(0, 0.22 * (1 - k * 1.6)) * d.s, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 'kill': {
          const t = this.lastSeen.get(d.s);
          if (t) this.burst(t.x, t.y, this.colorOf(d.s), 14, 3.4, 0.08, now);
          done = true;
          break;
        }
        case 'shot': {
          // Mündungsblitz am nächstgelegenen Panzer
          const t = tanks.reduce<TankView | null>((best, x) => (!best || Math.hypot(x.x - d.x, x.y - d.y) < Math.hypot(best.x - d.x, best.y - d.y) ? x : best), null);
          const k = age / 120;
          if (k >= 1 || !t) {
            done = true;
            break;
          }
          const mx = t.x + Math.cos(t.a) * 0.55;
          const my = t.y + Math.sin(t.a) * 0.55;
          g.globalAlpha = 1 - k;
          g.fillStyle = '#fff59d';
          g.beginPath();
          g.arc(mx, my, 0.16 + k * 0.1, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.arc(mx, my, 0.08, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 'laser': {
          const k = age / 420;
          if (k >= 1) {
            done = true;
            break;
          }
          if (age < 20 && !(e as Effect & { spawned?: boolean }).spawned) {
            (e as Effect & { spawned?: boolean }).spawned = true;
            for (let i = 2; i < d.p.length - 2; i += 2) this.burst(d.p[i]!, d.p[i + 1]!, TANK_COLORS[d.c]?.hex ?? '#ff5252', 6, 2, 0.05, now);
          }
          const color = TANK_COLORS[d.c]?.hex ?? '#ff5252';
          g.globalAlpha = 1 - k;
          for (const [w, c] of [
            [0.42, alpha(color, 0.35)],
            [0.2, color],
            [0.07, '#ffffff'],
          ] as const) {
            g.strokeStyle = c;
            g.lineWidth = w * (1 - k * 0.4);
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
          g.fillStyle = alpha(p.color, 0.3);
          g.beginPath();
          g.arc(d.x, d.y, 0.3 + k * 0.7, 0, Math.PI * 2);
          g.fill();
          this.pill(g, p.name, d.x, d.y - 0.6 - k * 0.5, p.color);
          g.globalAlpha = 1;
          break;
        }
        case 'pop': {
          const k = age / 380;
          if (k >= 1) {
            done = true;
            break;
          }
          if (age < 20 && !(e as Effect & { spawned?: boolean }).spawned) {
            (e as Effect & { spawned?: boolean }).spawned = true;
            this.burst(d.x, d.y, '#64b5f6', 12, 2.6, 0.07, now);
          }
          g.globalAlpha = 1 - k;
          g.fillStyle = 'rgba(100,181,246,0.35)';
          g.beginPath();
          g.arc(d.x, d.y, 0.5 + k * 0.5, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
          break;
        }
        case 'honk': {
          const k = age / 1000;
          const t = tanks.find((x) => x.slot === d.s);
          if (k >= 1) {
            done = true;
            break;
          }
          if (!t) break;
          const pop = Math.min(1, age / 120);
          g.save();
          g.translate(t.x + 0.3, t.y - 0.72);
          g.scale(pop, pop);
          g.fillStyle = 'rgba(0,0,0,0.15)';
          g.beginPath();
          g.roundRect(-0.52, -0.2, 1.04, 0.44, 0.22);
          g.fill();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.roundRect(-0.52, -0.24, 1.04, 0.44, 0.22);
          g.fill();
          g.beginPath();
          g.moveTo(-0.2, 0.18);
          g.lineTo(-0.32, 0.36);
          g.lineTo(-0.02, 0.18);
          g.fill();
          g.fillStyle = '#3c4043';
          g.font = '900 0.26px Roboto, Arial, sans-serif';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText('TÖÖT!', 0, -0.01);
          g.restore();
          break;
        }
        default:
          done = true;
      }
      if (!done) alive.push(e);
    }
    this.effects = alive;
  }

  /** flaches Etikett (z. B. Power-up-Name) */
  private pill(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
    g.font = '900 0.3px Roboto, Arial, sans-serif';
    const w = g.measureText(text).width + 0.3;
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(x - w / 2, y - 0.2, w, 0.4, 0.2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x, y + 0.01);
  }
}
