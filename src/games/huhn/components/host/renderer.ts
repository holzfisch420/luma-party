/**
 * Hühnerjagd-Renderer: ein gemeinsames Level, das nach rechts scrollt. Das Level wird aus
 * demselben Seed erzeugt wie auf dem Server; Positionen kommen mit 20 Hz und werden interpoliert.
 */
import { CHICKEN_COLORS, PHYS } from '../../game-config';
import { COP_H, generateLevel, inRange, MID_THICK, WORLD_H, type Level } from '../../logic/level';
import { getMap, type HuhnMap } from '../../maps';
import type { HuhnFrame } from '../../types';
import { drawCage, drawChicken, drawCop, drawFar, drawNear, POLICE } from './draw';
import { huhnSounds } from './sounds';

interface Feather {
  wx: number;
  wy: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  born: number;
  color: string;
}

interface Popup {
  text: string;
  color: string;
  born: number;
}

const DELAY_MS = 110;
const S = PHYS.size;
/** Hühner werden etwas größer gezeichnet als ihr Kollisionskasten */
const DRAW_SCALE = 1.05;

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class ChaseRenderer {
  private g: CanvasRenderingContext2D;
  private raf = 0;
  private frames: { f: HuhnFrame; at: number }[] = [];
  private offset: number | null = null;
  private map: HuhnMap = getMap('hof');
  private level: Level | null = null;
  private levelKey = '';
  private names = new Map<number, string>();
  private winnerSlot = -1;
  private caughtAt = new Map<number, number>();
  private feathers: Feather[] = [];
  private popups: Popup[] = [];
  private startPerf = performance.now();
  private lastY = new Map<number, number>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')!;
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  /** neue Runde: Level aus dem Seed erzeugen */
  setRound(mapId: string, seed: number) {
    const key = `${mapId}:${seed}`;
    if (key === this.levelKey) return;
    this.levelKey = key;
    this.map = getMap(mapId);
    this.level = generateLevel(this.map, seed);
    this.frames = [];
    this.caughtAt.clear();
    this.feathers = [];
    this.popups = [];
    this.winnerSlot = -1;
  }

  setNames(names: Map<number, string>) {
    this.names = names;
  }

  setWinner(slot: number) {
    this.winnerSlot = slot;
  }

  private time() {
    return (performance.now() - this.startPerf) / 1000;
  }

  pushFrame(f: HuhnFrame) {
    const now = performance.now();
    const off = now - f.t;
    this.offset = this.offset === null ? off : Math.min(off, this.offset * 0.98 + off * 0.02);
    this.frames.push({ f, at: now });
    if (this.frames.length > 30) this.frames.shift();
    for (const fx of f.fx) {
      const ch = f.c.find((c) => c[0] === fx.s);
      if (fx.t === 'flip') huhnSounds.flip(ch?.[3] === -1);
      else if (fx.t === 'bump') huhnSounds.bump();
      else if (fx.t === 'out') {
        const name = this.names.get(fx.s) ?? 'Huhn';
        const color = CHICKEN_COLORS[fx.s]?.body ?? '#fff';
        if (fx.why === 'fell') {
          huhnSounds.fall();
          this.popups.push({ text: `${name} ist abgestürzt!`, color, born: this.time() });
        } else {
          huhnSounds.caught();
          this.caughtAt.set(fx.s, this.time());
          this.popups.push({ text: fx.why === 'police' ? `${name} wurde abgehängt – geschnappt!` : `${name} lief der Polizei in die Arme!`, color, born: this.time() });
          if (ch) this.spawnFeathers(ch[1] + S / 2, ch[2] + S / 2, color);
        }
      }
    }
    // Polizei nah dran → Martinshorn
    if (f.c.some((c) => c[4] === 1 && c[1] - f.cx < 2.6)) huhnSounds.siren();
  }

  private spawnFeathers(wx: number, wy: number, color: string) {
    for (let i = 0; i < 16; i++)
      this.feathers.push({ wx, wy, vx: (Math.random() - 0.5) * 5, vy: -2 - Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, born: this.time(), color });
  }

  /** interpolierter Zustand zur Darstellungszeit */
  private sample() {
    if (this.frames.length === 0) return null;
    const target = performance.now() - (this.offset ?? 0) - DELAY_MS;
    let a = this.frames[0]!.f;
    let b = a;
    for (const { f } of this.frames) {
      if (f.t <= target) a = f;
      b = f;
      if (f.t >= target) break;
    }
    const k = b.t === a.t ? 1 : Math.max(0, Math.min(1, (target - a.t) / (b.t - a.t)));
    const lerp = (x: number, y: number) => x + (y - x) * k;
    const chickens = b.c.map((cb) => {
      const ca = a.c.find((c) => c[0] === cb[0]) ?? cb;
      return { slot: cb[0], x: lerp(ca[1], cb[1]), y: lerp(ca[2], cb[2]), g: cb[3] as 1 | -1, alive: cb[4] === 1 };
    });
    return { cx: lerp(a.cx, b.cx), v: lerp(a.v, b.v), chickens };
  }

  private draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
      this.canvas.width = Math.round(cw * dpr);
      this.canvas.height = Math.round(ch * dpr);
    }
    const g = this.g;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = this.time();
    const theme = this.map.theme;
    const state = this.sample();
    const cam = state?.cx ?? 0;
    // Welt 0 … WORLD_H passt in die Höhe
    const u = ch / WORLD_H;
    const viewW = cw / u;
    const sx = (wx: number) => (wx - cam) * u;

    // Himmel
    const sky = g.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(1, theme.skyBottom);
    g.fillStyle = sky;
    g.fillRect(0, 0, cw, ch);
    if (theme.night)
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.abs(Math.sin(t * 1.5 + i))})`;
        g.fillRect((((hash(i) * cw - cam * u * 0.03) % cw) + cw) % cw, hash(i + 77) * ch * 0.8, 2, 2);
      }

    // Kulisse (Parallaxe) hinter der Mitte
    const base = 6.6 * u;
    const farShift = cam * u * 0.15;
    const seg = 2.4 * u;
    for (let i = Math.floor(farShift / seg) - 1, n = i + Math.ceil(cw / seg) + 3; i < n; i++) drawFar(g, theme, i * seg - farShift, base, seg, u, hash(i), ch * 0.6);
    const nearShift = cam * u * 0.35;
    const seg2 = 3.4 * u;
    for (let i = Math.floor(nearShift / seg2) - 1, n = i + Math.ceil(cw / seg2) + 3; i < n; i++) drawNear(g, theme, i * seg2 - nearShift, base, u, hash(i + 999), t);

    // Plattformen
    if (this.level) {
      const a = cam - 2;
      const b = cam + viewW + 2;
      for (const p of inRange(this.level.floor, a, b)) this.drawBlock(sx(p.x0), p.y * u, sx(p.x1) - sx(p.x0), ch - p.y * u + 4, u, 'top');
      for (const p of inRange(this.level.ceil, a, b)) this.drawBlock(sx(p.x0), -4, sx(p.x1) - sx(p.x0), p.y * u + 4, u, 'bottom');
      for (const p of inRange(this.level.mid, a, b)) this.drawBlock(sx(p.x0), p.y * u, sx(p.x1) - sx(p.x0), MID_THICK * u, u, 'both');
      const copU = u * (COP_H / 1.15);
      for (const cop of this.level.cops) {
        if (cop.x < a - 1) continue;
        if (cop.x > b) break;
        if (cop.side === 'floor') drawCop(g, sx(cop.x) - 0.05 * u, cop.y * u, copU, t, Math.round(cop.x));
        else {
          g.save();
          g.translate(0, cop.y * u);
          g.scale(1, -1);
          drawCop(g, sx(cop.x) - 0.05 * u, 0, copU, t, Math.round(cop.x));
          g.restore();
        }
      }
    }

    // Polizei-Verfolger links
    this.drawChase(g, u, ch, t);

    // Hühner
    if (state)
      for (const c of state.chickens) {
        const color = CHICKEN_COLORS[c.slot] ?? CHICKEN_COLORS[0];
        const px = sx(c.x + S / 2);
        if (px < -2 * u || px > cw + 2 * u) continue;
        if (c.y > WORLD_H + 1 || c.y < -2) continue;
        const prev = this.lastY.get(c.slot) ?? c.y;
        this.lastY.set(c.slot, c.y);
        const moving = Math.abs(c.y - prev) > 0.004;
        const feet = c.g === 1 ? (c.y + S) * u : c.y * u;
        const winner = this.winnerSlot === c.slot;
        g.save();
        g.translate(px, feet);
        if (c.g === -1) g.scale(1, -1);
        drawChicken(g, 0, 0, u * DRAW_SCALE, 0, color, t, {
          alive: c.alive || winner,
          holding: moving,
          speed: state.v,
          winner,
          caughtAt: c.alive || winner ? undefined : this.caughtAt.get(c.slot) ?? t,
        });
        if (!c.alive && !winner && this.caughtAt.has(c.slot)) drawCage(g, 0, 0, u * DRAW_SCALE);
        g.restore();
        // Namensschild
        const name = this.names.get(c.slot);
        if (name && (c.alive || winner)) {
          const fs = Math.max(12, u * 0.24);
          g.font = `900 ${fs}px Nunito, sans-serif`;
          const tw = g.measureText(name).width + fs * 0.9;
          const ly = c.g === 1 ? c.y * u - fs * 1.7 : (c.y + S) * u + fs * 0.45;
          g.fillStyle = 'rgba(17,24,39,0.7)';
          g.beginPath();
          g.roundRect(px - tw / 2, ly, tw, fs * 1.3, fs * 0.65);
          g.fill();
          g.fillStyle = color.body;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(name, px, ly + fs * 0.68);
          g.textBaseline = 'alphabetic';
        }
      }

    // Federn
    for (const f of this.feathers) {
      const age = t - f.born;
      g.save();
      g.globalAlpha = Math.max(0, 1 - age / 1.6);
      g.translate(sx(f.wx + f.vx * age), (f.wy + f.vy * age + 3 * age * age) * u);
      g.rotate(f.rot + f.vr * age);
      g.beginPath();
      g.ellipse(0, 0, 0.11 * u, 0.04 * u, 0, 0, Math.PI * 2);
      g.fillStyle = f.color;
      g.fill();
      g.restore();
    }
    this.feathers = this.feathers.filter((f) => t - f.born < 1.8);

    if (theme.night) {
      g.fillStyle = 'rgba(5,10,30,0.15)';
      g.fillRect(0, 0, cw, ch);
    }

    // Meldungen
    this.popups = this.popups.filter((p) => t - p.born < 2.6);
    this.popups.forEach((p, i) => {
      const age = t - p.born;
      const fs = Math.max(16, u * 0.3);
      g.save();
      g.globalAlpha = Math.max(0, Math.min(1, (2.6 - age) * 2, age * 6));
      g.font = `900 ${fs}px Nunito, sans-serif`;
      const tw = g.measureText(p.text).width + fs * 1.8;
      const y = fs * 0.6 + i * fs * 1.7;
      g.fillStyle = 'rgba(17,24,39,0.82)';
      g.beginPath();
      g.roundRect(cw / 2 - tw / 2, y, tw, fs * 1.45, fs * 0.72);
      g.fill();
      g.beginPath();
      g.arc(cw / 2 - tw / 2 + fs * 0.75, y + fs * 0.72, fs * 0.36, 0, Math.PI * 2);
      g.fillStyle = p.color;
      g.fill();
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(p.text, cw / 2 + fs * 0.3, y + fs * 0.76);
      g.restore();
    });
  }

  /** Plattform: Körper + farbige Oberfläche auf der begehbaren Seite */
  private drawBlock(x: number, y: number, w: number, h: number, u: number, surface: 'top' | 'bottom' | 'both') {
    const g = this.g;
    const th = this.map.theme;
    const r = Math.min(0.16 * u, w / 2);
    g.fillStyle = th.block;
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
    // Ziegel-/Erdmuster nahe der Oberfläche
    g.fillStyle = 'rgba(0,0,0,0.12)';
    const bw = 0.9 * u;
    const bh = 0.45 * u;
    const rows = Math.max(1, Math.floor(Math.min(h, 3.5 * u) / bh) - 1);
    for (let row = 0; row < rows; row++) {
      const yy = surface === 'bottom' ? y + h - (row + 1) * bh - 0.22 * u : y + row * bh + 0.26 * u;
      const off = row % 2 ? bw / 2 : 0;
      for (let xx = x + off; xx < x + w - bw * 0.4; xx += bw) g.fillRect(xx + 3, yy, Math.min(bw - 6, x + w - xx - 6), bh - 5);
    }
    // Oberfläche
    const sh = 0.2 * u;
    g.fillStyle = th.surface;
    if (surface === 'top' || surface === 'both') {
      g.beginPath();
      g.roundRect(x, y, w, sh, [r, r, 3, 3]);
      g.fill();
    }
    if (surface === 'bottom' || surface === 'both') {
      g.beginPath();
      g.roundRect(x, y + h - sh, w, sh, [3, 3, r, r]);
      g.fill();
    }
  }

  /** Polizei-Helikopter am linken Rand mit Blaulicht und Suchscheinwerfer */
  private drawChase(g: CanvasRenderingContext2D, u: number, ch: number, t: number) {
    const on = Math.floor(t * 5) % 2 === 0;
    const band = g.createLinearGradient(0, 0, 1.4 * u, 0);
    band.addColorStop(0, on ? 'rgba(59,130,246,0.55)' : 'rgba(239,68,68,0.45)');
    band.addColorStop(1, 'rgba(59,130,246,0)');
    g.fillStyle = band;
    g.fillRect(0, 0, 1.4 * u, ch);
    const hx = 0.9 * u;
    const hy = (WORLD_H / 2 + Math.sin(t * 1.3) * 0.6) * u;
    // Suchscheinwerfer
    g.save();
    g.translate(hx, hy);
    g.rotate(Math.sin(t * 0.9) * 0.45);
    const beam = g.createLinearGradient(0, 0, 6 * u, 0);
    beam.addColorStop(0, 'rgba(254,249,195,0.45)');
    beam.addColorStop(1, 'rgba(254,249,195,0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(0.2 * u, 0);
    g.lineTo(6 * u, -1.6 * u);
    g.lineTo(6 * u, 1.6 * u);
    g.closePath();
    g.fill();
    g.restore();
    // Rumpf
    g.fillStyle = POLICE.NAVY;
    g.beginPath();
    g.ellipse(hx, hy, 0.42 * u, 0.2 * u, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(hx - 1.0 * u, hy - 0.05 * u, 0.65 * u, 0.08 * u);
    g.fillStyle = '#93c5fd';
    g.beginPath();
    g.ellipse(hx + 0.18 * u, hy - 0.03 * u, 0.15 * u, 0.11 * u, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f1f5f9';
    g.fillRect(hx - 0.25 * u, hy + 0.06 * u, 0.42 * u, 0.06 * u);
    g.fillStyle = on ? '#3b82f6' : '#ef4444';
    g.fillRect(hx - 0.05 * u, hy - 0.27 * u, 0.12 * u, 0.07 * u);
    const rw = Math.abs(Math.cos(t * 40)) * 0.75 * u + 0.05 * u;
    g.fillStyle = '#1f2937';
    g.fillRect(hx - rw, hy - 0.33 * u, rw * 2, 0.04 * u);
    g.fillStyle = '#fff';
    g.font = `900 ${0.13 * u}px Nunito, sans-serif`;
    g.textAlign = 'center';
    g.fillText('POLIZEI', hx - 0.1 * u, hy + 0.16 * u);
  }
}
