/**
 * Holt einmalig die Cover-Pfade aller Couch-Match-Titel von TMDB und schreibt sie nach
 * src/games/kino/data/posters.ts. Danach braucht die App keinen Schlüssel mehr.
 *
 *   TMDB_API_KEY=<Schlüssel oder Lesezugriffstoken> npm run posters
 *   (vorhandene Einträge bleiben, mit --all wird alles neu geholt)
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { MEDIA } from '../src/games/kino/data/catalog';
import { POSTER_PATHS } from '../src/games/kino/data/posters';
import { IMAGE_BASE, PosterService } from '../src/server/kino/posters';

const key = process.env.TMDB_API_KEY?.trim();
if (!key) {
  console.error('TMDB_API_KEY fehlt.');
  process.exit(1);
}
const all = process.argv.includes('--all');
// eigener Dienst ohne die gespeicherten Pfade, damit wirklich bei TMDB gefragt wird
const service = new PosterService(key);
(service as unknown as { precomputed: Record<string, string | null> }).precomputed = {};

const out: Record<string, string | null> = all ? {} : { ...POSTER_PATHS };
const todo = MEDIA.filter((m) => all || !(m.id in out) || out[m.id] === null);
let found = 0;
for (let i = 0; i < todo.length; i += 8) {
  const batch = todo.slice(i, i + 8);
  const res = await Promise.all(batch.map(async (m) => [m.id, await service.poster(m.id)] as const));
  for (const [id, url] of res) {
    out[id] = url ? url.slice(IMAGE_BASE.length) : null;
    if (url) found++;
  }
  process.stdout.write(`\r${Math.min(i + 8, todo.length)}/${todo.length} – ${found} Cover`);
  await new Promise((r) => setTimeout(r, 250)); // TMDB schonen
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
const file = path.resolve('src/games/kino/data/posters.ts');
writeFileSync(
  file,
  `/** Vorab geholte Cover-Pfade von TMDB (id → Pfad unter image.tmdb.org/t/p/…). Erzeugt mit \`npm run posters\`. */\nexport const POSTER_PATHS: Record<string, string | null> = ${JSON.stringify(sorted, null, 2)};\n`,
);
console.log(`\nfertig: ${Object.values(sorted).filter(Boolean).length} von ${MEDIA.length} Titeln haben ein Cover → ${file}`);
