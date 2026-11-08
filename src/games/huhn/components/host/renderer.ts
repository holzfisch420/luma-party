/**
 * Hühnerjagd-Renderer: eine Spur pro Huhn, untereinander. Positionen kommen mit 20 Hz vom
 * Server und werden flüssig interpoliert.
 */
import { CHICKEN_COLORS } from '../../game-config';
import { getMap, OBSTACLE_KINDS, OBSTACLES, type HuhnMap, type ObstacleKind } from '../../maps';
import type { HuhnFrame } from '../../types';
import { drawBackdrop, drawBarrier, drawCage, drawCar, drawChicken, drawCone, drawCop, drawDog, drawHeli } from './draw';
import { huhnSounds } from './sounds';

interface Feather {
  slot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  born: number;
  color: string;
}

export interface LaneLabel {
  name: string;
  score: number;
}

const DELAY_MS = 110;

export class ChaseRenderer {
  private g: CanvasRenderingContext2D;
  private raf = 0;
  private frames: { f: HuhnFrame; at: number }[] = [];
  private offset: number | null = null;
  private map: HuhnMap = getMap('hof');
  private slots: number[] = [];
  private labels = new Map<number, LaneLabel>();
  private winnerSlot = -1;
  private caughtAt = new Map<number, number>();
  private feathers: Feather[] = [];
  private seen = new Set<number>();
  private shake = new Map<number, number>();
  private startPerf = performance.now();

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

  setRound(mapId: string, slots: number[]) {
    this.map = getMap(mapId);
    this.slots = [...slots].sort((a, b) => a - b);
    this.frames = [];
    this.caughtAt.clear();
    this.feathers = [];
    this.seen.clear();
    this.winnerSlot = -1;
  }

  /** Strecke direkt aus dem öffentlichen Zustand (falls das Runden-Ereignis verpasst wurde) */
  setMap(mapId: string, slots: number[]) {
    this.map = getMap(mapId);
    if (slots.length) this.slots = [...slots].sort((a, b) => a - b);
  }

  setLabels(labels: Map<number, LaneLabel>) {
    this.labels = labels;
  }

  setWinner(slot: number) {
    this.winnerSlot = slot;
  }

  pushFrame(f: HuhnFrame) {
    const now = performance.now();
    const off = now - f.t;
    this.offset = this.offset === null ? off : Math.min(off, this.offset * 0.98 + off * 0.02);
    this.frames.push({ f, at: now });
    if (this.frames.length > 30) this.frames.shift();
    for (const fx of f.fx) {
      if (fx.t === 'jump') huhnSounds.jump();
      else if (fx.t === 'caught') {
        huhnSounds.caught();
        this.caughtAt.set(fx.s, this.time());
        this.shake.set(fx.s, now);
        this.spawnFeathers(fx.s, f.c.find((c) => c[0] === fx.s)?.[1] ?? 0);
      }
    }
    if (this.slots.length === 0) this.slots = f.c.map((c) => c[0]).sort((a, b) => a - b);
  }

  private time() {
    return (performance.now() - this.startPerf) / 1000;
  }

  private spawnFeathers(slot: number, y: number) {
    const color = CHICKEN_COLORS[slot]?.body ?? '#fff';
    for (let i = 0; i < 14; i++) {
      this.feathers.push({ slot, x: 0, y: y + 0.4, vx: (Math.random() - 0.3) * 4, vy: 1.5 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, born: this.time(), color });
    }
  }

