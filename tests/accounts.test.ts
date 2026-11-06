import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomAvatar } from '../src/shared/avatar';
import { connect, emitAck } from './helpers';

let server: Awaited<ReturnType<typeof import('../src/server/index').startServer>>;
let base = '';

beforeAll(async () => {
  const mod = await import('../src/server/index');
  server = await mod.startServer({ port: 0, dataDir: null, databaseUrl: null });
  base = `http://localhost:${server.port}`;
});
afterAll(async () => {
  await server?.close();
});

const post = (path: string, body: unknown, token?: string, method = 'POST') =>
  fetch(`${base}/api/auth${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

describe('Konten', () => {
  it('registrieren, anmelden, Avatar speichern, Passwort ändern, löschen', async () => {
    expect((await post('/register', { username: 'ab', password: 'geheim1' })).status).toBe(400);
    expect((await post('/register', { username: 'Lena', password: '123' })).status).toBe(400);
    const reg = await (await post('/register', { username: 'Lena', password: 'geheim123' })).json();
    expect(reg.token).toBeTruthy();
    expect(reg.account.username).toBe('Lena');
    expect(JSON.stringify(reg)).not.toContain('scrypt');
    // Name ist eindeutig (ohne Groß-/Kleinschreibung)
    expect((await post('/register', { username: 'lena', password: 'geheim123' })).status).toBe(400);
    // falsches Passwort
    expect((await post('/login', { username: 'LENA', password: 'falsch!!' })).status).toBe(400);
    const login = await (await post('/login', { username: 'LENA', password: 'geheim123' })).json();
    expect(login.account.id).toBe(reg.account.id);

    const me = await (await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${login.token}` } })).json();
    expect(me.account.username).toBe('Lena');
    expect((await fetch(`${base}/api/auth/me`, { headers: { Authorization: 'Bearer kaputt.token' } })).status).toBe(401);

    const avatar = randomAvatar();
    const saved = await (await post('/me/avatar', { avatar }, login.token, 'PUT')).json();
    expect(saved.account.avatar).toEqual(avatar);
    expect((await post('/me/avatar', { avatar: { ...avatar, hair: 999 } }, login.token, 'PUT')).status).toBe(400);

    // Passwort ändern macht alte Anmeldungen ungültig
    const changed = await (await post('/me/password', { oldPassword: 'geheim123', newPassword: 'neuesPW1' }, login.token)).json();
    expect((await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${login.token}` } })).status).toBe(401);
    expect((await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${changed.token}` } })).status).toBe(200);

    expect((await post('/me', { password: 'falsch' }, changed.token, 'DELETE')).status).toBe(400);
    expect((await post('/me', { password: 'neuesPW1' }, changed.token, 'DELETE')).status).toBe(200);
    expect((await post('/login', { username: 'Lena', password: 'neuesPW1' })).status).toBe(400);
  });

  it('Spieler mit Konto treten mit Name und Avatar bei – auch von einem zweiten Gerät', async () => {
    const avatar = randomAvatar();
    const reg = await (await post('/register', { username: 'Paul', password: 'passwort1', avatar })).json();
    const host = await connect(server.port);
    const created = await emitAck<{ code: string }>(host, 'host:create');
    if (!created.ok) throw new Error();
    const code = created.data.code;

    const phone = await connect(server.port);
    const joined = await emitAck<{ playerId: string }>(phone, 'player:join', { code, name: 'egal', authToken: reg.token });
    expect(joined.ok).toBe(true);
    await host.waitFor(() => host.room?.players.length === 1);
    const p = host.room!.players[0]!;
    expect(p.name).toBe('Paul');
    expect(p.hasAccount).toBe(true);
    expect(p.avatar).toEqual(avatar);

    // Gast darf den Namen eines Konto-Spielers nicht übernehmen
    const guest = await connect(server.port);
    expect((await emitAck(guest, 'player:join', { code, name: 'paul' })).ok).toBe(false);
    // ungültiges Token
    expect((await emitAck(guest, 'player:join', { code, name: 'x', authToken: 'abc.def' })).ok).toBe(false);

    // gleiches Konto auf zweitem Gerät übernimmt den Platz
    const tablet = await connect(server.port);
    const again = await emitAck<{ playerId: string }>(tablet, 'player:join', { code, name: '', authToken: reg.token });
    expect(again.ok && again.data.playerId).toBe(joined.ok && joined.data.playerId);
    expect(host.room!.players).toHaveLength(1);

    // Avatar ändern → im Raum aktualisieren
    const newAvatar = randomAvatar();
    await post('/me/avatar', { avatar: newAvatar }, reg.token, 'PUT');
    tablet.socket.emit('player:refreshProfile', { authToken: reg.token });
    await host.waitFor(() => JSON.stringify(host.room!.players[0]!.avatar) === JSON.stringify(newAvatar));
    // Gast meldet sich in der Lobby an → Platz wird mit dem Konto verknüpft
    const reg2 = await (await post('/register', { username: 'Greta', password: 'passwort1' })).json();
    const g2 = await connect(server.port);
    const gj = await emitAck<{ playerId: string }>(g2, 'player:join', { code, name: 'Gast123' });
    expect(gj.ok).toBe(true);
    g2.socket.emit('player:refreshProfile', { authToken: reg2.token });
    await host.waitFor(() => host.room!.players.find((p) => p.name === 'Greta')?.hasAccount);
    expect(host.room!.players).toHaveLength(2);
    [host, phone, guest, tablet, g2].forEach((c) => c.close());
  });
});
