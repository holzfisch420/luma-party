/**
 * Film- und Serienkatalog für „Couch-Match“.
 * Titel und Jahre sind Fakten; die Kurzbeschreibungen sind eigene Zusammenfassungen.
 */
import { FILMS_A } from './films-a';
import { FILMS_B } from './films-b';
import { FILMS_C } from './films-c';
import { SERIES } from './series';

import { GENRES, type Genre } from './genres';

export { GENRES, GENRE_IDS, type Genre } from './genres';

export type MediaType = 'film' | 'serie';

export interface Media {
  id: string;
  title: string;
  type: MediaType;
  year: number;
  genres: Genre[];
  desc: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function build(rows: [string, number, string, string][], type: MediaType): Media[] {
  return rows.map(([title, year, genres, desc]) => ({
    id: `${type[0]}-${slug(title)}-${year}`,
    title,
    type,
    year,
    genres: genres.split(' ').filter((g): g is Genre => g in GENRES),
    desc,
  }));
}

export const MEDIA: Media[] = [...build([...FILMS_A, ...FILMS_B, ...FILMS_C], 'film'), ...build(SERIES, 'serie')];
export const MEDIA_BY_ID = new Map(MEDIA.map((m) => [m.id, m]));

/** Auswahl nach Typ und Genres (leere Genre-Liste = alle) */
export function filterMedia(type: 'beide' | MediaType, genres: Genre[]): Media[] {
  return MEDIA.filter((m) => (type === 'beide' || m.type === type) && (genres.length === 0 || m.genres.some((g) => genres.includes(g))));
}
