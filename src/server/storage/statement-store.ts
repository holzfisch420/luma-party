/** Eigene Satz-Sammlungen für „Echt jetzt?“ – privat pro Besitzer im Online-Modus, sonst geteilt. */
import { randomUUID } from 'node:crypto';
import { sanitizeText } from '../../shared/utils/text';
import type { DocumentStore } from './document-store';
import type { Owner } from './word-list-store';

const COLLECTION = 'statement-lists';
export const STATEMENT_LIST_MAX = 600;
export const STATEMENT_MAX_LENGTH = 200;
const MAX_PER_OWNER = 30;
const MAX_TOTAL = 20_000;

export interface StatementList {
  id: string;
  name: string;
  statements: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StatementListSummary {
  id: string;
  name: string;
  count: number;
  createdAt: number;
}

type Stored = StatementList & { owner?: string };

export class StatementError extends Error {}

/**
 * Platzhalter vereinheitlichen: BLUBB (auch in Wörtern, z. B. „LieblingsBLUBB“), WALTER oder ___
 * werden zu „___“. Zeilen ohne Platzhalter sind ungültig.
 */
export function normalizeStatement(raw: string): string | null {
  const s = sanitizeText(raw, STATEMENT_MAX_LENGTH + 40)
    .replace(/BLUBB|WALTER|_{2,}/g, '___');
  if (!s.includes('___') || s.length > STATEMENT_MAX_LENGTH) return null;
  return s;
}

/** Text (eine Zeile pro Satz) in gültige Sätze zerlegen */
export function parseStatements(input: string[]): { valid: string[]; invalid: number } {
  const valid: string[] = [];
  let invalid = 0;
  const seen = new Set<string>();
  for (const line of input) {
    if (!line.trim()) continue;
    const s = normalizeStatement(line);
    if (!s) invalid++;
    else if (!seen.has(s)) {
      seen.add(s);
      valid.push(s);
    }
  }
  return { valid: valid.slice(0, STATEMENT_LIST_MAX), invalid };
}

export class StatementStore {
  private lists = new Map<string, Stored>();

  constructor(private readonly store: DocumentStore) {}

  async load() {
    for (const l of await this.store.loadAll<Stored>(COLLECTION)) this.lists.set(l.id, l);
  }

  private visible(l: Stored, owner: Owner) {
    return owner === null || l.owner === owner;
  }

  list(owner: Owner): StatementListSummary[] {
    return [...this.lists.values()]
      .filter((l) => this.visible(l, owner))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((l) => ({ id: l.id, name: l.name, count: l.statements.length, createdAt: l.createdAt }));
  }

  /** für die Spiel-Engine (ohne Besitzerprüfung – die ID ist geheim) */
  get(id: string): StatementList | undefined {
    const l = this.lists.get(id);
    if (!l) return undefined;
    const { owner: _o, ...rest } = l;
    return rest;
  }

  getOwned(id: string, owner: Owner): StatementList | undefined {
    const l = this.lists.get(id);
    return l && this.visible(l, owner) ? this.get(id) : undefined;
  }

  private cleanName(name: string) {
    const n = name.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!n) throw new StatementError('Bitte gib der Sammlung einen Namen.');
    return n;
  }

  async create(name: string, lines: string[], owner: Owner): Promise<{ list: StatementList; invalid: number }> {
    if (owner !== null && [...this.lists.values()].filter((l) => l.owner === owner).length >= MAX_PER_OWNER) {
      throw new StatementError(`Maximal ${MAX_PER_OWNER} Sammlungen pro Konto bzw. Gerät.`);
    }
    if (this.lists.size >= MAX_TOTAL) throw new StatementError('Speicher voll – bitte später erneut versuchen.');
    const { valid, invalid } = parseStatements(lines);
    const now = Date.now();
    const list: Stored = { id: randomUUID(), name: this.cleanName(name), statements: valid, createdAt: now, updatedAt: now, ...(owner ? { owner } : {}) };
    this.lists.set(list.id, list);
    await this.store.put(COLLECTION, list);
    return { list: this.get(list.id)!, invalid };
  }

  async update(id: string, name: string, lines: string[], owner: Owner): Promise<{ list: StatementList; invalid: number }> {
    const l = this.lists.get(id);
    if (!l || !this.visible(l, owner)) throw new StatementError('Sammlung nicht gefunden.');
    const { valid, invalid } = parseStatements(lines);
    l.name = this.cleanName(name);
    l.statements = valid;
    l.updatedAt = Date.now();
    await this.store.put(COLLECTION, l);
    return { list: this.get(id)!, invalid };
  }

  async remove(id: string, owner: Owner) {
    const l = this.lists.get(id);
    if (!l || !this.visible(l, owner)) throw new StatementError('Sammlung nicht gefunden.');
    this.lists.delete(id);
    await this.store.remove(COLLECTION, id);
  }
}
