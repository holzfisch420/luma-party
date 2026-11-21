/**
 * Aussehen der 16 Messer. Jedes wird in lokalen Koordinaten gemalt:
 * Spitze bei (0, 0), Griffende bei (len, 0), Breite entlang y.
 * (teuer – draw.ts zeichnet jedes Messer nur einmal vor und benutzt dann das Bild)
 */
import { OBSTACLE_SKIN } from '../logic/knives';

type G = CanvasRenderingContext2D;

const steel = (g: G, w: number, a = '#f4f7fb', b = '#c3ccd8', c = '#8e9aab') => {
  const gr = g.createLinearGradient(0, -w, 0, w);
  gr.addColorStop(0, a);
  gr.addColorStop(0.5, b);
  gr.addColorStop(1, c);
  return gr;
};

const outline = (g: G, len: number, col = 'rgba(30,36,52,0.45)') => {
  g.strokeStyle = col;
  g.lineWidth = Math.max(1, len * 0.014);
  g.lineJoin = 'round';
  g.stroke();
};

function handle(g: G, x: number, len: number, w: number, color: string, opts: { wrap?: string; pommel?: string } = {}) {
  const hl = len - x;
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, -w * 0.8, hl, w * 1.6, w * 0.75);
  g.fill();
  if (opts.wrap) {
    g.strokeStyle = opts.wrap;
    g.lineWidth = Math.max(1, w * 0.28);
    for (let i = 1; i < 5; i++) {
      const xx = x + (hl * i) / 5;
      g.beginPath();
      g.moveTo(xx - w * 0.3, -w * 0.8);
      g.lineTo(xx + w * 0.3, w * 0.8);
      g.stroke();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.fillRect(x + hl * 0.1, -w * 0.52, hl * 0.78, w * 0.3);
  if (opts.pommel) {
    g.fillStyle = opts.pommel;
    g.beginPath();
    g.arc(len - w * 0.55, 0, w * 0.75, 0, Math.PI * 2);
    g.fill();
  }
}

function guard(g: G, x: number, len: number, w: number, color: string, spread = 1.3) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, -w * spread, len * 0.045, w * spread * 2, len * 0.012);
  g.fill();
}

/** `w` = halbe Klingenbreite – für alle Messer gleich, damit die Optik zur Trefferzone passt */
export const knifeHalfWidth = (len: number) => len * 0.085;

