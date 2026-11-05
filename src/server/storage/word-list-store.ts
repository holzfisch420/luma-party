/**
 * Persistente Speicherung eigener Wortlisten in einer JSON-Datei.
 * Bewusst einfach gehalten: für eine lokale Party-App reicht das völlig aus und
 * erfordert keine externe Datenbank. Die Schnittstelle ist klein genug, um später
 * gegen Prisma/PostgreSQL ausgetauscht zu werden.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  WORD_CATEGORIES,
  WORD_DIFFICULTIES,
  WORD_LIST_MAX_WORDS,
  WORD_LISTS_PER_OWNER,
  WORD_LIST_NAME_MAX,
  WORD_MAX_LENGTH,
  type WordCategory,
  type WordDifficulty,
  type WordEntry,
  type WordList,
  type WordListSummary,
} from '../../shared/types/words';
import { sanitizeText } from '../../shared/utils/text';

export interface WordInput {
  word: string;
  category?: string;
  difficulty?: string;
}

export class WordListError extends Error {}

function normalizeCategory(c: unknown): WordCategory {
  return (WORD_CATEGORIES as readonly string[]).includes(c as string) ? (c as WordCategory) : 'Sonstiges';
}
function normalizeDifficulty(d: unknown): WordDifficulty {
  return (WORD_DIFFICULTIES as readonly string[]).includes(d as string) ? (d as WordDifficulty) : 'mittel';
}

export function sanitizeWord(raw: unknown): string {
  return sanitizeText(raw, WORD_MAX_LENGTH);
}

/**
 * Zugriffsbereich: `null` = geteilt (Heimnetz/Desktop: alle Geräte sehen alle Listen),
 * sonst eine Besitzerkennung (Online-Modus: jedes Gerät sieht nur seine eigenen Listen).
 */
export type Owner = string | null;

const MAX_LISTS_TOTAL = 20_000;

export interface RestoreInput {
  id: string;
  name: string;
  words: WordInput[];
  createdAt?: number;
}

