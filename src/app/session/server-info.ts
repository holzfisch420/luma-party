/** Infos über den Server (Online- oder Heimnetz-Modus, LAN-Adressen) – einmal pro Seitenaufruf geladen. */
export interface ServerInfo {
  lanAddresses: string[];
  publicMode: boolean;
}

let cached: Promise<ServerInfo> | null = null;

export function getServerInfo(): Promise<ServerInfo> {
  cached ??= fetch('/api/info')
    .then((r) => r.json() as Promise<ServerInfo>)
    .catch(() => {
      cached = null;
      return { lanAddresses: [], publicMode: false };
    });
  return cached;
}
