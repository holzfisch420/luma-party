/**
 * Einfacher Dokumentenspeicher für dauerhafte Daten (Konten, Wortlisten …).
 *
 * - FileDocumentStore: eine JSON-Datei pro Sammlung (Heimnetz, Desktop-Programm)
 * - PostgresDocumentStore: Tabelle `luma_documents` (Online, z. B. mit DATABASE_URL)
 * - MemoryDocumentStore: nur im Arbeitsspeicher (Tests)
 *
 * Die Stores halten Daten im Speicher und schreiben jede Änderung sofort durch.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export interface Doc {
  id: string;
}

export interface DocumentStore {
  readonly kind: 'file' | 'postgres' | 'memory';
  loadAll<T extends Doc>(collection: string): Promise<T[]>;
  put<T extends Doc>(collection: string, doc: T): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  close(): Promise<void>;
}

export class MemoryDocumentStore implements DocumentStore {
  readonly kind = 'memory' as const;
  private data = new Map<string, Map<string, unknown>>();
  async loadAll<T extends Doc>(collection: string): Promise<T[]> {
    return [...(this.data.get(collection)?.values() ?? [])].map((d) => structuredClone(d) as T);
  }
  async put<T extends Doc>(collection: string, doc: T) {
    if (!this.data.has(collection)) this.data.set(collection, new Map());
    this.data.get(collection)!.set(doc.id, structuredClone(doc));
  }
  async remove(collection: string, id: string) {
    this.data.get(collection)?.delete(id);
  }
  async close() {}
}

export class FileDocumentStore implements DocumentStore {
  readonly kind = 'file' as const;
  private cache = new Map<string, Map<string, unknown>>();
  private chains = new Map<string, Promise<void>>();

  constructor(private readonly dir: string) {}

  private file(collection: string) {
    return path.join(this.dir, `${collection}.json`);
  }

  private async ensure(collection: string): Promise<Map<string, unknown>> {
    let map = this.cache.get(collection);
    if (map) return map;
    map = new Map();
    try {
      const raw = JSON.parse(await fs.readFile(this.file(collection), 'utf8')) as { items?: Doc[]; lists?: Doc[] };
      // `lists` = älteres Format der Wortlisten-Datei
      for (const d of raw.items ?? raw.lists ?? []) map.set(d.id, d);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.error(`[storage] ${collection} konnte nicht gelesen werden:`, err);
    }
    this.cache.set(collection, map);
    return map;
  }

  async loadAll<T extends Doc>(collection: string): Promise<T[]> {
    return [...(await this.ensure(collection)).values()] as T[];
  }

  async put<T extends Doc>(collection: string, doc: T) {
    (await this.ensure(collection)).set(doc.id, doc);
    await this.flush(collection);
  }

  async remove(collection: string, id: string) {
    (await this.ensure(collection)).delete(id);
    await this.flush(collection);
  }

  /** atomar schreiben (tmp + rename), Schreibvorgänge je Sammlung nacheinander */
  private flush(collection: string): Promise<void> {
    const snapshot = JSON.stringify({ items: [...this.cache.get(collection)!.values()] }, null, 1);
    const file = this.file(collection);
    const next = (this.chains.get(collection) ?? Promise.resolve())
      .then(async () => {
        await fs.mkdir(this.dir, { recursive: true });
        await fs.writeFile(`${file}.tmp`, snapshot, 'utf8');
        await fs.rename(`${file}.tmp`, file);
      })
      .catch((err) => console.error(`[storage] ${collection} konnte nicht gespeichert werden:`, err));
    this.chains.set(collection, next);
    return next;
  }

  async close() {
    await Promise.all(this.chains.values());
  }
}

export class PostgresDocumentStore implements DocumentStore {
  readonly kind = 'postgres' as const;
  private pool: pg.Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    this.pool = new pg.Pool({
      connectionString,
      max: 5,
      // gehostete Datenbanken (Neon, Render, Supabase …) verlangen TLS
      ssl: local || /sslmode=disable/.test(connectionString) ? undefined : { rejectUnauthorized: false },
    });
    this.ready = this.pool
      .query(
        `CREATE TABLE IF NOT EXISTS luma_documents (
           collection TEXT NOT NULL,
           id TEXT NOT NULL,
           data JSONB NOT NULL,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
           PRIMARY KEY (collection, id)
         )`,
      )
      .then(() => undefined);
  }

  async loadAll<T extends Doc>(collection: string): Promise<T[]> {
    await this.ready;
    const res = await this.pool.query<{ data: T }>('SELECT data FROM luma_documents WHERE collection = $1', [collection]);
    return res.rows.map((r) => r.data);
  }

  async put<T extends Doc>(collection: string, doc: T) {
    await this.ready;
    await this.pool.query(
      `INSERT INTO luma_documents (collection, id, data, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [collection, doc.id, JSON.stringify(doc)],
    );
  }

  async remove(collection: string, id: string) {
    await this.ready;
    await this.pool.query('DELETE FROM luma_documents WHERE collection = $1 AND id = $2', [collection, id]);
  }

  async close() {
    await this.pool.end();
  }
}

/** Wählt den Speicher: Datenbank (falls URL), sonst Ordner, sonst Arbeitsspeicher. */
export async function createDocumentStore(opts: { databaseUrl?: string | null; dataDir?: string | null }): Promise<DocumentStore> {
  if (opts.databaseUrl) {
    const store = new PostgresDocumentStore(opts.databaseUrl);
    await store.loadAll('meta'); // Verbindung + Tabelle prüfen
    return store;
  }
  if (opts.dataDir) return new FileDocumentStore(opts.dataDir);
  return new MemoryDocumentStore();
}
