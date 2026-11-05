/** Startpunkt für `npm run dev` und `npm start` (auch auf Hosting-Anbietern). */
import { lanAddresses, PUBLIC_MODE, startServer } from './index';

const isProd = process.env.NODE_ENV === 'production';

startServer().then(({ port }) => {
  console.log(`\n  Luma Party Server läuft auf Port ${port}`);
  if (PUBLIC_MODE) {
    console.log('  Online-Modus aktiv (Wortlisten pro Gerät privat, Missbrauchsschutz an)');
  } else if (isProd) {
    console.log(`  ➜ Hauptbildschirm: http://localhost:${port}/host`);
    for (const ip of lanAddresses()) console.log(`  ➜ Smartphones:     http://${ip}:${port}/play`);
  } else {
    console.log('  (Entwicklung: Frontend über Vite auf Port 5173)');
  }
  console.log('');
});