  /** interpolierter Zustand zur Darstellungszeit */
  private sample() {
    if (this.frames.length === 0) return null;
    const target = performance.now() - (this.offset ?? 0) - DELAY_MS;
    let a = this.frames[0]!.f;
    let b = a;
    for (let i = 0; i < this.frames.length; i++) {
      const f = this.frames[i]!.f;
      if (f.t <= target) a = f;
      if (f.t >= target) {
        b = f;
        break;
      }
      b = f;
    }
    const k = b.t === a.t ? 1 : Math.max(0, Math.min(1, (target - a.t) / (b.t - a.t)));
    const lerp = (x: number, y: number) => x + (y - x) * k;
    const chickens = new Map<number, { y: number; alive: boolean; holding: boolean }>();
    for (const cb of b.c) {
      const ca = a.c.find((c) => c[0] === cb[0]) ?? cb;
      chickens.set(cb[0], { y: Math.max(0, lerp(ca[1], cb[1])), alive: cb[2] === 1, holding: cb[3] === 1 });
    }
    const aObs = new Map(a.o.map((o) => [o[0], o]));
    const obstacles: { id: number; slot: number; kind: ObstacleKind; x: number }[] = [];
    for (const ob of b.o) {
      const oa = aObs.get(ob[0]);
      const kind = OBSTACLE_KINDS[ob[2]]!;
      // ohne Vorgänger extrapolieren statt springen
      const x = oa ? lerp(oa[3], ob[3]) : ob[3] + (1 - k) * ((b.v + OBSTACLES[kind].extra) * (b.t - a.t)) / 1000;
      obstacles.push({ id: ob[0], slot: ob[1], kind, x });
    }
    return { d: lerp(a.d, b.d), v: lerp(a.v, b.v), chickens, obstacles };
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
    g.clearRect(0, 0, cw, ch);
    const state = this.sample();
    const slots = this.slots.length ? this.slots : [0];
    const n = slots.length;
    const laneH = ch / n;
    const u = Math.min(laneH / 2.55, cw / 15);
    const cx = Math.max(2.4 * u, 110);
    const viewUnits = (cw - cx) / u;
    const t = this.time();
    const theme = this.map.theme;
    const d = state?.d ?? 0;
    const v = state?.v ?? 0;

    // Sound, sobald ein Hindernis ins Bild kommt
    if (state)
      for (const o of state.obstacles) {
        if (this.seen.has(o.id) || o.x > viewUnits) continue;
        this.seen.add(o.id);
        if (o.kind === 'car') huhnSounds.siren();
        else if (o.kind === 'dog') huhnSounds.bark();
        else if (o.kind === 'heli') huhnSounds.heli();
        else if (o.kind === 'cop' && Math.random() < 0.35) huhnSounds.copWhistle();
      }

    const later: (() => void)[] = [];
    slots.forEach((slot, i) => {
      const top = i * laneH;
      const shakeAt = this.shake.get(slot);
      const shakeK = shakeAt ? Math.max(0, 1 - (performance.now() - shakeAt) / 350) : 0;
      g.save();
      g.beginPath();
      g.rect(0, top, cw, laneH);
      g.clip();
      if (shakeK > 0) g.translate((Math.random() - 0.5) * 10 * shakeK, (Math.random() - 0.5) * 6 * shakeK);
      // jede Spur etwas versetzt, damit nicht alle Kulissen identisch aussehen
      const gy = top + laneH - 0.42 * u;
      drawBackdrop(g, theme, 0, top, cw, laneH, gy, u, d + slot * 7.3, t);

      const chick = state?.chickens.get(slot);
      // Hindernisse dieser Spur
      if (state)
        for (const o of state.obstacles) {
          if (o.slot !== slot) continue;
          const ox = cx + o.x * u;
          if (ox > cw + 2.5 * u || ox < -3 * u) continue;
          switch (o.kind) {
            case 'cone':
              drawCone(g, ox, gy, u);
              break;
            case 'barrier':
              drawBarrier(g, ox, gy, u);
              break;
            case 'cop':
              drawCop(g, ox, gy, u, t, o.id);
              break;
            case 'dog':
              drawDog(g, ox, gy, u, t, o.id);
              break;
            case 'car':
              drawCar(g, ox, gy, u, t, !!theme.night);
              break;
            case 'heli':
              drawHeli(g, ox, gy, u, t, OBSTACLES.heli.y0, top);
              break;
          }
        }

      const color = CHICKEN_COLORS[slot] ?? CHICKEN_COLORS[0];
      // Huhn wird später ohne Zuschnitt gezeichnet (darf beim Springen in die Spur darüber ragen)
      if (chick) later.push(() => {
        drawChicken(g, cx, gy, u, chick.y, color, t, {
          alive: chick.alive,
          holding: chick.holding,
          speed: v,
          winner: this.winnerSlot === slot,
          caughtAt: chick.alive ? undefined : this.caughtAt.get(slot) ?? t,
        });
        if (!chick.alive) drawCage(g, cx, gy, u);
      });

      // Federn
      later.push(() => {
      for (const f of this.feathers) {
        if (f.slot !== slot) continue;
        const age = t - f.born;
        const fx = cx + (f.x + f.vx * age) * u;
        const fy = gy - (f.y + f.vy * age - 2.5 * age * age) * u;
        g.save();
        g.globalAlpha = Math.max(0, 1 - age / 1.6);
        g.translate(fx, fy);
        g.rotate(f.rot + f.vr * age);
        g.beginPath();
        g.ellipse(0, 0, 0.09 * u, 0.035 * u, 0, 0, Math.PI * 2);
        g.fillStyle = f.color;
        g.fill();
        g.restore();
      }
      });

      // Nachtfilter
      if (theme.night) {
        g.fillStyle = 'rgba(5,10,30,0.18)';
        g.fillRect(0, top, cw, laneH);
      }
      // geschnappte Spur abdunkeln
      if (chick && !chick.alive) {
        g.fillStyle = 'rgba(15,23,42,0.35)';
        g.fillRect(0, top, cw, laneH);
      }

      // Namensschild
      const label = this.labels.get(slot);
      if (label) {
        const fs = Math.max(13, Math.min(26, laneH * 0.16));
        g.font = `900 ${fs}px Nunito, sans-serif`;
        const text = `${label.name}  ${label.score}`;
        const tw = g.measureText(text).width;
        const px = 12;
        const py = top + 8;
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.beginPath();
        g.roundRect(px, py, tw + fs * 1.6, fs * 1.5, fs * 0.75);
        g.fill();
        g.beginPath();
        g.arc(px + fs * 0.75, py + fs * 0.75, fs * 0.42, 0, Math.PI * 2);
        g.fillStyle = color.body;
        g.fill();
        g.fillStyle = '#fff';
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        g.fillText(text, px + fs * 1.35, py + fs * 0.78);
        g.textBaseline = 'alphabetic';
        if (chick && !chick.alive) {
          g.font = `900 ${fs * 1.4}px Nunito, sans-serif`;
          g.fillStyle = '#fca5a5';
          g.textAlign = 'center';
          g.fillText('GESCHNAPPT!', cx + 2.2 * u, top + laneH * 0.45);
        }
      }
      g.restore();
      // Trennlinie
      if (i > 0) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(0, top - 2, cw, 4);
      }
    });

    for (const fn of later) fn();
    this.feathers = this.feathers.filter((f) => t - f.born < 1.8);
  }
}
