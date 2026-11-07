import { useCallback, useEffect, useState } from 'react';
import type { WordList, WordListSummary } from '../../shared/types/words';
import { getServerInfo } from '../../app/session/server-info';
import { getAuthToken } from '../../app/account/account-store';

const DEVICE_KEY = 'luma.device-id';
const BACKUP_KEY = 'luma.wordlists.backup';

/** Zufällige, dauerhafte Gerätekennung (funktioniert auch ohne HTTPS). */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  } catch {
    /* ignorieren */
  }
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    localStorage.setItem(DEVICE_KEY, id);
  } catch {
    /* ignorieren */
  }
  return id;
}

/** Kopfzeilen für private Daten (Gerätekennung + ggf. Anmeldung) */
export function ownerHeaders(): Record<string, string> {
  const token = getAuthToken();
  return { 'X-Luma-Owner': getDeviceId(), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Luma-Owner': getDeviceId(),
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fehler ${res.status}`);
  if (init?.method && init.method !== 'GET') void backupWordLists();
  return data as T;
}

/**
 * Online-Modus: eigene Listen zusätzlich im Browser sichern. Kostenlose Hosting-Server
 * verlieren ihre Dateien bei jedem Neustart – die Sicherung stellt sie automatisch wieder her.
 */
async function backupWordLists() {
  if (!(await getServerInfo()).publicMode) return;
  try {
    const { lists } = await request<{ lists: WordList[] }>('/api/word-lists/export');
    localStorage.setItem(BACKUP_KEY, JSON.stringify(lists));
  } catch {
    /* ignorieren */
  }
}

let restoring: Promise<void> | null = null;

/** Beim Laden der Seite gesicherte Listen zum Server übertragen (nur Online-Modus). */
export function restoreWordLists(): Promise<void> {
  restoring ??= (async () => {
    if (!(await getServerInfo()).publicMode) return;
    let lists: WordList[] = [];
    try {
      lists = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '[]') as WordList[];
    } catch {
      return;
    }
    if (!Array.isArray(lists) || lists.length === 0) return;
    await request('/api/word-lists/restore', {
      method: 'POST',
      body: JSON.stringify({
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          createdAt: l.createdAt,
          words: l.words.map((w) => ({ word: w.word, category: w.category, difficulty: w.difficulty })),
        })),
      }),
    }).catch(() => {});
  })();
  return restoring;
}

export interface WordInput {
  word: string;
  category?: string;
  difficulty?: string;
}

export const wordApi = {
  list: () => request<{ lists: WordListSummary[] }>('/api/word-lists').then((r) => r.lists),
  get: (id: string) => request<{ list: WordList }>(`/api/word-lists/${id}`).then((r) => r.list),
  create: (name: string, words: WordInput[] = []) =>
    request<{ list: WordList }>('/api/word-lists', { method: 'POST', body: JSON.stringify({ name, words }) }).then((r) => r.list),
  rename: (id: string, name: string) =>
    request<{ list: WordList }>(`/api/word-lists/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }).then((r) => r.list),
  remove: (id: string) => request(`/api/word-lists/${id}`, { method: 'DELETE' }),
  addWords: (id: string, words: WordInput[]) =>
    request<{ list: WordList; added: number; skipped: number }>(`/api/word-lists/${id}/words`, { method: 'POST', body: JSON.stringify({ words }) }),
  updateWord: (id: string, wordId: string, patch: Partial<WordInput>) =>
    request<{ list: WordList }>(`/api/word-lists/${id}/words/${wordId}`, { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => r.list),
  removeWord: (id: string, wordId: string) =>
    request<{ list: WordList }>(`/api/word-lists/${id}/words/${wordId}`, { method: 'DELETE' }).then((r) => r.list),
};

/** Lädt die Übersicht aller Wortlisten; `version` erzwingt Neuladen. */
export function useWordLists(version = 0) {
  const [lists, setLists] = useState<WordListSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    restoreWordLists()
      .then(() => wordApi.list())
      .then((l) => {
        setLists(l);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(reload, [reload, version]);
  return { lists, error, reload, setLists };
}

/** Mehrzeilige Eingabe parsen: ein Wort pro Zeile, optional „Wort; Kategorie“ oder Komma-getrennt. */
export function parseBulkInput(text: string, defaultCategory: string): WordInput[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: WordInput[] = [];
  for (const line of lines) {
    if (line.includes(';')) {
      const [word, category] = line.split(';').map((s) => s.trim());
      if (word) out.push({ word, category: category || defaultCategory });
    } else {
      for (const w of line.split(',').map((s) => s.trim()).filter(Boolean)) out.push({ word: w, category: defaultCategory });
    }
  }
  return out;
}
