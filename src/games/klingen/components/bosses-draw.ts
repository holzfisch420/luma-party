/**
 * Aussehen und Animationen der 15 Bosse.
 * body:    unbewegliche Scheibe (wird einmal vorgezeichnet und nur gedreht)
 * overlay: bewegte Teile, die sich mit dem Rad drehen (Augen, Glut …)
 * front:   Teile in Bildschirmrichtung (Schilde, Monde, Fangarm, Dunkelheit …)
 */
import type { BossId } from '../logic/bosses';
import type { WheelSim } from '../logic/sim';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function circle(g: G, x: number, y: number, r: number, fill: string | CanvasGradient) {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}
function ring(g: G, r: number, w: number, color: string) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.stroke();
}
function radial(g: G, r: number, inner: string, outer: string, ox = -0.25, oy = -0.3) {
  const gr = g.createRadialGradient(r * ox, r * oy, r * 0.1, 0, 0, r);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  return gr;
}
/** deterministische Pseudozufallszahlen fürs Zeichnen */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 9301 + 49297) % 233280;
    return a / 233280;
  };
}
function eye(g: G, x: number, y: number, r: number, open = 1, pupil = '#1b1b1b', white = '#ffffff') {
  g.save();
  g.translate(x, y);
  g.scale(1, Math.max(0.08, open));
  circle(g, 0, 0, r, white);
  circle(g, r * 0.15, r * 0.1, r * 0.55, pupil);
  circle(g, r * 0.35, -r * 0.2, r * 0.18, '#ffffff');
  g.restore();
}
/** Blinzeln: alle paar Sekunden kurz zu */
const blink = (t: number, every = 3.3) => {
  const c = t % every;
  return c < 0.12 ? 1 - c / 0.12 : c < 0.24 ? (c - 0.12) / 0.12 : 1;
};

export interface BossArt {
  body: (g: G, r: number) => void;
  overlay?: (g: G, r: number, sim: WheelSim) => void;
  front?: (g: G, cx: number, cy: number, r: number, sim: WheelSim) => void;
  /** Farbe für Splitter */
  chips: string[];
}

