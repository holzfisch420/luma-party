import { describe, expect, it } from 'vitest';
import { PosterService, IMAGE_BASE } from '../src/server/kino/posters';
import { MEDIA } from '../src/games/kino/data/catalog';

/** nachgebaute TMDB-Antworten – prüft die Anfragen und das Zwischenspeichern */
function fakeFetch(handler: (url: URL, init?: RequestInit) => unknown) {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const f = (async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    calls.push({ url, init });
    return new Response(JSON.stringify(handler(url, init)), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}

describe('Couch-Match – Cover (TMDB)', () => {
  const film = MEDIA.find((m) => m.title === 'Inception')!;
  const serie = MEDIA.find((m) => m.title === 'Breaking Bad')!;

  it('ohne Schlüssel: aus, keine Anfragen', async () => {
    const { f, calls } = fakeFetch(() => ({ results: [] }));
    const s = new PosterService(undefined, f);
    expect(s.enabled).toBe(false);
    expect(await s.poster(film.id)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('Film über /search/movie mit Jahr und deutscher Sprache; Ergebnis wird gemerkt', async () => {
    const { f, calls } = fakeFetch(() => ({ results: [{ poster_path: null }, { poster_path: '/abc.jpg' }] }));
    const s = new PosterService('kurzerschluessel', f);
    expect(await s.poster(film.id)).toBe(`${IMAGE_BASE}/abc.jpg`);
    expect(await s.poster(film.id)).toBe(`${IMAGE_BASE}/abc.jpg`);
    expect(calls).toHaveLength(1);
    const u = calls[0]!.url;
    expect(u.pathname).toBe('/3/search/movie');
    expect(u.searchParams.get('query')).toBe('Inception');
    expect(u.searchParams.get('year')).toBe('2010');
    expect(u.searchParams.get('language')).toBe('de-DE');
    expect(u.searchParams.get('api_key')).toBe('kurzerschluessel');
  });

  it('Serie über /search/tv; langer Token als Bearer-Header; ohne Treffer nochmal ohne Jahr', async () => {
    const token = 'eyJ' + 'x'.repeat(60);
    let n = 0;
    const { f, calls } = fakeFetch(() => (n++ === 0 ? { results: [] } : { results: [{ poster_path: '/bb.jpg' }] }));
    const s = new PosterService(token, f);
    expect(await s.poster(serie.id)).toBe(`${IMAGE_BASE}/bb.jpg`);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.url.pathname).toBe('/3/search/tv');
    expect(calls[0]!.url.searchParams.get('first_air_date_year')).toBe('2008');
    expect(calls[1]!.url.searchParams.has('first_air_date_year')).toBe(false);
    expect(calls[0]!.url.searchParams.has('api_key')).toBe(false);
    expect((calls[0]!.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
  });
});
