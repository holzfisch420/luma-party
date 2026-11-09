/** Client für eigene Satz-Sammlungen (/api/statements) */
import { ownerHeaders } from '../../components/word-manager/word-api';

export interface StatementListSummary {
  id: string;
  name: string;
  count: number;
  createdAt: number;
}
export interface StatementList {
  id: string;
  name: string;
  statements: string[];
  createdAt: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...ownerHeaders(), ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fehler ${res.status}`);
  return data as T;
}

export const statementApi = {
  list: () => request<{ lists: StatementListSummary[] }>('/api/statements').then((r) => r.lists),
  get: (id: string) => request<{ list: StatementList }>(`/api/statements/${id}`).then((r) => r.list),
  create: (name: string, statements: string[]) => request<{ list: StatementList; invalid: number }>('/api/statements', { method: 'POST', body: JSON.stringify({ name, statements }) }),
  update: (id: string, name: string, statements: string[]) =>
    request<{ list: StatementList; invalid: number }>(`/api/statements/${id}`, { method: 'PUT', body: JSON.stringify({ name, statements }) }),
  remove: (id: string) => request(`/api/statements/${id}`, { method: 'DELETE' }),
};

/** Zeilen wie der Server zählen (Platzhalter BLUBB, WALTER oder ___) */
export function countLines(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const valid = lines.filter((l) => /BLUBB|WALTER|_{2,}/.test(l)).length;
  return { valid, invalid: lines.length - valid };
}