export class WordListStore {
  private lists = new Map<string, WordList>();
  private loaded = false;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string | null) {}

  async load(): Promise<void> {
    if (this.loaded) return;
    if (!this.filePath) {
      this.loaded = true;
      return;
    }
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const data = JSON.parse(raw) as { lists?: WordList[] };
      for (const l of data.lists ?? []) this.lists.set(l.id, l);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.error('[words] Laden fehlgeschlagen:', err);
    }
    this.loaded = true;
  }

  private persist(): Promise<void> {
    if (!this.filePath) return Promise.resolve();
    const filePath = this.filePath;
    const snapshot = JSON.stringify({ lists: [...this.lists.values()] }, null, 2);
    this.writeChain = this.writeChain
      .then(async () => {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const tmp = `${filePath}.tmp`;
        await fs.writeFile(tmp, snapshot, 'utf8');
        await fs.rename(tmp, filePath);
      })
      .catch((err) => console.error('[words] Speichern fehlgeschlagen:', err));
    return this.writeChain;
  }

  private visible(list: WordList, owner: Owner): boolean {
    return owner === null || list.owner === owner;
  }

  list(owner: Owner = null): WordListSummary[] {
    return [...this.lists.values()]
      .filter((l) => this.visible(l, owner))
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(({ words, owner: _owner, ...rest }) => ({ ...rest, wordCount: words.length }));
  }

  get(id: string, owner: Owner = null): WordList | undefined {
    const list = this.lists.get(id);
    return list && this.visible(list, owner) ? list : undefined;
  }

  /** vollständige Listen eines Besitzers (für die Sicherung auf dem Gerät) */
  export(owner: Owner): WordList[] {
    return [...this.lists.values()].filter((l) => this.visible(l, owner)).map(({ owner: _o, ...l }) => l);
  }

  /**
   * Stellt Listen aus der Gerätesicherung wieder her (z. B. nach einem Server-Neustart).
   * Bereits vorhandene Listen bleiben unverändert.
   */
  async restore(owner: Owner, lists: RestoreInput[]): Promise<number> {
    let restored = 0;
    for (const input of lists) {
      if (this.lists.has(input.id)) continue;
      if (owner !== null && this.countOwned(owner) >= WORD_LISTS_PER_OWNER) break;
      if (this.lists.size >= MAX_LISTS_TOTAL) break;
      const list: WordList = {
        id: input.id,
        name: sanitizeText(input.name, WORD_LIST_NAME_MAX) || 'Meine Wörter',
        words: [],
        createdAt: Number.isFinite(input.createdAt) ? Number(input.createdAt) : Date.now(),
        updatedAt: Date.now(),
        ...(owner ? { owner } : {}),
      };
      this.addWordsTo(list, input.words.slice(0, WORD_LIST_MAX_WORDS));
      this.lists.set(list.id, list);
      restored++;
    }
    if (restored) await this.persist();
    return restored;
  }

  private countOwned(owner: string): number {
    let n = 0;
    for (const l of this.lists.values()) if (l.owner === owner) n++;
    return n;
  }

  /** alle Wörter der angegebenen Listen (für das Spiel) */
  wordsFrom(ids: readonly string[]): WordEntry[] {
    return ids.flatMap((id) => this.lists.get(id)?.words ?? []);
  }

  async create(name: string, words: WordInput[] = [], owner: Owner = null): Promise<WordList> {
    if (owner !== null && this.countOwned(owner) >= WORD_LISTS_PER_OWNER) {
      throw new WordListError(`Maximal ${WORD_LISTS_PER_OWNER} Wortlisten pro Gerät.`);
    }
    if (this.lists.size >= MAX_LISTS_TOTAL) throw new WordListError('Speicher voll – bitte später erneut versuchen.');
    const cleanName = sanitizeText(name, WORD_LIST_NAME_MAX) || 'Meine Wörter';
    const now = Date.now();
    const list: WordList = { id: randomUUID(), name: cleanName, words: [], createdAt: now, updatedAt: now, ...(owner ? { owner } : {}) };
    this.addWordsTo(list, words);
    this.lists.set(list.id, list);
    await this.persist();
    return list;
  }

  async rename(id: string, name: string, owner: Owner = null): Promise<WordList> {
    const list = this.require(id, owner);
    const clean = sanitizeText(name, WORD_LIST_NAME_MAX);
    if (!clean) throw new WordListError('Name darf nicht leer sein.');
    list.name = clean;
    list.updatedAt = Date.now();
    await this.persist();
    return list;
  }

  async remove(id: string, owner: Owner = null): Promise<void> {
    this.require(id, owner);
    this.lists.delete(id);
    await this.persist();
  }

  /** fügt Wörter hinzu; Duplikate (Groß-/Kleinschreibung ignoriert) werden übersprungen */
  async addWords(id: string, words: WordInput[], owner: Owner = null): Promise<{ list: WordList; added: number; skipped: number }> {
    const list = this.require(id, owner);
    const { added, skipped } = this.addWordsTo(list, words);
    list.updatedAt = Date.now();
    await this.persist();
    return { list, added, skipped };
  }

  async updateWord(listId: string, wordId: string, input: Partial<WordInput>, owner: Owner = null): Promise<WordList> {
    const list = this.require(listId, owner);
    const entry = list.words.find((w) => w.id === wordId);
    if (!entry) throw new WordListError('Wort nicht gefunden.');
    if (input.word !== undefined) {
      const clean = sanitizeWord(input.word);
      if (!clean) throw new WordListError('Wort darf nicht leer sein.');
      const dup = list.words.some((w) => w.id !== wordId && w.word.toLowerCase() === clean.toLowerCase());
      if (dup) throw new WordListError(`„${clean}“ ist bereits in der Liste.`);
      entry.word = clean;
    }
    if (input.category !== undefined) entry.category = normalizeCategory(input.category);
    if (input.difficulty !== undefined) entry.difficulty = normalizeDifficulty(input.difficulty);
    list.updatedAt = Date.now();
    await this.persist();
    return list;
  }

  async removeWord(listId: string, wordId: string, owner: Owner = null): Promise<WordList> {
    const list = this.require(listId, owner);
    list.words = list.words.filter((w) => w.id !== wordId);
    list.updatedAt = Date.now();
    await this.persist();
    return list;
  }

  private require(id: string, owner: Owner): WordList {
    const list = this.get(id, owner);
    if (!list) throw new WordListError('Wortliste nicht gefunden.');
    return list;
  }

  private addWordsTo(list: WordList, words: WordInput[]): { added: number; skipped: number } {
    const existing = new Set(list.words.map((w) => w.word.toLowerCase()));
    let added = 0;
    let skipped = 0;
    for (const input of words) {
      const clean = sanitizeWord(input.word);
      if (!clean || existing.has(clean.toLowerCase())) {
        skipped++;
        continue;
      }
      if (list.words.length >= WORD_LIST_MAX_WORDS) throw new WordListError(`Maximal ${WORD_LIST_MAX_WORDS} Wörter pro Liste.`);
      existing.add(clean.toLowerCase());
      list.words.push({
        id: randomUUID(),
        word: clean,
        category: normalizeCategory(input.category),
        difficulty: normalizeDifficulty(input.difficulty),
      });
      added++;
    }
    return { added, skipped };
  }
}