export function paintSkin(g: G, len: number, skin: number, accent?: string) {
  const w = knifeHalfWidth(len);
  switch (skin) {
    case OBSTACLE_SKIN: {
      // verrostetes Hindernis
      const blade = len * 0.56;
      g.fillStyle = steel(g, w, '#c9c2b8', '#9a8f80', '#6e6457');
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(blade * 0.35, -w * 1.05, blade, -w * 0.75);
      g.lineTo(blade, w * 0.75);
      g.lineTo(blade * 0.2, w * 0.35);
      g.closePath();
      g.fill();
      outline(g, len);
      g.fillStyle = 'rgba(140,70,30,0.45)';
      for (let i = 0; i < 4; i++) g.fillRect(blade * (0.3 + i * 0.15), -w * 0.4 + (i % 2) * w * 0.3, w * 0.5, w * 0.35);
      guard(g, blade - len * 0.02, len, w, '#3a3f4a');
      handle(g, blade + len * 0.03, len, w, '#4b4f5a');
      break;
    }
    case 0: {
      // Klassiker
      const blade = len * 0.56;
      g.fillStyle = steel(g, w);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(blade * 0.35, -w * 1.05, blade, -w * 0.8);
      g.lineTo(blade, w * 0.8);
      g.lineTo(blade * 0.2, w * 0.35);
      g.closePath();
      g.fill();
      outline(g, len);
      guard(g, blade - len * 0.02, len, w, '#3a3f4a');
      handle(g, blade + len * 0.03, len, w, '#c0392b', { pommel: '#3a3f4a' });
      break;
    }
    case 1: {
      // Hackebeil: breite, eckige Klinge
      const blade = len * 0.55;
      g.fillStyle = steel(g, w * 1.6, '#eef2f6', '#b4bdc9', '#7d8796');
      g.beginPath();
      g.moveTo(0, -w * 0.2);
      g.lineTo(0, w * 1.5);
      g.lineTo(blade, w * 1.3);
      g.lineTo(blade, -w * 0.8);
      g.closePath();
      g.fill();
      outline(g, len);
      g.fillStyle = '#2b2f38';
      g.beginPath();
      g.arc(blade * 0.18, w * 0.85, w * 0.28, 0, Math.PI * 2);
      g.fill();
      handle(g, blade, len, w * 0.9, '#2b2f38', { pommel: '#8e9aab' });
      break;
    }
    case 2: {
      // goldener Dolch: zweischneidig, Rubin
      const blade = len * 0.55;
      g.fillStyle = steel(g, w, '#fff6d6', '#f2c14e', '#b8860b');
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(blade, -w * 0.9);
      g.lineTo(blade, w * 0.9);
      g.closePath();
      g.fill();
      outline(g, len, 'rgba(110,70,0,0.6)');
      g.strokeStyle = 'rgba(120,80,0,0.5)';
      g.lineWidth = Math.max(1, len * 0.01);
      g.beginPath();
      g.moveTo(blade * 0.1, 0);
      g.lineTo(blade, 0);
      g.stroke();
      guard(g, blade - len * 0.02, len, w, '#d4a017', 1.7);
      handle(g, blade + len * 0.03, len, w * 0.85, '#6b1d2a', { wrap: '#d4a017', pommel: '#e03131' });
      break;
    }
    case 3: {
      // Katana: lang, leicht gebogen, Tsuba
      const blade = len * 0.66;
      g.fillStyle = steel(g, w, '#ffffff', '#d5dde8', '#9aa6b8');
      g.beginPath();
      g.moveTo(0, -w * 0.2);
      g.quadraticCurveTo(blade * 0.5, -w * 1.4, blade, -w * 0.65);
      g.lineTo(blade, w * 0.55);
      g.quadraticCurveTo(blade * 0.5, -w * 0.2, 0, -w * 0.2);
      g.closePath();
      g.fill();
      outline(g, len);
      g.fillStyle = '#2b2b2b';
      g.beginPath();
      g.ellipse(blade + len * 0.012, 0, len * 0.02, w * 1.4, 0, 0, Math.PI * 2);
      g.fill();
      handle(g, blade + len * 0.03, len, w * 0.75, '#1d1d1d', { wrap: '#e8e1cf' });
      break;
    }
    case 4: {
      // Kunai: Rautenklinge, Ring am Ende
      const blade = len * 0.45;
      g.fillStyle = steel(g, w * 1.2, '#d9dde3', '#7d8590', '#4a515b');
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(blade * 0.6, -w * 1.25);
      g.lineTo(blade, -w * 0.3);
      g.lineTo(blade, w * 0.3);
      g.lineTo(blade * 0.6, w * 1.25);
      g.closePath();
      g.fill();
      outline(g, len);
      handle(g, blade, len - w * 1.6, w * 0.55, '#3b2f2f', { wrap: '#8b0000' });
      g.strokeStyle = '#5a626d';
      g.lineWidth = Math.max(1.5, w * 0.35);
      g.beginPath();
      g.arc(len - w * 0.9, 0, w * 0.7, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case 5: {
      // Jägermesser: Spitze mit Rückenschwung, Holzgriff
      const blade = len * 0.55;
      g.fillStyle = steel(g, w);
      g.beginPath();
      g.moveTo(0, -w * 0.2);
      g.lineTo(blade * 0.3, -w * 0.9);
      g.lineTo(blade, -w * 0.85);
      g.lineTo(blade, w * 0.95);
      g.quadraticCurveTo(blade * 0.3, w * 1.1, 0, -w * 0.2);
      g.closePath();
      g.fill();
      outline(g, len);
      g.strokeStyle = 'rgba(80,90,110,0.5)';
      g.lineWidth = Math.max(1, len * 0.01);
      g.beginPath();
      g.moveTo(blade * 0.35, -w * 0.35);
      g.lineTo(blade * 0.95, -w * 0.35);
      g.stroke();
      guard(g, blade - len * 0.02, len, w, '#8a6d3b', 1.4);
      handle(g, blade + len * 0.03, len, w, '#7a4a22', { pommel: '#8a6d3b' });
      g.fillStyle = '#e8d5b0';
      g.beginPath();
      g.arc(blade + (len - blade) * 0.35, 0, w * 0.18, 0, Math.PI * 2);
      g.arc(blade + (len - blade) * 0.65, 0, w * 0.18, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 6: {
      // Krummsäbel
      const blade = len * 0.6;
      g.fillStyle = steel(g, w * 1.3, '#f8fafc', '#c7d0dc', '#8592a5');
      g.beginPath();
      g.moveTo(0, w * 0.9);
      g.quadraticCurveTo(blade * 0.35, -w * 1.6, blade, -w * 0.7);
      g.lineTo(blade, w * 0.6);
      g.quadraticCurveTo(blade * 0.45, -w * 0.1, 0, w * 0.9);
      g.closePath();
      g.fill();
      outline(g, len);
      guard(g, blade - len * 0.02, len, w, '#c9a227', 1.6);
      handle(g, blade + len * 0.03, len, w * 0.85, '#0f5132', { wrap: '#c9a227', pommel: '#c9a227' });
      break;
    }
    case 7: {
      // Eiszapfen
      const gr = g.createLinearGradient(0, 0, len, 0);
      gr.addColorStop(0, 'rgba(220,245,255,0.95)');
      gr.addColorStop(1, 'rgba(120,200,240,0.95)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.35, -w * 0.7);
      g.lineTo(len * 0.5, -w * 0.55);
      g.lineTo(len * 0.75, -w * 1.1);
      g.lineTo(len, -w * 1.2);
      g.lineTo(len, w * 1.2);
      g.lineTo(len * 0.7, w * 0.95);
      g.lineTo(len * 0.45, w * 0.7);
      g.closePath();
      g.fill();
      outline(g, len, 'rgba(40,110,160,0.6)');
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.fillRect(len * 0.3, -w * 0.35, len * 0.55, w * 0.22);
      break;
    }
    case 8: {
      // Karotte
      g.fillStyle = steel(g, w, '#ffb067', '#f97316', '#c2410c');
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.4, -w * 1.15, len * 0.72, -w * 1.15);
      g.lineTo(len * 0.72, w * 1.15);
      g.quadraticCurveTo(len * 0.4, w * 1.15, 0, 0);
      g.fill();
      outline(g, len, 'rgba(120,40,0,0.5)');
      g.strokeStyle = 'rgba(150,50,0,0.5)';
      g.lineWidth = Math.max(1, len * 0.012);
      for (const k of [0.25, 0.42, 0.58]) {
        g.beginPath();
        g.moveTo(len * k, -w * 0.5 * (k + 0.4));
        g.lineTo(len * (k + 0.05), -w * 0.1);
        g.stroke();
      }
      g.fillStyle = '#22a34a';
      for (const a of [-0.5, 0, 0.5]) {
        g.beginPath();
        g.ellipse(len * 0.86, a * w * 1.4, len * 0.14, w * 0.4, a * 0.6, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 9: {
      // Bleistift
      const tip = len * 0.16;
      const wood = len * 0.32;
      g.fillStyle = '#2b2b2b';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(tip * 0.45, -w * 0.4);
      g.lineTo(tip * 0.45, w * 0.4);
      g.closePath();
      g.fill();
      g.fillStyle = '#f5d6a8';
      g.beginPath();
      g.moveTo(tip * 0.45, -w * 0.4);
      g.lineTo(wood, -w);
      g.lineTo(wood, w);
      g.lineTo(tip * 0.45, w * 0.4);
      g.closePath();
      g.fill();
      g.fillStyle = '#ffd23f';
      g.fillRect(wood, -w, len * 0.48, w * 2);
      g.fillStyle = '#f0b400';
      g.fillRect(wood, -w * 0.33, len * 0.48, w * 0.66);
      g.fillStyle = '#b8bec8';
      g.fillRect(wood + len * 0.48, -w, len * 0.07, w * 2);
      g.fillStyle = '#ff8fab';
      g.beginPath();
      g.roundRect(wood + len * 0.55, -w, len - (wood + len * 0.55), w * 2, [0, w * 0.6, w * 0.6, 0]);
      g.fill();
      break;
    }
    case 10: {
      // Blitz
      g.fillStyle = '#ffe14d';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.3, -w * 1.1);
      g.lineTo(len * 0.36, -w * 0.1);
      g.lineTo(len * 0.62, -w * 1.25);
      g.lineTo(len * 0.66, -w * 0.15);
      g.lineTo(len, -w * 0.9);
      g.lineTo(len, w * 0.5);
      g.lineTo(len * 0.62, w * 1.05);
      g.lineTo(len * 0.58, w * 0.1);
      g.lineTo(len * 0.32, w * 1.0);
      g.lineTo(len * 0.28, w * 0.1);
      g.closePath();
      g.shadowColor = 'rgba(255,220,0,0.9)';
      g.shadowBlur = w * 1.2;
      g.fill();
      g.shadowColor = 'transparent';
      outline(g, len, 'rgba(160,90,0,0.7)');
      break;
    }
    case 11: {
      // Knochen
      const blade = len * 0.55;
      g.fillStyle = steel(g, w, '#fffaf0', '#efe3c8', '#cbb994');
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(blade * 0.4, -w * 1.1, blade, -w * 0.75);
      g.lineTo(blade, w * 0.75);
      g.quadraticCurveTo(blade * 0.4, w * 0.6, 0, 0);
      g.fill();
      outline(g, len, 'rgba(110,90,50,0.6)');
      g.fillStyle = '#f3ead6';
      g.fillRect(blade, -w * 0.45, len - blade - w * 0.9, w * 0.9);
      for (const s of [-1, 1]) {
        g.beginPath();
        g.arc(len - w * 0.75, s * w * 0.55, w * 0.6, 0, Math.PI * 2);
        g.arc(blade + w * 0.1, s * w * 0.55, w * 0.5, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 12: {
      // Zuckerstange
      g.save();
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.3, -w * 0.85);
      g.lineTo(len, -w * 0.85);
      g.lineTo(len, w * 0.85);
      g.lineTo(len * 0.3, w * 0.85);
      g.closePath();
      g.fillStyle = '#ffffff';
      g.fill();
      g.clip();
      g.fillStyle = '#e03131';
      for (let x = -w * 2; x < len + w * 2; x += w * 1.6) {
        g.beginPath();
        g.moveTo(x, -w);
        g.lineTo(x + w * 0.7, -w);
        g.lineTo(x + w * 1.4, w);
        g.lineTo(x + w * 0.7, w);
        g.closePath();
        g.fill();
      }
      g.restore();
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.3, -w * 0.85);
      g.lineTo(len, -w * 0.85);
      g.lineTo(len, w * 0.85);
      g.lineTo(len * 0.3, w * 0.85);
      g.closePath();
      outline(g, len, 'rgba(120,0,0,0.4)');
      break;
    }
    case 13: {
      // Schreibfeder
      g.fillStyle = '#1f2937';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.12, -w * 0.35);
      g.lineTo(len * 0.12, w * 0.35);
      g.closePath();
      g.fill();
      const gr = g.createLinearGradient(0, -w * 1.3, 0, w * 1.3);
      gr.addColorStop(0, '#e0e7ff');
      gr.addColorStop(1, '#8b5cf6');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(len * 0.12, 0);
      g.quadraticCurveTo(len * 0.45, -w * 1.5, len * 0.95, -w * 0.4);
      g.lineTo(len, 0);
      g.quadraticCurveTo(len * 0.5, w * 1.3, len * 0.12, 0);
      g.fill();
      outline(g, len, 'rgba(60,30,120,0.5)');
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.lineWidth = Math.max(1, len * 0.012);
      g.beginPath();
      g.moveTo(len * 0.12, 0);
      g.lineTo(len, 0);
      g.stroke();
      break;
    }
    case 14: {
      // Kristall
      const gr = g.createLinearGradient(0, -w, len, w);
      gr.addColorStop(0, '#f5d0fe');
      gr.addColorStop(0.5, '#c026d3');
      gr.addColorStop(1, '#6b21a8');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(len * 0.25, -w * 1.1);
      g.lineTo(len * 0.62, -w * 0.9);
      g.lineTo(len * 0.62, w * 0.9);
      g.lineTo(len * 0.25, w * 1.1);
      g.closePath();
      g.fill();
      outline(g, len, 'rgba(70,0,90,0.6)');
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath();
      g.moveTo(len * 0.06, -w * 0.1);
      g.lineTo(len * 0.25, -w * 0.9);
      g.lineTo(len * 0.4, -w * 0.2);
      g.closePath();
      g.fill();
      guard(g, len * 0.62, len, w, '#4c1d95', 1.3);
      handle(g, len * 0.66, len, w * 0.85, '#2e1065', { pommel: '#e879f9' });
      break;
    }
    case 15: {
      // Laserklinge
      const blade = len * 0.62;
      g.shadowColor = '#22d3ee';
      g.shadowBlur = w * 2;
      g.fillStyle = '#67e8f9';
      g.beginPath();
      g.roundRect(0, -w * 0.7, blade + w, w * 1.4, w * 0.7);
      g.fill();
      g.shadowColor = 'transparent';
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.roundRect(w * 0.3, -w * 0.3, blade, w * 0.6, w * 0.3);
      g.fill();
      g.fillStyle = '#4b5563';
      g.fillRect(blade, -w * 0.95, len - blade, w * 1.9);
      g.fillStyle = '#9ca3af';
      for (let i = 0; i < 4; i++) g.fillRect(blade + (len - blade) * (0.18 + i * 0.2), -w * 0.95, (len - blade) * 0.08, w * 1.9);
      g.fillStyle = '#ef4444';
      g.fillRect(blade + (len - blade) * 0.06, -w * 0.3, (len - blade) * 0.08, w * 0.6);
      break;
    }
  }
  // Spielerfarbe am Griffende (gemeinsames Rad: wer hat das Messer geworfen?)
  if (accent) {
    g.fillStyle = accent;
    g.strokeStyle = '#ffffff';
    g.lineWidth = Math.max(1, w * 0.3);
    g.beginPath();
    g.arc(len - w * 0.7, 0, w * 0.9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
}
