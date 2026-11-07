/** Client für die Skript-Ablage (/api/scripts) */
import { ownerHeaders } from '../../components/word-manager/word-api';
import type { Script, ScriptSummary } from './types';
import type { ScriptUpload } from './game-config';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...ownerHeaders(), ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fehler ${res.status}`);
  return data as T;
}

export const scriptApi = {
  list: () => request<{ scripts: ScriptSummary[] }>('/api/scripts').then((r) => r.scripts),
  create: (upload: ScriptUpload) => request<{ script: Script }>('/api/scripts', { method: 'POST', body: JSON.stringify(upload) }).then((r) => r.script),
  rename: (id: string, title: string) => request(`/api/scripts/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  remove: (id: string) => request(`/api/scripts/${id}`, { method: 'DELETE' }),
};
