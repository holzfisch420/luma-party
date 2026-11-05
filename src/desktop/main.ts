/**
 * Luma Party – Desktop-Programm.
 * Doppelklick genügt: startet den Spielserver, öffnet den Hauptbildschirm
 * und zeigt die Adresse für die Smartphones an. Fenster schließen = beenden.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import path from 'node:path';
import { lanAddresses, startServer, type EmbeddedAssets } from '../server/index';
import { ASSETS } from './assets.generated';

const FIRST_PORT = Number(process.env.PORT ?? 3000);

function dataDir(): string {
  const home = homedir();
  if (platform() === 'win32') return path.join(process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'LumaParty');
  if (platform() === 'darwin') return path.join(home, 'Library', 'Application Support', 'LumaParty');
  return path.join(process.env.XDG_DATA_HOME ?? path.join(home, '.local', 'share'), 'luma-party');
}

async function isLumaRunning(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(800) });
    return res.ok && ((await res.json()) as { ok?: boolean }).ok === true;
  } catch {
    return false;
  }
}

/** Öffnet den Hauptbildschirm – unter Windows als randloses App-Fenster (Microsoft Edge). */
function openHostScreen(url: string) {
  if (process.env.LUMA_NO_BROWSER) return;
  const run = (cmd: string, args: string[]) => {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => {});
    child.unref();
  };
  switch (platform()) {
    case 'win32':
      run('cmd', ['/c', 'start', '', 'msedge', `--app=${url}`, '--start-maximized']);
      break;
    case 'darwin':
      run('open', [url]);
      break;
    default:
      run('xdg-open', [url]);
  }
}

function banner(port: number) {
  const ips = lanAddresses();
  const line = '─'.repeat(58);
  console.log(`\n  ${line}`);
  console.log('   🎉  LUMA PARTY läuft!');
  console.log(`  ${line}\n`);
  console.log(`   Hauptbildschirm (dieser PC):  http://localhost:${port}/host`);
  if (ips.length) {
    console.log(`\n   📱 Smartphones (gleiches WLAN wie dieser PC):`);
    console.log(`      → QR-Code auf dem Bildschirm scannen, oder öffnen:`);
    console.log(`      → http://${ips[0]}:${port}/play`);
  } else {
    console.log('\n   ⚠  Kein Netzwerk gefunden – ist der PC mit dem WLAN verbunden?');
  }
  console.log('\n   Tipp: Fragt Windows nach Netzwerkzugriff, auf „Zulassen“ klicken –');
  console.log('         sonst können die Smartphones nicht beitreten.');
  console.log(`\n   Zum Beenden dieses Fenster schließen.`);
  console.log(`  ${line}\n`);
}

async function main() {
  // Läuft schon? Dann nur den Bildschirm öffnen (z. B. bei doppeltem Doppelklick).
  if (await isLumaRunning(FIRST_PORT)) {
    console.log('Luma Party läuft bereits – öffne den Hauptbildschirm …');
    openHostScreen(`http://localhost:${FIRST_PORT}/host`);
    setTimeout(() => process.exit(0), 1500);
    return;
  }

  const dir = dataDir();
  mkdirSync(dir, { recursive: true });

  let lastError: unknown;
  for (let port = FIRST_PORT; port < FIRST_PORT + 20; port++) {
    try {
      await startServer({ port, dataFile: path.join(dir, 'word-lists.json'), assets: ASSETS as EmbeddedAssets });
      banner(port);
      openHostScreen(`http://localhost:${port}/host`);
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
      lastError = err;
    }
  }
  throw lastError;
}

main().catch((err) => {
  console.error('\n  Luma Party konnte nicht starten:', err);
  console.error('  Dieses Fenster schließt sich in 60 Sekunden.');
  setTimeout(() => process.exit(1), 60_000);
});
