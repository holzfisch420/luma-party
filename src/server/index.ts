/**
 * Luma Party – Server-Einstiegspunkt.
 * Express (REST für Wortlisten, Infos, statische Dateien) + Socket.IO (Echtzeit).
 */
import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/events';
import { RoomManager } from './rooms/room-manager';
import { registerSocketHandlers } from './sockets/register-handlers';
import { WordListStore } from './storage/word-list-store';
import { createWordListRouter } from './routes/word-lists';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT ?? (isProd ? 3000 : (process.env.SERVER_PORT ?? 3001)));
const DATA_FILE = process.env.WORD_LISTS_FILE ?? path.join(ROOT, 'data', 'word-lists.json');

/** Eingebettete Frontend-Dateien (für das Desktop-Programm): Pfad → Inhalt */
export type EmbeddedAssets = Record<string, { type: string; data: string /* base64 */ }>;

export interface ServerOptions {
  port?: number;
  /** Speicherort der Wortlisten; `null` = nur im Arbeitsspeicher */
  dataFile?: string | null;
  assets?: EmbeddedAssets;
  /**
   * Öffentlicher Online-Modus (z. B. auf einem Hosting-Anbieter):
   * Wortlisten sind pro Gerät privat, zusätzliche Missbrauchsgrenzen aktiv.
   */
  publicMode?: boolean;
}

/** LUMA_PUBLIC=1 aktiviert den Online-Modus */
export const PUBLIC_MODE = process.env.LUMA_PUBLIC === '1' || process.env.LUMA_PUBLIC === 'true';

const VIRTUAL_ADAPTER = /(vEthernet|VirtualBox|VMware|Hyper-V|docker|veth|br-|vbox|utun|tailscale|zerotier|WSL|Loopback)/i;

/** LAN-Adressen, sortiert nach Wahrscheinlichkeit, dass Smartphones sie erreichen (Heim-WLAN zuerst). */
export function lanAddresses(): string[] {
  const found: { address: string; score: number }[] = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const addr of list ?? []) {
      if (addr.family !== 'IPv4' || addr.internal || addr.address.startsWith('169.254.')) continue;
      let score = 0;
      if (addr.address.startsWith('192.168.')) score += 30;
      else if (addr.address.startsWith('10.')) score += 20;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr.address)) score += 10;
      if (/wi-?fi|wlan|wireless|en0|eth|ethernet/i.test(name)) score += 5;
      if (VIRTUAL_ADAPTER.test(name)) score -= 50;
      found.push({ address: addr.address, score });
    }
  }
  return found.sort((a, b) => b.score - a.score).map((f) => f.address);
}

export async function startServer(portOrOptions: number | ServerOptions = PORT) {
  const opts: ServerOptions = typeof portOrOptions === 'number' ? { port: portOrOptions } : portOrOptions;
  const port = opts.port ?? PORT;
  const publicMode = opts.publicMode ?? PUBLIC_MODE;
  const wordLists = new WordListStore(opts.dataFile === undefined ? DATA_FILE : opts.dataFile);
  await wordLists.load();

  const app = express();
  app.disable('x-powered-by');
  // hinter dem Proxy des Hosting-Anbieters die echte Client-IP verwenden
  if (publicMode) app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: isProd ? undefined : { origin: true },
    maxHttpBufferSize: 512 * 1024,
    pingInterval: 10_000,
    pingTimeout: 8_000,
  });
  const rooms = new RoomManager(io, { wordLists });
  registerSocketHandlers(io, rooms, { publicMode });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });
  app.get('/api/info', (_req, res) => {
    res.json({ lanAddresses: publicMode ? [] : lanAddresses(), publicMode });
  });
  app.use('/api/word-lists', createWordListRouter(wordLists, { publicMode }));

  // Desktop-Programm: Frontend aus dem Speicher ausliefern
  const assets = opts.assets;
  if (assets && Object.keys(assets).length) {
    const buffers = new Map(Object.entries(assets).map(([p, a]) => [p, { type: a.type, body: Buffer.from(a.data, 'base64') }]));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      const file = buffers.get(req.path) ?? buffers.get('/index.html')!;
      res.setHeader('Content-Type', file.type);
      res.setHeader('Cache-Control', req.path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      res.end(file.body);
    });
  }

  // Produktion: gebautes Frontend ausliefern
  const dist = path.join(ROOT, 'dist');
  if (!assets && existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, '0.0.0.0', () => {
      httpServer.off('error', reject);
      resolve();
    });
  });
  const actualPort = (httpServer.address() as { port: number }).port;
  return {
    port: actualPort,
    io,
    rooms,
    close: async () => {
      rooms.dispose();
      io.close();
      await new Promise((r) => httpServer.close(() => r(undefined)));
    },
  };
}

