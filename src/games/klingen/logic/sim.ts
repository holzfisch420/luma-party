/**
 * Simulation eines Rads (normale Stufe oder Boss) – Schritt für Schritt.
 * Handy, Fernseher (Deko) und der Test-Bot nutzen dieselbe Logik.
 */
import { TIMING } from '../game-config';
import { BOSSES, type BossDef } from './bosses';
import { angleDist, MIN_GAP, mulberry32, norm, type Stage } from './wheel';

const TAU = Math.PI * 2;
/** Welt-Winkel der Aufprallstelle (unten) */
const IMPACT = Math.PI / 2;
/** Bonus-Stern wird eingesammelt, wenn ein Messer so nah trifft */
export const STAR_RANGE = 0.17;

export type Outcome = 'stick' | 'knife' | 'shield' | 'moon' | 'tentacle';

export interface SimKnife {
  /** aktuelle Position im Rad */
  a: number;
  /** Ruheposition (für pendelnde Messer) */
  base: number;
  color: string;
  fixed?: boolean;
}

export class WheelSim {
  t = 0;
  angle = 0;
  knives: SimKnife[];
  stars: number[];
  readonly def: BossDef | null;
  private flips: number[] = [];

  constructor(readonly stage: Stage) {
    this.def = stage.boss ? BOSSES[stage.boss] : null;
    this.knives = stage.obstacles.map((a) => ({ a, base: a, color: '#5b6170', fixed: true }));
    this.stars = [...stage.stars];
    if (this.def?.spin === 'jitter') {
      // zufällige, aber feste Zeitpunkte für Richtungswechsel
      const rnd = mulberry32(stage.seed);
      let t = 0;
      while (t < 600) {
        t += 0.55 + rnd() * 1.1;
        this.flips.push(t);
      }
    }
  }

  clone(): WheelSim {
    const c = Object.create(WheelSim.prototype) as WheelSim;
    Object.assign(c, this);
    c.knives = this.knives.map((k) => ({ ...k }));
    c.stars = [...this.stars];
    return c;
  }

  /** Anzahl der vom Spieler geworfenen Messer */
  get thrown(): number {
    return this.knives.filter((k) => !k.fixed).length;
  }

  /** Winkelgeschwindigkeit (rad/s) */
  omega(): number {
    const { spin } = this.stage;
    const d = this.def;
    const t = this.t;
    const dir = Math.sign(spin.base) || 1;
    let w: number;
    switch (d?.spin) {
      case 'stopgo': {
        // 0,8 s Pause, 1,1 s Vollgas
        const c = t % 1.9;
        w = c < 0.8 ? 0 : spin.base * 2.3;
        break;
      }
      case 'tick': {
        // alle 0,55 s ein Sprung um 30° (wie ein Sekundenzeiger)
        const c = t % (0.55 / this.stage.power);
        const jump = 0.13;
        w = c < jump ? (dir * (Math.PI / 6)) / jump : 0;
        break;
      }
      case 'jitter': {
        let flipsBefore = 0;
        for (const f of this.flips) {
          if (f > t) break;
          flipsBefore++;
        }
        w = spin.base * (flipsBefore % 2 === 0 ? 1 : -1.25);
        break;
      }
      case 'pulse':
        w = spin.base * (1 + 0.85 * Math.sin(t * 2.2));
        break;
      default:
        w = spin.base + spin.amp * Math.sin(spin.freq * t + spin.phase);
    }
    if (d?.speedUp) w *= 1 + d.speedUp * this.thrown;
    return w;
  }

  step(dt: number) {
    this.t += dt;
    this.angle += this.omega() * dt;
    if (this.def?.wobble) {
      const amp = this.def.wobble;
      this.knives.forEach((k, i) => {
        k.a = k.base + amp * Math.sin(this.t * 0.9 + i * 1.7) * (i % 2 ? 1 : -1);
      });
    }
  }

