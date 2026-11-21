import { useEffect, useState } from 'react';

/** Cover-Adressen vom Server (TMDB); leer, solange keine da sind oder der Server keinen Schlüssel hat */
const cache = new Map<string, string | null>();
let enabled: boolean | null = null;

export function usePosters(ids: string[]): Record<string, string | null> {
  const key = ids.join(',');
  const [map, setMap] = useState<Record<string, string | null>>(() => Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id)!])));
  useEffect(() => {
    if (!ids.length || enabled === false) return;
    const missing = ids.filter((id) => !cache.has(id));
    const apply = () => setMap(Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id)!])));
    if (!missing.length) return apply();
    let alive = true;
    // in Paketen, damit die Adresse nicht zu lang wird
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += 30) chunks.push(missing.slice(i, i + 30));
    void Promise.all(
      chunks.map((c) =>
        fetch(`/api/kino/posters?ids=${encodeURIComponent(c.join(','))}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { enabled: boolean; posters: Record<string, string | null> } | null) => {
            if (!d) return;
            enabled = d.enabled;
            for (const [id, url] of Object.entries(d.posters)) cache.set(id, url);
          })
          .catch(() => {}),
      ),
    ).then(() => alive && apply());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

/** Bilder schon mal laden, damit beim Wischen nichts aufploppt */
export function preloadPosters(urls: (string | null | undefined)[]) {
  for (const u of urls) if (u) new Image().src = u;
}
