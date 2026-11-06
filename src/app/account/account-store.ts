/**
 * Clientseitiger Kontozustand: Anmelde-Token im localStorage, Kontodaten im Speicher.
 */
import { useSyncExternalStore } from 'react';
import type { AvatarConfig } from '../../shared/avatar';
import type { AuthResponse, PublicAccount } from '../../shared/types/account';

const TOKEN_KEY = 'luma.auth-token';

export interface AccountState {
  status: 'unknown' | 'guest' | 'signed-in';
  account: PublicAccount | null;
  token: string | null;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignorieren */
  }
}

let state: AccountState = { status: readToken() ? 'unknown' : 'guest', account: null, token: readToken() };
const listeners = new Set<() => void>();
const set = (patch: Partial<AccountState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

async function api<T>(path: string, init: RequestInit = {}, token = state.token): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    signOut();
    throw new Error((data as { error?: string }).error ?? 'Bitte melde dich erneut an.');
  }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Fehler ${res.status}`);
  return data as T;
}

let checking: Promise<void> | null = null;

/** beim Start einmal prüfen, ob das gespeicherte Token noch gültig ist */
export function ensureAccountLoaded(): Promise<void> {
  if (state.status !== 'unknown') return Promise.resolve();
  checking ??= api<{ account: PublicAccount }>('/me')
    .then(({ account }) => set({ status: 'signed-in', account }))
    .catch(() => {
      // offline? Token behalten, aber als Gast weitermachen
      if (state.status === 'unknown') set({ status: 'guest' });
    })
    .finally(() => (checking = null));
  return checking;
}

function applyAuth(res: AuthResponse) {
  writeToken(res.token);
  set({ status: 'signed-in', account: res.account, token: res.token });
}

export const accountActions = {
  async register(username: string, password: string, avatar?: AvatarConfig) {
    applyAuth(await api<AuthResponse>('/register', { method: 'POST', body: JSON.stringify({ username, password, avatar }) }, null));
  },
  async login(username: string, password: string) {
    applyAuth(await api<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }, null));
  },
  async saveAvatar(avatar: AvatarConfig) {
    const { account } = await api<{ account: PublicAccount }>('/me/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) });
    set({ account });
    return account;
  },
  async changePassword(oldPassword: string, newPassword: string) {
    applyAuth(await api<AuthResponse>('/me/password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }));
  },
  async deleteAccount(password: string) {
    await api('/me', { method: 'DELETE', body: JSON.stringify({ password }) });
    signOut();
  },
  signOut,
};

function signOut() {
  writeToken(null);
  set({ status: 'guest', account: null, token: null });
}

export function getAuthToken(): string | null {
  return state.status === 'signed-in' ? state.token : null;
}

export function useAccount(): AccountState {
  void ensureAccountLoaded();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state,
  );
}
