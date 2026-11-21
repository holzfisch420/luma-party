/**
 * Cover für „Couch-Match“ über TMDB (The Movie Database).
 *
 * Aktiv, sobald auf dem Server TMDB_API_KEY gesetzt ist – entweder der kurze „API-Schlüssel“ (v3)
 * oder der lange „API-Lesezugriffstoken“ (v4). Ergebnisse werden im Speicher gehalten,
 * jeder Titel wird also nur einmal nachgeschlagen. Ohne Schlüssel zeigt das Spiel gezeichnete Karten.
 *
 * „This product uses the TMDB API but is not endorsed or certified by TMDB.“
 */
import { Router } from 'express';
import { MEDIA_BY_ID, type Media } from '../../games/kino/data/catalog';
import { POSTER_PATHS } from '../../games/kino/data/posters';

const API = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

type Fetch = typeof fetch;

/** Titel, die TMDB unter anderem Namen führt (deutsche Suche findet sie nicht) */
export const SEARCH_ALIASES: Record<string, string> = {
  'Der Herr der Ringe: Die Rückkehr des Königs': 'The Lord of the Rings: The Return of the King',
  'Mrs. Doubtfire – Das stachelige Kindermädchen': 'Mrs. Doubtfire',
  'Der große Lebowski': 'The Big Lebowski',
  'Die Minions': 'Minions',
  'Sing – Die Show deines Lebens': 'Sing',
};

interface Hit {
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

/** Treffer mit Cover und dem Jahr, das am besten passt */
function bestHit(results: Hit[], year: number): Hit | undefined {
  const withPoster = results.filter((r) => r.poster_path);
  const y = (r: Hit) => Number((r.release_date ?? r.first_air_date ?? '').slice(0, 4)) || 0;
  // bei gleichem Abstand gewinnt TMDBs eigene Reihenfolge (Beliebtheit)
  return withPoster.reduce<Hit | undefined>((best, r) => (!best || Math.abs(y(r) - year) < Math.abs(y(best) - year) ? r : best), undefined);
}

export class PosterService {
  private cache = new Map<string, string | null>();
  private pending = new Map<string, Promise<string | null>>();

  constructor(
    private readonly key: string | undefined,
    private readonly fetcher: Fetch = fetch,
  ) {}

  /** vorab geholte Cover (im Projekt gespeichert) – funktionieren auch ohne Schlüssel */
  private readonly precomputed: Record<string, string | null> = POSTER_PATHS;

  get enabled(): boolean {
    return !!this.key || Object.keys(this.precomputed).length > 0;
  }

  private async search(path: string, params: Record<string, string>): Promise<Hit[]> {
    const key = this.key!;
    // langer Lesezugriffstoken (JWT) → Header, kurzer Schlüssel → Parameter
    const bearer = key.length > 40;
    const qs = new URLSearchParams({ ...params, language: 'de-DE', include_adult: 'false', ...(bearer ? {} : { api_key: key }) });
    const res = await this.fetcher(`${API}${path}?${qs}`, {
      headers: { accept: 'application/json', ...(bearer ? { Authorization: `Bearer ${key}` } : {}) },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = (await res.json()) as { results?: Hit[] };
    return data.results ?? [];
  }

  private async lookup(m: Media): Promise<string | null> {
    const plain = m.title.replace(/\s*\((Neuverfilmung|Extended)\)\s*$/i, '');
    const query = SEARCH_ALIASES[plain] ?? plain;
    const isFilm = m.type === 'film';
    const path = isFilm ? '/search/movie' : '/search/tv';
    const yearKey = isFilm ? 'year' : 'first_air_date_year';
    let results = await this.search(path, { query, [yearKey]: String(m.year) });
    // Jahr manchmal leicht verschieden (Festival vs. Kinostart) → ohne Jahr nochmal
    if (!results.some((r) => r.poster_path)) results = await this.search(path, { query });
    const hit = bestHit(results, m.year);
    return hit?.poster_path ? `${IMAGE_BASE}${hit.poster_path}` : null;
  }

  /** Cover-Adresse eines Titels (null = keins gefunden bzw. ohne Schlüssel) */
  async poster(id: string): Promise<string | null> {
    const pre = this.precomputed[id];
    if (pre !== undefined) return pre ? `${IMAGE_BASE}${pre}` : null;
    if (!this.key) return null;
    if (this.cache.has(id)) return this.cache.get(id)!;
    const m = MEDIA_BY_ID.get(id);
    if (!m) return null;
    let p = this.pending.get(id);
    if (!p) {
      p = this.lookup(m)
        .then((url) => {
          this.cache.set(id, url);
          return url;
        })
        .catch(() => null) // Netzfehler nicht merken – beim nächsten Mal neu versuchen
        .finally(() => this.pending.delete(id));
      this.pending.set(id, p);
    }
    return p;
  }
}

/** GET /api/kino/posters?ids=a,b,c → { enabled, posters: { id: url | null } } */
export function createPosterRouter(service: PosterService) {
  const router = Router();
  router.get('/posters', async (req, res) => {
    const ids = String(req.query.ids ?? '')
      .split(',')
      .filter((id) => MEDIA_BY_ID.has(id))
      .slice(0, 40);
    const entries = await Promise.all(ids.map(async (id) => [id, await service.poster(id)] as const));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({ enabled: service.enabled, posters: Object.fromEntries(entries) });
  });
  return router;
}
