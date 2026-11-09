/**
 * 3D-Szene für Kurvenrausch (Three.js) – auf Leistung getrimmt:
 * - ein Renderer, mehrere Ansichten per Scissor (Splitscreen)
 * - Strecke, Banden, Tore und Pfeiler in EINER Geometrie mit Vertex-Farben
 * - Bäume/Felsen/Häuser als InstancedMesh (je ein Zeichenaufruf)
 * - kein Schatten, kein Antialiasing, Nebel begrenzt die Sichtweite, Auflösung passt sich der Bildrate an
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CAR_COLORS } from '../../game-config';
import { buildTrack, type BuiltTrack, type TrackDef } from '../../tracks';
import { CAR_FLAG, type CarFrame, type RacerFrame } from '../../types';

const DELAY_MS = 90;

export interface CarView {
  slot: number;
  x: number;
  y: number;
  z: number;
  h: number;
  kmh: number;
  si: number;
  flags: number;
}

export interface Viewport {
  slot: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Geometrie-Baukasten mit Vertex-Farben (nicht indiziert → harte Farbkanten) */
class GeoBuilder {
  pos: number[] = [];
  col: number[] = [];
  private c = new THREE.Color();
  quad(a: number[], b: number[], c: number[], d: number[], color: string | THREE.Color) {
    this.c.set(color);
    for (const p of [a, b, c, a, c, d]) {
      this.pos.push(p[0]!, p[1]!, p[2]!);
      this.col.push(this.c.r, this.c.g, this.c.b);
    }
  }
  box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, color: string) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], color); // oben
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], color);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], color);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    return g;
  }
}

function carGeometry(): { body: THREE.BufferGeometry; dark: THREE.BufferGeometry } {
  const body = mergeGeometries([
    new THREE.BoxGeometry(1.9, 0.55, 4.0).translate(0, 0.55, 0),
    new THREE.BoxGeometry(1.5, 0.5, 1.9).translate(0, 1.07, -0.25),
    new THREE.BoxGeometry(1.8, 0.12, 0.45).translate(0, 1.05, -1.85),
  ])!;
  const wheel = (x: number, z: number) => new THREE.BoxGeometry(0.42, 0.7, 0.7).translate(x, 0.35, z);
  const dark = mergeGeometries([
    wheel(-0.95, 1.25), wheel(0.95, 1.25), wheel(-0.95, -1.3), wheel(0.95, -1.3),
    new THREE.BoxGeometry(1.4, 0.38, 0.06).translate(0, 1.08, 0.72), // Frontscheibe
    new THREE.BoxGeometry(0.12, 0.35, 0.12).translate(-0.7, 0.88, -1.85),
    new THREE.BoxGeometry(0.12, 0.35, 0.12).translate(0.7, 0.88, -1.85),
  ])!;
  return { body, dark };
}

