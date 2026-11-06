import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, emitAck } from './helpers';

let server: Awaited<ReturnType<typeof import('../src/server/index').startServer>>;
let base = '';

beforeAll(async () => {
  const mod = await import('../src/server/index');
  server = await mod.startServer({ port: 0, dataDir: null, databaseUrl: null, publicMode: true });
  base = `http://localhost:${server.port}`;
});
afterAll(async () => {
  await server?.close();
});

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const api = (owner: string | null, path: string, init?: RequestInit) =>
  fetch(`${base}/api/word-lists${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(owner ? { 'X-Luma-Owner': owner } : {}) },
  });

describe('Online-Modus', () => {
  it('Wortlisten sind pro Gerät privat', async () => {
    expect((await api(null, '/')).status).toBe(400);
    const created = await (await api(A, '/', { method: 'POST', body: JSON.stringify({ name: 'Geheim', words: [{ word: 'Rakete' }] }) })).json();
    expect(created.list.owner).toBeUndefined();
    const listA = await (await api(A, '/')).json();
    const listB = await (await api(B, '/')).json();
    expect(listA.lists).toHaveLength(1);
    expect(listB.lists).toHaveLength(0);
    // fremde Liste weder lesen noch ändern/löschen
    expect((await api(B, `/${created.list.id}`)).status).toBe(404);
    expect((await api(B, `/${created.list.id}`, { method: 'DELETE' })).status).toBe(400);
    expect((await api(A, `/${created.list.id}`)).status).toBe(200);
  });

  it('stellt Listen aus der Gerätesicherung wieder her', async () => {
    const id = '11111111-2222-4333-8444-555555555555';
    const body = { lists: [{ id, name: 'Backup', words: [{ word: 'Schneemann' }, { word: 'Iglu', category: 'Orte' }] }] };
    const r1 = await (await api(B, '/restore', { method: 'POST', body: JSON.stringify(body) })).json();
    expect(r1.restored).toBe(1);
    const r2 = await (await api(B, '/restore', { method: 'POST', body: JSON.stringify(body) })).json();
    expect(r2.restored).toBe(0); // keine Duplikate
    const exported = await (await api(B, '/export')).json();
    expect(exported.lists[0].words.map((w: { word: string }) => w.word)).toEqual(['Schneemann', 'Iglu']);
    // Gerät A sieht die Liste nicht
    expect((await (await api(A, '/')).json()).lists.some((l: { id: string }) => l.id === id)).toBe(false);
  });

  it('begrenzt Fehlversuche beim Beitreten', async () => {
    const c = await connect(server.port);
    let blocked = false;
    for (let i = 0; i < 40; i++) {
      const res = await emitAck(c, 'player:join', { code: 'ZZZZ', name: 'X' });
      if (!res.ok && res.error.includes('Zu viele')) blocked = true;
    }
    expect(blocked).toBe(true);
    c.close();
  });
});