export const BOSS_ART: Record<BossId, BossArt> = {
  // 1 ─ Käse: Löcher, Rinde, verschmitztes Gesicht
  kaese: {
    chips: ['#ffd85a', '#f2b84b', '#fff1b0'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#fff1b0', '#f2b84b'));
      ring(g, r * 0.95, r * 0.08, '#d99a2b');
      const rnd = prng(3);
      for (let i = 0; i < 13; i++) {
        const a = rnd() * TAU;
        const d = r * (0.25 + rnd() * 0.6);
        circle(g, Math.cos(a) * d, Math.sin(a) * d, r * (0.04 + rnd() * 0.07), 'rgba(200,130,30,0.5)');
      }
    },
    overlay: (g, r, sim) => {
      const o = blink(sim.t);
      eye(g, -r * 0.22, -r * 0.08, r * 0.11, o);
      eye(g, r * 0.22, -r * 0.08, r * 0.11, o);
      g.strokeStyle = '#7a4a10';
      g.lineWidth = r * 0.04;
      g.beginPath();
      g.arc(0, r * 0.1, r * 0.18, 0.2, Math.PI - 0.2);
      g.stroke();
    },
  },
  // 2 ─ Pizza: Rand, Soße, Salami, Basilikum; dampft beim Stillstand
  pizza: {
    chips: ['#e8a33d', '#c0392b', '#ffe08a'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#f6c46b', '#c98a2e'));
      circle(g, 0, 0, r * 0.84, '#c8331f');
      const rnd = prng(8);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * TAU;
        const d = rnd() * r * 0.7;
        circle(g, Math.cos(a) * d, Math.sin(a) * d, r * (0.08 + rnd() * 0.06), 'rgba(255,224,140,0.85)');
      }
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.3;
        const d = r * (i % 2 ? 0.55 : 0.32);
        circle(g, Math.cos(a) * d, Math.sin(a) * d, r * 0.11, '#9e1f1f');
        circle(g, Math.cos(a) * d - r * 0.03, Math.sin(a) * d - r * 0.03, r * 0.04, 'rgba(255,255,255,0.25)');
      }
      g.fillStyle = '#2f8f3a';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 1;
        g.save();
        g.translate(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45);
        g.rotate(a);
        g.beginPath();
        g.ellipse(0, 0, r * 0.08, r * 0.04, 0, 0, TAU);
        g.fill();
        g.restore();
      }
    },
    front: (g, cx, cy, r, sim) => {
      if (Math.abs(sim.omega()) > 0.1) return;
      g.save();
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = r * 0.035;
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const x = cx + (i - 1) * r * 0.35;
        const ph = sim.t * 4 + i;
        g.beginPath();
        g.moveTo(x, cy - r * 1.02);
        g.bezierCurveTo(x + Math.sin(ph) * r * 0.12, cy - r * 1.2, x - Math.sin(ph) * r * 0.12, cy - r * 1.3, x, cy - r * 1.45);
        g.stroke();
      }
      g.restore();
    },
  },
  // 3 ─ Kuckucksuhr: Zifferblatt, Zeiger, Vogel springt bei jedem 4. Tick heraus
  uhr: {
    chips: ['#8b5a2b', '#f6efdc', '#2a241c'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#b07a45', '#6b3f1d'));
      circle(g, 0, 0, r * 0.82, '#f6efdc');
      g.strokeStyle = '#2a241c';
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU;
        const big = i % 5 === 0;
        g.lineWidth = big ? r * 0.03 : r * 0.012;
        g.beginPath();
        g.moveTo(Math.cos(a) * r * (big ? 0.64 : 0.72), Math.sin(a) * r * (big ? 0.64 : 0.72));
        g.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
        g.stroke();
      }
      g.fillStyle = '#2a241c';
      g.font = `900 ${r * 0.16}px Georgia, serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * TAU - Math.PI / 2;
        g.fillText(String(i), Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      }
    },
    overlay: (g, r, sim) => {
      // Zeiger laufen (zusätzlich zur Drehung) schnell
      g.strokeStyle = '#2a241c';
      g.lineCap = 'round';
      g.lineWidth = r * 0.06;
      const h = sim.t * 0.5;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(h) * r * 0.3, Math.sin(h) * r * 0.3);
      g.stroke();
      g.lineWidth = r * 0.035;
      const m = sim.t * 3;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(m) * r * 0.45, Math.sin(m) * r * 0.45);
      g.stroke();
      circle(g, 0, 0, r * 0.06, '#c9973b');
    },
    front: (g, cx, cy, r, sim) => {
      // Häuschen oben mit Kuckuck
      const top = cy - r * 1.08;
      g.save();
      g.fillStyle = '#6b3f1d';
      g.beginPath();
      g.moveTo(cx - r * 0.32, top);
      g.lineTo(cx, top - r * 0.3);
      g.lineTo(cx + r * 0.32, top);
      g.closePath();
      g.fill();
      g.fillStyle = '#2a1a0c';
      g.fillRect(cx - r * 0.12, top - r * 0.14, r * 0.24, r * 0.14);
      const c = sim.t % 2.2;
      const out = c < 0.5 ? Math.sin((c / 0.5) * Math.PI) : 0;
      if (out > 0.02) {
        const bx = cx;
        const by = top - r * 0.07 - out * r * 0.18;
        circle(g, bx, by, r * 0.09, '#e8b84a');
        circle(g, bx + r * 0.03, by - r * 0.02, r * 0.02, '#1b1b1b');
        g.fillStyle = '#e8590c';
        g.beginPath();
        g.moveTo(bx + r * 0.08, by);
        g.lineTo(bx + r * 0.17, by + r * 0.02);
        g.lineTo(bx + r * 0.08, by + r * 0.04);
        g.fill();
      }
      g.restore();
    },
  },
  // 4 ─ Igel: stacheliges Fell, Gesicht in der Mitte
  igel: {
    chips: ['#6b4a2b', '#3b2a1a', '#c9a27a'],
    body: (g, r) => {
      g.fillStyle = '#3b2a1a';
      g.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * TAU;
        const rr = i % 2 ? r : r * 0.86;
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.fill();
      circle(g, 0, 0, r * 0.8, radial(g, r * 0.8, '#8a6440', '#4d3420'));
      g.strokeStyle = 'rgba(30,20,10,0.5)';
      g.lineWidth = r * 0.015;
      const rnd = prng(4);
      for (let i = 0; i < 70; i++) {
        const a = rnd() * TAU;
        const d = r * (0.5 + rnd() * 0.28);
        g.beginPath();
        g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
        g.lineTo(Math.cos(a) * (d + r * 0.08), Math.sin(a) * (d + r * 0.08));
        g.stroke();
      }
      circle(g, 0, 0, r * 0.42, '#e3c49c');
      circle(g, 0, r * 0.12, r * 0.08, '#1b1b1b');
    },
    overlay: (g, r, sim) => {
      const o = blink(sim.t, 2.6);
      eye(g, -r * 0.15, -r * 0.1, r * 0.08, o);
      eye(g, r * 0.15, -r * 0.1, r * 0.08, o);
    },
  },
  // 5 ─ Panzerkröte: Schildpanzer, Steinschilde drehen gegenläufig
  kroete: {
    chips: ['#4a8a3a', '#2f5a24', '#c9b27a'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#7fbf5a', '#2f5a24'));
      g.strokeStyle = '#c9b27a';
      g.lineWidth = r * 0.035;
      for (let ring2 = 0; ring2 < 2; ring2++) {
        const rr = r * (0.3 + ring2 * 0.33);
        const n = 6 + ring2 * 6;
        g.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * TAU;
          g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.stroke();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          g.beginPath();
          g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          g.lineTo(Math.cos(a) * (rr + r * 0.33), Math.sin(a) * (rr + r * 0.33));
          g.stroke();
        }
      }
    },
    front: (g, cx, cy, r, sim) => {
      for (const s of sim.shields()) {
        g.save();
        g.lineCap = 'round';
        g.strokeStyle = '#8d939c';
        g.lineWidth = r * 0.18;
        g.beginPath();
        g.arc(cx, cy, r * 1.02, s.c - s.half, s.c + s.half);
        g.stroke();
        g.strokeStyle = '#b8bec6';
        g.lineWidth = r * 0.06;
        g.beginPath();
        g.arc(cx, cy, r * 1.06, s.c - s.half * 0.9, s.c + s.half * 0.9);
        g.stroke();
        g.restore();
      }
    },
  },
  // 6 ─ Saturn: Streifen, Ring, kreisende Monde
  saturn: {
    chips: ['#e8a86b', '#c97b3f', '#f6dcb0'],
    body: (g, r) => {
      g.save();
      g.beginPath();
      g.arc(0, 0, r, 0, TAU);
      g.clip();
      const cols = ['#f6dcb0', '#e8a86b', '#c97b3f', '#f0c890', '#b5652e', '#e8a86b', '#f6dcb0'];
      cols.forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(-r, -r + (i * 2 * r) / cols.length, 2 * r, (2 * r) / cols.length + 1);
      });
      g.restore();
      circle(g, 0, 0, r, radial(g, r, 'rgba(255,255,255,0.25)', 'rgba(0,0,0,0.3)'));
    },
    front: (g, cx, cy, r, sim) => {
      // Ring (fest, schräg)
      g.save();
      g.strokeStyle = 'rgba(240,210,160,0.85)';
      g.lineWidth = r * 0.07;
      g.beginPath();
      g.ellipse(cx, cy, r * 1.55, r * 0.32, -0.25, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      g.restore();
      // Monde auf einer Bahn, die unten die Wurfbahn kreuzt
      for (const m of sim.moons()) {
        const mx = cx + Math.cos(m) * r * 1.38;
        const my = cy + Math.sin(m) * r * 1.38;
        circle(g, mx, my, r * 0.17, '#cfd4dc');
        circle(g, mx - r * 0.05, my - r * 0.04, r * 0.04, '#9aa1ab');
        circle(g, mx + r * 0.06, my + r * 0.05, r * 0.03, '#9aa1ab');
      }
    },
  },
  // 7 ─ Geist: Tuch mit Gesicht, verblasst
  geist: {
    chips: ['#e6ecff', '#b9c4ff', '#ffffff'],
    body: (g, r) => {
      g.fillStyle = '#eef2ff';
      g.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * TAU;
        const rr = r * (0.95 + 0.05 * Math.sin(a * 9));
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.fill();
      circle(g, 0, 0, r * 0.9, radial(g, r * 0.9, '#ffffff', '#c7d0ff'));
    },
    overlay: (g, r, sim) => {
      const o = blink(sim.t, 2.2);
      g.save();
      g.scale(1, Math.max(0.1, o));
      circle(g, -r * 0.22, -r * 0.12, r * 0.12, '#1b1b2e');
      circle(g, r * 0.22, -r * 0.12, r * 0.12, '#1b1b2e');
      g.restore();
      g.fillStyle = '#1b1b2e';
      g.beginPath();
      g.ellipse(0, r * 0.2, r * 0.1, r * (0.12 + 0.04 * Math.sin(sim.t * 5)), 0, 0, TAU);
      g.fill();
    },
    front: (g, cx, cy, r, sim) => {
      if (sim.alpha() > 0.3) return;
      g.save();
      g.globalAlpha = 0.8;
      g.fillStyle = '#eef2ff';
      g.font = `900 ${r * 0.4}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.fillText('BUH!', cx + Math.sin(sim.t * 6) * r * 0.1, cy - r * 1.15);
      g.restore();
    },
  },
  // 8 ─ Kürbis: Rillen, geschnitztes Gesicht, glüht mit jedem Messer stärker
  kuerbis: {
    chips: ['#ff8c1a', '#d9600b', '#ffd36b'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#ffb24d', '#c4540a'));
      g.strokeStyle = 'rgba(140,50,0,0.45)';
      g.lineWidth = r * 0.03;
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.ellipse(0, 0, r * (0.15 + i * 0.1), r * 0.98, 0, 0, TAU);
        g.stroke();
      }
    },
    overlay: (g, r, sim) => {
      const rage = Math.min(1, sim.thrown / 8);
      const glow = `rgba(255,${Math.round(220 - rage * 120)},60,${0.75 + rage * 0.25})`;
      g.fillStyle = '#3a1800';
      // Augen (Dreiecke)
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(s * r * 0.12, -r * 0.05);
        g.lineTo(s * r * 0.4, -r * (0.05 + rage * 0.1));
        g.lineTo(s * r * 0.28, -r * 0.32);
        g.closePath();
        g.fill();
        g.save();
        g.fillStyle = glow;
        g.globalAlpha = 0.7 + 0.3 * Math.sin(sim.t * 8);
        g.fill();
        g.restore();
      }
      // Zackenmund
      g.beginPath();
      g.moveTo(-r * 0.45, r * 0.15);
      for (let i = 0; i <= 8; i++) g.lineTo(-r * 0.45 + (i * r * 0.9) / 8, r * (0.15 + (i % 2 ? 0.12 : 0) + rage * 0.05));
      g.lineTo(r * 0.45, r * 0.15);
      for (let i = 8; i >= 0; i--) g.lineTo(-r * 0.45 + (i * r * 0.9) / 8, r * (0.42 + (i % 2 ? -0.1 : 0)));
      g.closePath();
      g.fillStyle = glow;
      g.fill();
    },
  },
  // 9 ─ Sonne: Strahlen, Korona pulsiert
  sonne: {
    chips: ['#ffd23f', '#ff9f1c', '#fff3b0'],
    body: (g, r) => {
      g.fillStyle = '#ff9f1c';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        g.beginPath();
        g.moveTo(Math.cos(a - 0.14) * r * 0.75, Math.sin(a - 0.14) * r * 0.75);
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        g.lineTo(Math.cos(a + 0.14) * r * 0.75, Math.sin(a + 0.14) * r * 0.75);
        g.fill();
      }
      circle(g, 0, 0, r * 0.78, radial(g, r * 0.78, '#fff7c2', '#ffbf1f'));
    },
    overlay: (g, r, sim) => {
      eye(g, -r * 0.22, -r * 0.1, r * 0.1, blink(sim.t));
      eye(g, r * 0.22, -r * 0.1, r * 0.1, blink(sim.t));
      g.strokeStyle = '#b3541e';
      g.lineWidth = r * 0.04;
      g.beginPath();
      g.arc(0, r * 0.08, r * 0.22, 0.25, Math.PI - 0.25);
      g.stroke();
    },
    front: (g, cx, cy, r, sim) => {
      const k = 0.5 + 0.5 * Math.sin(sim.t * 2.2);
      const gr = g.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.5);
      gr.addColorStop(0, `rgba(255,210,80,${0.25 + k * 0.25})`);
      gr.addColorStop(1, 'rgba(255,210,80,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(cx, cy, r * 1.5, 0, TAU);
      g.fill();
    },
  },
  // 10 ─ Bombe: schwarz glänzend, Lunte mit Funken, Countdown in der Mitte
  bombe: {
    chips: ['#2b2b2b', '#5a5a5a', '#ffb02e'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#5a5f6b', '#121317'));
      circle(g, -r * 0.35, -r * 0.4, r * 0.18, 'rgba(255,255,255,0.25)');
      ring(g, r * 0.6, r * 0.04, 'rgba(255,255,255,0.08)');
    },
    front: (g, cx, cy, r, sim) => {
      // Kappe und Lunte oben (zeigt nach oben, dreht nicht mit)
      g.save();
      g.fillStyle = '#8d939c';
      g.fillRect(cx - r * 0.16, cy - r * 1.08, r * 0.32, r * 0.16);
      g.strokeStyle = '#c9a27a';
      g.lineWidth = r * 0.05;
      g.beginPath();
      g.moveTo(cx, cy - r * 1.08);
      g.quadraticCurveTo(cx + r * 0.25, cy - r * 1.3, cx + r * 0.1, cy - r * 1.45);
      g.stroke();
      const sx = cx + r * 0.1;
      const sy = cy - r * 1.45;
      for (let i = 0; i < 6; i++) {
        const a = sim.t * 13 + i;
        circle(g, sx + Math.cos(a) * r * 0.08 * Math.random(), sy + Math.sin(a) * r * 0.08 * Math.random(), r * 0.035, i % 2 ? '#ffd23f' : '#ff6b1a');
      }
      g.restore();
    },
  },
  // 11 ─ Krake: Kopf mit Saugnäpfen, Fangarm schlägt vor die Wurfbahn
  krake: {
    chips: ['#a05acb', '#7b3fa3', '#f0c8ff'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#d08cf0', '#6a2f91'));
      const rnd = prng(11);
      for (let i = 0; i < 16; i++) {
        const a = rnd() * TAU;
        const d = r * (0.35 + rnd() * 0.5);
        circle(g, Math.cos(a) * d, Math.sin(a) * d, r * (0.04 + rnd() * 0.05), 'rgba(255,200,255,0.4)');
      }
    },
    overlay: (g, r, sim) => {
      eye(g, -r * 0.2, 0, r * 0.13, blink(sim.t, 2.9), '#1b1b1b', '#fff7c2');
      eye(g, r * 0.2, 0, r * 0.13, blink(sim.t, 2.9), '#1b1b1b', '#fff7c2');
    },
    front: (g, cx, cy, r, sim) => {
      const k = sim.tentacle();
      const warn = sim.tentacleWarning();
      // Fangarm kommt von rechts und legt sich unter das Rad
      const baseX = cx + r * 1.9;
      const baseY = cy + r * 0.6;
      const tipX = cx + r * 1.9 - k * r * 2.6 + (warn ? Math.sin(sim.t * 40) * r * 0.05 : 0);
      const tipY = cy + r * (1.15 + (1 - k) * 0.4);
      g.save();
      g.strokeStyle = '#8a45b5';
      g.lineCap = 'round';
      g.lineWidth = r * 0.24;
      g.beginPath();
      g.moveTo(baseX, baseY);
      g.quadraticCurveTo(cx + r * 1.2, cy + r * 1.6, tipX, tipY);
      g.stroke();
      g.strokeStyle = '#f0c8ff';
      g.lineWidth = r * 0.05;
      g.setLineDash([r * 0.06, r * 0.12]);
      g.beginPath();
      g.moveTo(baseX, baseY + r * 0.08);
      g.quadraticCurveTo(cx + r * 1.2, cy + r * 1.7, tipX, tipY + r * 0.08);
      g.stroke();
      g.restore();
      if (warn) {
        g.save();
        g.fillStyle = '#ffd23f';
        g.font = `900 ${r * 0.3}px system-ui, sans-serif`;
        g.textAlign = 'center';
        g.fillText('!', cx + r * 1.5, cy + r * 0.5);
        g.restore();
      }
    },
  },
  // 12 ─ Magnet: rot/blau, N/S, Funken
  magnet: {
    chips: ['#d63031', '#0984e3', '#dfe6e9'],
    body: (g, r) => {
      g.save();
      g.beginPath();
      g.arc(0, 0, r, 0, TAU);
      g.clip();
      g.fillStyle = '#d63031';
      g.fillRect(-r, -r, 2 * r, r);
      g.fillStyle = '#0984e3';
      g.fillRect(-r, 0, 2 * r, r);
      g.restore();
      ring(g, r * 0.95, r * 0.08, '#dfe6e9');
      circle(g, 0, 0, r * 0.3, '#dfe6e9');
      g.fillStyle = '#ffffff';
      g.font = `900 ${r * 0.32}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('N', 0, -r * 0.58);
      g.fillText('S', 0, r * 0.58);
    },
    front: (g, cx, cy, r, sim) => {
      g.save();
      g.strokeStyle = '#a5f3ff';
      g.lineWidth = r * 0.025;
      for (let i = 0; i < 3; i++) {
        if (Math.sin(sim.t * 7 + i * 2.1) < 0.6) continue;
        const a = sim.t * 2 + i * 2.1;
        let x = cx + Math.cos(a) * r * 1.02;
        let y = cy + Math.sin(a) * r * 1.02;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += Math.cos(a) * r * 0.08 + (Math.random() - 0.5) * r * 0.12;
          y += Math.sin(a) * r * 0.08 + (Math.random() - 0.5) * r * 0.12;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    },
  },
  // 13 ─ Mond: Krater, Dunkelheit mit Lichtkegel unten
  mond: {
    chips: ['#cfd4dc', '#9aa1ab', '#f1f3f6'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#f1f3f6', '#8a919b'));
      const rnd = prng(13);
      for (let i = 0; i < 11; i++) {
        const a = rnd() * TAU;
        const d = r * rnd() * 0.75;
        const cr = r * (0.06 + rnd() * 0.1);
        circle(g, Math.cos(a) * d, Math.sin(a) * d, cr, 'rgba(90,96,105,0.35)');
        circle(g, Math.cos(a) * d - cr * 0.2, Math.sin(a) * d - cr * 0.2, cr * 0.7, 'rgba(255,255,255,0.12)');
      }
    },
    front: (g, cx, cy, r, sim) => {
      // Dunkelheit – nur unten ein Lichtkegel
      const lx = cx;
      const ly = cy + r * 0.95;
      const gr = g.createRadialGradient(lx, ly, r * 0.2, lx, ly, r * (0.85 + 0.08 * Math.sin(sim.t * 3)));
      gr.addColorStop(0, 'rgba(5,8,20,0)');
      gr.addColorStop(1, 'rgba(5,8,20,0.96)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(cx, cy, r * 1.6, 0, TAU);
      g.fill();
    },
  },
  // 14 ─ Donut: Glasur, Streusel, Loch
  donut: {
    chips: ['#ff8fc7', '#d89a5b', '#ffe066'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#f0c08a', '#b97a3e'));
      g.fillStyle = '#ff8fc7';
      g.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * TAU;
        const rr = r * (0.84 + 0.05 * Math.sin(a * 7));
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.fill();
      const cols = ['#ffffff', '#ffe066', '#6bd5ff', '#7ee081', '#b583ff'];
      const rnd = prng(14);
      for (let i = 0; i < 36; i++) {
        const a = rnd() * TAU;
        const d = r * (0.38 + rnd() * 0.4);
        g.save();
        g.translate(Math.cos(a) * d, Math.sin(a) * d);
        g.rotate(rnd() * TAU);
        g.fillStyle = cols[i % cols.length]!;
        g.fillRect(-r * 0.04, -r * 0.012, r * 0.08, r * 0.024);
        g.restore();
      }
      circle(g, 0, 0, r * 0.26, '#5a2e12');
      circle(g, 0, 0, r * 0.2, '#2b1608');
    },
  },
  // 15 ─ Drache: Schuppen, Reptilienauge, Feuerschild
  drache: {
    chips: ['#c0392b', '#7b1f15', '#ffb02e'],
    body: (g, r) => {
      circle(g, 0, 0, r, radial(g, r, '#e0553f', '#6d1a12'));
      g.fillStyle = 'rgba(60,10,5,0.35)';
      for (let ringI = 1; ringI <= 4; ringI++) {
        const rr = r * (0.28 + ringI * 0.16);
        const n = 8 + ringI * 5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + (ringI % 2 ? 0.2 : 0);
          g.beginPath();
          g.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.07, 0, Math.PI);
          g.fill();
        }
      }
      circle(g, 0, 0, r * 0.3, '#ffd23f');
    },
    overlay: (g, r, sim) => {
      const o = blink(sim.t, 3.8);
      g.save();
      g.scale(1, Math.max(0.08, o));
      circle(g, 0, 0, r * 0.26, radial(g, r * 0.26, '#fff3a0', '#e8a00c'));
      g.fillStyle = '#1b0b05';
      g.beginPath();
      g.ellipse(0, 0, r * 0.05 + Math.abs(Math.sin(sim.t)) * r * 0.03, r * 0.22, 0, 0, TAU);
      g.fill();
      g.restore();
    },
    front: (g, cx, cy, r, sim) => {
      for (const s of sim.shields()) {
        g.save();
        g.lineCap = 'round';
        const flick = 0.85 + 0.15 * Math.sin(sim.t * 20);
        g.strokeStyle = `rgba(255,140,30,${flick})`;
        g.lineWidth = r * 0.2;
        g.beginPath();
        g.arc(cx, cy, r * 1.03, s.c - s.half, s.c + s.half);
        g.stroke();
        g.strokeStyle = 'rgba(255,230,120,0.9)';
        g.lineWidth = r * 0.07;
        g.beginPath();
        g.arc(cx, cy, r * 1.03, s.c - s.half * 0.8, s.c + s.half * 0.8);
        g.stroke();
        g.restore();
      }
    },
  },
};