export class RaceScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private trackGroup = new THREE.Group();
  private cars = new Map<number, THREE.Group>();
  private cameras = new Map<number, THREE.PerspectiveCamera>();
  private shared = new THREE.PerspectiveCamera(70, 1, 1, 320);
  private camTarget = new Map<number, THREE.Vector3>();
  private frames: RacerFrame[] = [];
  private offset: number | null = null;
  private raf = 0;
  private lastT = performance.now();
  private frameAvg = 16;
  private slowFor = 0;
  private scale = 1;
  track: BuiltTrack | null = null;
  private trackId = '';
  views: Viewport[] = [];
  /** neuester interpolierter Stand je Auto (für HUD und Minikarte) */
  latest = new Map<number, CarView>();
  mode: 'split' | 'shared' = 'split';
  slots: number[] = [];
  leaderSlot = -1;
  private carGeo = carGeometry();
  private darkMat = new THREE.MeshLambertMaterial({ color: '#1f2430', flatShading: true });
  private shadowGeo = new THREE.PlaneGeometry(2.4, 4.6).rotateX(-Math.PI / 2);
  private shadowMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false });
  onFx?: (fx: RacerFrame['fx'][number]) => void;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly minimap?: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.setScissorTest(true);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#666a70', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.position.set(0.4, 1, 0.3);
    this.scene.add(sun);
    this.scene.add(this.trackGroup);
    const loop = () => {
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
    });
  }

  // ------------------------------------------------------------------ Strecke

  setTrack(def: TrackDef) {
    if (def.id === this.trackId) return;
    this.trackId = def.id;
    this.frames = [];
    for (const child of [...this.trackGroup.children]) {
      this.trackGroup.remove(child);
      (child as THREE.Mesh).geometry?.dispose();
    }
    const t = buildTrack(def);
    this.track = t;
    const th = def.theme;
    this.scene.background = new THREE.Color(th.sky);
    this.scene.fog = new THREE.Fog(th.fog, 70, 300);

    // Boden
    const groundY = th.scenery === 'sea' ? -2 : Math.min(0, ...Array.from(t.y)) - 0.6;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: th.ground }));
    ground.position.y = groundY;
    this.trackGroup.add(ground);

    const g = new GeoBuilder();
    const hw = t.halfWidth;
    const last = t.closed ? t.n : t.n - 1;
    const right = (i: number) => [-t.tz[i]!, t.tx[i]!];
    const P = (i: number, off: number, dy = 0) => {
      const [nx, nz] = right(i);
      return [t.x[i]! + nx * off, t.y[i]! + dy, t.z[i]! + nz * off];
    };
    const cps = new Set(t.checkpointIdx);
    const lanes = [-1, -0.5, 0, 0.5, 1];
    for (let i = 0; i < last; i++) {
      const j = (i + 1) % t.n;
      const isStart = Math.abs(i - t.startIdx) <= 2 || (t.closed && Math.abs(i - t.startIdx - t.n) <= 2);
      const isCp = cps.has(i) || cps.has(j);
      const band = Math.floor(i / 8) % 2;
      for (let l = 0; l < 4; l++) {
        let color: string = band ? th.road : th.roadAlt;
        if (t.boost[i]) color = Math.floor(i / 2) % 2 ? '#ff8c42' : '#ffd43b';
        if (isCp) color = '#ffd43b';
        if (isStart) color = (l + i) % 2 ? '#111111' : '#ffffff';
        g.quad(P(i, lanes[l]! * hw, 0.05), P(j, lanes[l]! * hw, 0.05), P(j, lanes[l + 1]! * hw, 0.05), P(i, lanes[l + 1]! * hw, 0.05), color);
      }
      // Mittellinie
      if (Math.floor(i / 4) % 2 === 0 && !t.boost[i] && !isStart && !isCp) g.quad(P(i, -0.12, 0.07), P(j, -0.12, 0.07), P(j, 0.12, 0.07), P(i, 0.12, 0.07), '#e9ecef');
      // Seitenteile (Dicke der Fahrbahn)
      for (const side of [-1, 1]) {
        g.quad(P(i, side * hw, 0.05), P(j, side * hw, 0.05), P(j, side * hw, -0.9), P(i, side * hw, -0.9), '#3b3f47');
        if (t.wall[i]) {
          const stripe = Math.floor(i / 4) % 2 ? th.wall : '#ffffff';
          g.quad(P(i, side * (hw + 0.15), 0), P(j, side * (hw + 0.15), 0), P(j, side * (hw + 0.15), 0.95), P(i, side * (hw + 0.15), 0.95), stripe);
        }
      }
      // Pfeiler unter hohen Abschnitten
      if (i % 14 === 0 && t.y[i]! - groundY > 2) {
        const h = t.y[i]! - groundY;
        g.box(t.x[i]!, groundY + h / 2 - 0.5, t.z[i]!, 2.2, h, 2.2, '#8a8f98');
      }
    }
    // Checkpoint-Tore und Startbogen
    const gate = (i: number, color: string) => {
      for (const side of [-1, 1]) {
        const p = P(i, side * (hw + 0.8), 0);
        g.box(p[0]!, p[1]! + 3, p[2]!, 0.6, 6, 0.6, color);
      }
      const a = P(i, -(hw + 0.8), 6);
      const b = P(i, hw + 0.8, 6);
      const steps = 8;
      for (let k = 0; k < steps; k++) {
        const f0 = k / steps;
        const f1 = (k + 1) / steps;
        const x0 = a[0]! + (b[0]! - a[0]!) * f0, z0 = a[2]! + (b[2]! - a[2]!) * f0;
        const x1 = a[0]! + (b[0]! - a[0]!) * f1, z1 = a[2]! + (b[2]! - a[2]!) * f1;
        g.quad([x0, a[1]! - 1, z0], [x1, a[1]! - 1, z1], [x1, a[1]!, z1], [x0, a[1]!, z0], k % 2 ? color : '#ffffff');
      }
    };
    t.checkpointIdx.forEach((i, k) => gate(i, k === t.checkpointIdx.length - 1 && !t.closed ? '#e03131' : '#4dabf7'));
    gate(t.startIdx, '#e03131');
    const trackMesh = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
    this.trackGroup.add(trackMesh);
    this.trackGroup.add(this.buildScenery(t, groundY));
    this.drawMinimapBase();
  }

  /** Bäume, Felsen, Häuser – als Instanzen, mit Abstand zur Strecke */
  private buildScenery(t: BuiltTrack, groundY: number): THREE.Object3D {
    const kind = t.def.theme.scenery;
    const group = new THREE.Group();
    if (kind === 'sea') return group;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < t.n; i++) {
      minX = Math.min(minX, t.x[i]!);
      maxX = Math.max(maxX, t.x[i]!);
      minZ = Math.min(minZ, t.z[i]!);
      maxZ = Math.max(maxZ, t.z[i]!);
    }
    // Raster der Strecke für schnelle Abstandsprüfung
    const cell = 20;
    const grid = new Set<string>();
    for (let i = 0; i < t.n; i += 2) grid.add(`${Math.floor(t.x[i]! / cell)},${Math.floor(t.z[i]! / cell)}`);
    const nearTrack = (x: number, z: number) => {
      const cx = Math.floor(x / cell);
      const cz = Math.floor(z / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (grid.has(`${cx + dx},${cz + dz}`)) return true;
      return false;
    };
    const b = new GeoBuilder();
    let geo: THREE.BufferGeometry;
    if (kind === 'forest' || kind === 'snow') {
      const top = kind === 'snow' ? '#e9f1f7' : '#2f9e44';
      const mid = kind === 'snow' ? '#2b6e4f' : '#37b24d';
      b.box(0, 1, 0, 0.6, 2, 0.6, '#7a4a28');
      geo = mergeGeometries([b.geometry(), new THREE.ConeGeometry(2.2, 4, 6).translate(0, 4, 0).toNonIndexed(), new THREE.ConeGeometry(1.5, 3, 6).translate(0, 6.2, 0).toNonIndexed()].map((gg, k) => {
        if (k === 0) return gg;
        gg.deleteAttribute('uv');
        const c = new THREE.Color(k === 1 ? mid : top);
        const colors = new Float32Array(gg.attributes.position!.count * 3).map((_, idx) => [c.r, c.g, c.b][idx % 3]!);
        gg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return gg;
      }))!;
    } else if (kind === 'desert') {
      b.box(0, 2, 0, 0.9, 4, 0.9, '#2f9e44');
      b.box(0.9, 2.6, 0, 0.9, 0.5, 0.5, '#2f9e44');
      b.box(1.2, 3.2, 0, 0.5, 1.2, 0.5, '#2f9e44');
      b.box(4, 0.8, 2, 3, 1.6, 2.4, '#b5651d');
      geo = b.geometry();
    } else {
      // Stadt / Nacht: Häuserblöcke
      const night = kind === 'night';
      b.box(0, 6, 0, 8, 12, 8, night ? '#2b3350' : '#adb5bd');
      for (let k = 0; k < 4; k++) b.box(0, 2.5 + k * 2.6, 4.02, 6, 1, 0.1, night ? '#ffe066' : '#74c0fc');
      geo = b.geometry();
    }
    const count = kind === 'city' || kind === 'night' ? 90 : 260;
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    let placed = 0;
    for (let k = 0; placed < count && k < count * 8; k++) {
      const x = minX - 120 + hash(k) * (maxX - minX + 240);
      const z = minZ - 120 + hash(k + 999) * (maxZ - minZ + 240);
      if (nearTrack(x, z)) continue;
      const sc = 0.7 + hash(k + 55) * 0.9;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash(k + 7) * Math.PI * 2);
      s.set(sc, sc * (kind === 'city' || kind === 'night' ? 0.6 + hash(k + 3) * 1.6 : 1), sc);
      m.compose(new THREE.Vector3(x, groundY, z), q, s);
      mesh.setMatrixAt(placed++, m);
    }
    mesh.count = placed;
    group.add(mesh);
    return group;
  }

  // ------------------------------------------------------------------ Autos & Ansichten

  setCars(slots: number[]) {
    this.slots = [...slots].sort((a, b) => a - b);
    for (const [slot, car] of this.cars)
      if (!slots.includes(slot)) {
        this.scene.remove(car);
        this.cars.delete(slot);
        this.cameras.delete(slot);
      }
    for (const slot of slots) {
      if (this.cars.has(slot)) continue;
      const group = new THREE.Group();
      group.rotation.order = 'YXZ';
      const color = CAR_COLORS[slot % CAR_COLORS.length]!.hex;
      group.add(new THREE.Mesh(this.carGeo.body, new THREE.MeshLambertMaterial({ color, flatShading: true })));
      group.add(new THREE.Mesh(this.carGeo.dark, this.darkMat));
      const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
      shadow.position.y = 0.04;
      group.add(shadow);
      this.scene.add(group);
      this.cars.set(slot, group);
      this.cameras.set(slot, new THREE.PerspectiveCamera(70, 1, 1, 320));
    }
  }

  pushFrame(f: RacerFrame) {
    const now = performance.now();
    const off = now - f.t;
    this.offset = this.offset === null ? off : Math.min(off, this.offset * 0.98 + off * 0.02);
    this.frames.push(f);
    if (this.frames.length > 40) this.frames.shift();
    for (const fx of f.fx) this.onFx?.(fx);
  }

  /** Ansichten: 1 = voll, 2 = übereinander, 3–4 = 2×2, 5–6 = 3×2, 7–8 = 4×2 */
  layout(w: number, h: number) {
    const slots = this.mode === 'shared' || this.slots.length === 0 ? [this.leaderSlot] : this.slots;
    const n = slots.length;
    const cols = n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4;
    const rows = n === 1 ? 1 : 2;
    const vw = w / cols;
    const vh = h / rows;
    this.views = slots.map((slot, i) => ({ slot, x: (i % cols) * vw, y: Math.floor(i / cols) * vh, w: vw, h: vh }));
    return this.views;
  }

  private sample(): CarView[] {
    if (!this.frames.length) return [];
    const target = performance.now() - (this.offset ?? 0) - DELAY_MS;
    let a = this.frames[0]!;
    let b = a;
    for (const f of this.frames) {
      if (f.t <= target) a = f;
      b = f;
      if (f.t >= target) break;
    }
    const k = b.t === a.t ? 1 : Math.max(0, Math.min(1, (target - a.t) / (b.t - a.t)));
    const lerp = (p: number, q: number) => p + (q - p) * k;
    return b.c.map((cb: CarFrame) => {
      const ca = a.c.find((c) => c[0] === cb[0]) ?? cb;
      let dh = cb[4] - ca[4];
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      return { slot: cb[0], x: lerp(ca[1], cb[1]), y: lerp(ca[2], cb[2]), z: lerp(ca[3], cb[3]), h: ca[4] + dh * k, kmh: cb[5], si: cb[6], flags: cb[7] };
    });
  }

  private render() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastT) / 1000);
    this.lastT = now;
    this.adaptQuality(dt * 1000);
    const cw = this.canvas.clientWidth;
    const ch = this.canvas.clientHeight;
    if (!cw || !ch) return;
    const ratio = Math.round(Math.min(window.devicePixelRatio || 1, 1.5) * this.scale * 10) / 10;
    if (this.renderer.getPixelRatio() !== ratio) this.renderer.setPixelRatio(ratio);
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== cw || size.y !== ch) this.renderer.setSize(cw, ch, false);

    const cars = this.sample();
    for (const c of cars) {
      this.latest.set(c.slot, c);
      const g = this.cars.get(c.slot);
      if (!g || !this.track) continue;
      g.position.set(c.x, c.y + (c.flags & CAR_FLAG.falling ? 0 : 0.08), c.z);
      g.rotation.y = c.h;
      g.rotation.x = c.flags & CAR_FLAG.falling ? 0.4 : -Math.atan(this.track.slope[c.si] ?? 0);
    }
    const views = this.layout(cw, ch);
    // viele kleine Ansichten: kürzere Sichtweite = weniger zu zeichnen
    if (this.scene.fog instanceof THREE.Fog) this.scene.fog.far = views.length > 4 ? 210 : views.length > 2 ? 260 : 300;
    for (const v of views) {
      const car = this.latest.get(v.slot);
      const cam = this.mode === 'shared' ? this.shared : this.cameras.get(v.slot);
      if (!cam) continue;
      if (car) this.follow(cam, v.slot, car, dt, this.mode === 'shared');
      cam.aspect = v.w / v.h;
      cam.updateProjectionMatrix();
      // WebGL zählt y von unten
      const y = ch - v.y - v.h;
      this.renderer.setViewport(v.x, y, v.w, v.h);
      this.renderer.setScissor(v.x, y, v.w, v.h);
      this.renderer.render(this.scene, cam);
    }
    this.drawMinimap();
  }

  private follow(cam: THREE.PerspectiveCamera, slot: number, c: CarView, dt: number, far: boolean) {
    const fx = Math.sin(c.h);
    const fz = Math.cos(c.h);
    const back = far ? 15 : 8;
    const up = far ? 7 : 3.4;
    const desired = new THREE.Vector3(c.x - fx * back, c.y + up, c.z - fz * back);
    const k = 1 - Math.exp(-dt * 7);
    if (cam.position.distanceTo(desired) > 60) cam.position.copy(desired);
    else cam.position.lerp(desired, k);
    let look = this.camTarget.get(slot);
    const want = new THREE.Vector3(c.x + fx * 6, c.y + 1.2, c.z + fz * 6);
    if (!look || look.distanceTo(want) > 60) {
      look = want.clone();
      this.camTarget.set(slot, look);
    } else look.lerp(want, 1 - Math.exp(-dt * 10));
    cam.lookAt(look);
    cam.fov = 68 + Math.min(14, c.kmh * 0.07);
  }

  /**
   * Auflösung in groben Stufen runter, wenn es ruckelt – und erst nach längerer flüssiger Phase wieder rauf.
   * (Jede Änderung legt die Zeichenfläche neu an – deshalb selten und in 0,1er-Schritten.)
   */
  private fastFor = 0;
  private adaptQuality(ms: number) {
    this.frameAvg = this.frameAvg * 0.95 + ms * 0.05;
    if (this.frameAvg > 22) {
      this.slowFor += ms;
      this.fastFor = 0;
    } else {
      this.slowFor = Math.max(0, this.slowFor - ms);
      this.fastFor = this.frameAvg < 13 ? this.fastFor + ms : 0;
    }
    if (this.slowFor > 2000 && this.scale > 0.5) {
      this.scale = Math.round((this.scale - 0.1) * 10) / 10;
      this.slowFor = 0;
    } else if (this.fastFor > 6000 && this.scale < 1) {
      this.scale = Math.round((this.scale + 0.1) * 10) / 10;
      this.fastFor = 0;
    }
  }

  // ------------------------------------------------------------------ Minikarte

  private mini: { base: HTMLCanvasElement; sx: (x: number) => number; sz: (z: number) => number } | null = null;

  private drawMinimapBase() {
    const t = this.track;
    const mc = this.minimap;
    if (!t || !mc) return;
    const size = 180;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < t.n; i++) {
      minX = Math.min(minX, t.x[i]!);
      maxX = Math.max(maxX, t.x[i]!);
      minZ = Math.min(minZ, t.z[i]!);
      maxZ = Math.max(maxZ, t.z[i]!);
    }
    const s = (size - 20) / Math.max(maxX - minX, maxZ - minZ);
    const sx = (x: number) => 10 + (x - minX) * s + ((size - 20) - (maxX - minX) * s) / 2;
    const sz = (z: number) => 10 + (z - minZ) * s + ((size - 20) - (maxZ - minZ) * s) / 2;
    const base = document.createElement('canvas');
    base.width = base.height = size;
    const g = base.getContext('2d')!;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 7;
    g.beginPath();
    for (let i = 0; i < t.n; i += 3) (i ? g.lineTo : g.moveTo).call(g, sx(t.x[i]!), sz(t.z[i]!));
    if (t.closed) g.closePath();
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 3;
    g.stroke();
    mc.width = mc.height = size;
    this.mini = { base, sx, sz };
  }

  private drawMinimap() {
    const mc = this.minimap;
    if (!mc || !this.mini) return;
    const g = mc.getContext('2d')!;
    g.clearRect(0, 0, mc.width, mc.height);
    g.drawImage(this.mini.base, 0, 0);
    for (const c of this.latest.values()) {
      g.beginPath();
      g.arc(this.mini.sx(c.x), this.mini.sz(c.z), 5, 0, Math.PI * 2);
      g.fillStyle = CAR_COLORS[c.slot % CAR_COLORS.length]!.hex;
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 1.5;
      g.stroke();
    }
  }
}
