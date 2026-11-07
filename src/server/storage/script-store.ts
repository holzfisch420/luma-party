/** Hochgeladene Theaterskripte – privat pro Besitzer im Online-Modus, sonst geteilt. */
import { randomUUID } from 'node:crypto';
import type { Script, ScriptSummary } from '../../games/theater/types';
import type { ScriptUpload } from '../../games/theater/game-config';
import type { DocumentStore } from './document-store';
import type { Owner } from './word-list-store';

const COLLECTION = 'scripts';
const MAX_PER_OWNER = 30;
const MAX_TOTAL = 5000;

type StoredScript = Script & { owner?: string };

export class ScriptError extends Error {}

export class ScriptStore {
  private scripts = new Map<string, StoredScript>();

  constructor(private readonly store: DocumentStore) {}

  async load() {
    for (const s of await this.store.loadAll<StoredScript>(COLLECTION)) this.scripts.set(s.id, s);
  }

  private visible(s: StoredScript, owner: Owner) {
    return owner === null || s.owner === owner;
  }

  list(owner: Owner): ScriptSummary[] {
    return [...this.scripts.values()]
      .filter((s) => this.visible(s, owner))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt, pageCount: s.pageCount, characters: s.characters, sceneCount: s.scenes.length, lineCount: s.lines.length }));
  }

  /** für die Spiel-Engine (ohne Besitzerprüfung – die Skript-ID ist geheim) */
  get(id: string): Script | undefined {
    const s = this.scripts.get(id);
    if (!s) return undefined;
    const { owner: _o, ...rest } = s;
    return rest;
  }

  getOwned(id: string, owner: Owner): Script | undefined {
    const s = this.scripts.get(id);
    return s && this.visible(s, owner) ? this.get(id) : undefined;
  }

  async create(data: ScriptUpload, owner: Owner): Promise<Script> {
    if (owner !== null && [...this.scripts.values()].filter((s) => s.owner === owner).length >= MAX_PER_OWNER) {
      throw new ScriptError(`Maximal ${MAX_PER_OWNER} Skripte pro Gerät.`);
    }
    if (this.scripts.size >= MAX_TOTAL) throw new ScriptError('Speicher voll – bitte später erneut versuchen.');
    // Szenen-Startindizes absichern
    const scenes = data.scenes.filter((s) => s.start < data.lines.length);
    const script: StoredScript = { id: randomUUID(), createdAt: Date.now(), ...data, scenes, ...(owner ? { owner } : {}) };
    this.scripts.set(script.id, script);
    await this.store.put(COLLECTION, script);
    return this.get(script.id)!;
  }

  async rename(id: string, title: string, owner: Owner) {
    const s = this.scripts.get(id);
    if (!s || !this.visible(s, owner)) throw new ScriptError('Skript nicht gefunden.');
    const clean = title.trim().slice(0, 120);
    if (!clean) throw new ScriptError('Titel darf nicht leer sein.');
    s.title = clean;
    await this.store.put(COLLECTION, s);
  }

  async remove(id: string, owner: Owner) {
    const s = this.scripts.get(id);
    if (!s || !this.visible(s, owner)) throw new ScriptError('Skript nicht gefunden.');
    this.scripts.delete(id);
    await this.store.remove(COLLECTION, id);
  }
}