  /** Größe (Sonne pulsiert) */
  radiusScale(): number {
    return this.def?.spin === 'pulse' ? 1 + 0.09 * Math.sin(this.t * 2.2) : 1;
  }

  /** Sichtbarkeit (Geist) */
  alpha(): number {
    if (!this.def?.ghost) return 1;
    const c = this.t % 3.4;
    if (c < 1.8) return 1;
    if (c < 2.2) return 1 - ((c - 1.8) / 0.4) * 0.94;
    if (c < 2.9) return 0.06;
    return 0.06 + ((c - 2.9) / 0.5) * 0.94;
  }

  /** Schilde: Mitte (Welt-Winkel) und halbe Breite */
  shields(): { c: number; half: number }[] {
    const s = this.def?.shields;
    if (!s) return [];
    return Array.from({ length: s.count }, (_, i) => ({ c: norm(this.t * s.speed * this.stage.power + (i * TAU) / s.count), half: s.half }));
  }

  /** Monde: Welt-Winkel ihrer Umlaufbahn */
  moons(): number[] {
    const m = this.def?.moons;
    if (!m) return [];
    return Array.from({ length: m.count }, (_, i) => norm(this.t * m.speed * this.stage.power + (i * TAU) / m.count + 0.7));
  }

  /** Fangarm: 0 = weg, 1 = blockiert die Wurfbahn */
  tentacle(): number {
    const tt = this.def?.tentacle;
    if (!tt) return 0;
    const c = this.t % tt.period;
    if (c < tt.from - 0.35 || c > tt.to + 0.25) return 0;
    if (c < tt.from) return (c - (tt.from - 0.35)) / 0.35;
    if (c > tt.to) return 1 - (c - tt.to) / 0.25;
    return 1;
  }

  /** Warnung kurz bevor der Fangarm kommt */
  tentacleWarning(): boolean {
    const tt = this.def?.tentacle;
    if (!tt) return false;
    const c = this.t % tt.period;
    return c > tt.from - 0.9 && c < tt.from - 0.35;
  }

  /** Position im Rad, an der ein Messer jetzt einschlagen würde */
  impactLocal(): number {
    return norm(IMPACT - this.angle);
  }

  /** Ergebnis eines Wurfs, der jetzt ankommt (`midFlight` = Zustand auf halber Flugstrecke) */
  outcome(midFlight?: WheelSim): Outcome {
    // Hindernisse auf der Flugbahn
    const mid = midFlight ?? this;
    if (mid.moons().some((m) => angleDist(m, IMPACT) < 0.3)) return 'moon';
    if (this.tentacle() > 0.6 || mid.tentacle() > 0.6) return 'tentacle';
    if (this.shields().some((s) => angleDist(s.c, IMPACT) < s.half)) return 'shield';
    const local = this.impactLocal();
    if (this.knives.some((k) => angleDist(k.a, local) < MIN_GAP)) return 'knife';
    return 'stick';
  }

  /** Messer steckt – gibt zurück, ob ein Stern eingesammelt wurde */
  stick(color: string): boolean {
    const local = this.impactLocal();
    this.knives.push({ a: local, base: local, color });
    const i = this.stars.findIndex((s) => angleDist(s, local) < STAR_RANGE);
    if (i >= 0) {
      this.stars.splice(i, 1);
      return true;
    }
    return false;
  }

  /** Vorschau: Ergebnis, wenn jetzt geworfen würde (für Bot und Tests) */
  predict(): Outcome {
    const flight = TIMING.flightMs / 1000;
    const mid = this.clone();
    stepFor(mid, flight / 2);
    const end = mid.clone();
    stepFor(end, flight / 2);
    return end.outcome(mid);
  }
}

/** in kleinen Schritten vorspulen (Mechaniken hängen von der Zeit ab) */
export function stepFor(sim: WheelSim, seconds: number, dt = 1 / 120) {
  let left = seconds;
  while (left > 1e-9) {
    const d = Math.min(dt, left);
    sim.step(d);
    left -= d;
  }
}
