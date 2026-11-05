/**
 * Baut Luma Party als eigenständiges Programm (keine Installation von Node.js nötig).
 *   node scripts/build-desktop.mjs            → alle Plattformen
 *   node scripts/build-desktop.mjs windows    → nur Windows
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'release');
const GENERATED = path.join(ROOT, 'src/desktop/assets.generated.ts');
const STUB = "// Wird von `npm run desktop` mit dem gebauten Frontend überschrieben.\nexport const ASSETS: Record<string, { type: string; data: string }> = {};\n";

const TARGETS = {
  windows: { target: 'bun-windows-x64', file: 'LumaParty-Windows.exe' },
  'mac-arm': { target: 'bun-darwin-arm64', file: 'LumaParty-Mac-AppleSilicon' },
  'mac-intel': { target: 'bun-darwin-x64', file: 'LumaParty-Mac-Intel' },
  linux: { target: 'bun-linux-x64', file: 'LumaParty-Linux' },
};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

const wanted = process.argv.slice(2);
const targets = wanted.length ? wanted.map((w) => [w, TARGETS[w]]).filter(([, t]) => t) : Object.entries(TARGETS);

const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

console.log('▸ Frontend bauen …');
sh('npx vite build');

console.log('▸ Frontend einbetten …');
const assets = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else {
      const rel = '/' + path.relative(DIST, full).split(path.sep).join('/');
      assets[rel] = { type: MIME[path.extname(name)] ?? 'application/octet-stream', data: readFileSync(full).toString('base64') };
    }
  }
};
walk(DIST);
writeFileSync(GENERATED, `// automatisch erzeugt – nicht bearbeiten\nexport const ASSETS: Record<string, { type: string; data: string }> = ${JSON.stringify(assets)};\n`);

try {
  mkdirSync(OUT, { recursive: true });
  for (const [name, { target, file }] of targets) {
    console.log(`▸ Programm für ${name} erstellen …`);
    rmSync(path.join(OUT, file), { force: true });
    sh(`npx bun build src/desktop/main.ts --compile --minify --target=${target} --outfile "${path.join(OUT, file)}"`);
  }
  copyFileSync(path.join(ROOT, 'docs/ANLEITUNG.txt'), path.join(OUT, 'ANLEITUNG.txt'));
} finally {
  writeFileSync(GENERATED, STUB);
}
console.log(`\n✓ Fertig: ${OUT}`);
