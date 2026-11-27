import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { connect, emitAck, sleep, type TestClient } from './helpers';
import { DEFAULT_AVATAR } from '../src/shared/avatar';

process.env.LUMA_DATA_DIR = path.join(os.tmpdir(), `luma-test-${process.pid}`);
delete process.env.DATABASE_URL;
let server: Awaited<ReturnType<typeof import('../src/server/index').startServer>>;

beforeAll(async () => {
  const mod = await import('../src/server/index');
  server = await mod.startServer(0);
});
afterAll(async () => {
  await server?.close();
});

async function setupRoom(names: string[]) {
  const host = await connect(server.port);
  const created = await emitAck<{ code: string; hostToken: string }>(host, 'host:create');
  if (!created.ok) throw new Error(created.error);
  const code = created.data.code;
  const players: (TestClient & { id: string; token: string; name: string })[] = [];
  for (const name of names) {
    const c = await connect(server.port);
    const res = await emitAck<{ playerId: string; token: string }>(c, 'player:join', { code, name });
    if (!res.ok) throw new Error(res.error);
    players.push(Object.assign(c, { id: res.data.playerId, token: res.data.token, name }));
  }
  await host.waitFor(() => host.room?.players.length === names.length);
  return { host, code, hostToken: created.data.hostToken, players };
}

describe('Lobby', () => {
  it('erstellt eindeutige Räume und lässt Spieler beitreten', async () => {
    const { host, code, players } = await setupRoom(['Anna', 'Ben']);
    expect(code).toMatch(/^[A-Z]{4}$/);
    expect(host.room!.players.map((p) => p.name)).toEqual(['Anna', 'Ben']);
    // erster Spieler hat Auswahlberechtigung
    expect(host.room!.controllerId).toBe(players[0]!.id);

    // doppelter Name wird abgelehnt
    const dup = await connect(server.port);
    const res = await emitAck(dup, 'player:join', { code, name: 'anna' });
    expect(res.ok).toBe(false);
    // falscher Code
    const res2 = await emitAck(dup, 'player:join', { code: 'ZZZZ', name: 'Carl' });
    expect(res2.ok).toBe(false);
    dup.close();

    // Nicht-Controller darf kein Spiel wählen
    players[1]!.socket.emit('room:selectGame', { gameId: 'imposter' });
    await sleep(100);
    expect(host.room!.selectedGameId).toBe('montagsmaler');
    // Controller darf
    players[0]!.socket.emit('room:selectGame', { gameId: 'imposter' });
    await host.waitFor(() => host.room!.selectedGameId === 'imposter');
    // Host übernimmt -> Controller gesperrt
    host.socket.emit('room:setHostControl', { enabled: true });
    await host.waitFor(() => host.room!.hostHasControl);
    players[0]!.socket.emit('room:selectGame', { gameId: 'montagsmaler' });
    await sleep(100);
    expect(host.room!.selectedGameId).toBe('imposter');
    host.socket.emit('room:selectGame', { gameId: 'montagsmaler' });
    await host.waitFor(() => host.room!.selectedGameId === 'montagsmaler');
    // Coming-soon-Spiel lässt sich nicht starten
    host.socket.emit('room:selectGame', { gameId: 'imposter' });
    await host.waitFor(() => host.room!.selectedGameId === 'imposter');
    const start = await emitAck(host, 'room:startGame');
    expect(start.ok).toBe(false);

    // Controller verlässt -> Berechtigung wandert weiter
    players[0]!.socket.emit('player:leave');
    await host.waitFor(() => host.room!.controllerId === players[1]!.id);
    [host, ...players].forEach((c) => c.close());
  });

  it('Spieler können nach Verbindungsabbruch wieder beitreten', async () => {
    const { host, code, players } = await setupRoom(['Anna', 'Ben']);
    players[0]!.close();
    await host.waitFor(() => host.room!.players.find((p) => p.name === 'Anna')?.isConnected === false);
    const again = await connect(server.port);
    const res = await emitAck<{ playerId: string }>(again, 'player:resume', { code, token: players[0]!.token });
    expect(res.ok && res.data.playerId).toBe(players[0]!.id);
    await host.waitFor(() => host.room!.players.find((p) => p.name === 'Anna')?.isConnected === true);
    [host, again, ...players].forEach((c) => c.close());
  });
});

describe('Gast-Avatar', () => {
  it('Gäste bringen beim Beitreten einen Avatar mit und können ihn ändern', async () => {
    const { host, code, players } = await setupRoom(['Anna']);
    expect(host.room!.players[0]!.avatar).toBeNull();
    const avatar = { ...DEFAULT_AVATAR, shape: 3, color: 2, extra: 5 };
    const c = await connect(server.port);
    const res = await emitAck<{ playerId: string }>(c, 'player:join', { code, name: 'Ben', avatar });
    expect(res.ok).toBe(true);
    await host.waitFor(() => host.room!.players.length === 2);
    expect(host.room!.players.find((p) => p.name === 'Ben')!.avatar).toEqual(avatar);
    // ungültiger Avatar wird ignoriert
    const bad = await connect(server.port);
    await emitAck(bad, 'player:join', { code, name: 'Cleo', avatar: { v: 2, shape: 99 } });
    await host.waitFor(() => host.room!.players.length === 3);
    expect(host.room!.players.find((p) => p.name === 'Cleo')!.avatar).toBeNull();
    // in der Lobby ändern
    players[0]!.socket.emit('player:setAvatar', { avatar: { ...avatar, mouth: 4 } });
    await host.waitFor(() => host.room!.players.find((p) => p.name === 'Anna')!.avatar?.mouth === 4);
    [host, c, bad, ...players].forEach((x) => x.close());
  });
});

describe('Spielmenü', () => {
  it('wird zwischen Fernseher und Spielleitung abgeglichen und beim Start geschlossen', async () => {
    const { host, players } = await setupRoom(['Anna', 'Ben']);
    const [lead, other] = players as [TestClient, TestClient];
    expect(host.room!.menu).toBeNull();
    // Nicht-Spielleitung darf nicht
    other.socket.emit('room:openMenu', { gameId: 'plopp' });
    await sleep(100);
    expect(host.room!.menu).toBeNull();
    lead.socket.emit('room:openMenu', { gameId: 'plopp' });
    await host.waitFor(() => host.room!.menu?.gameId === 'plopp');
    expect(host.room!.menu).toEqual({ gameId: 'plopp', view: 'title' });
    expect(host.room!.selectedGameId).toBe('plopp');
    lead.socket.emit('room:menuView', { view: 'settings' });
    await host.waitFor(() => host.room!.menu?.view === 'settings');
    // ungültige Seiten werden ignoriert
    lead.socket.emit('room:menuView', { view: 'BÖSE <script>' });
    lead.socket.emit('room:menuView', { view: '' });
    await sleep(100);
    expect(host.room!.menu?.view).toBe('settings');
    // Host übernimmt → Handy darf nicht mehr
    host.socket.emit('room:setHostControl', { enabled: true });
    await host.waitFor(() => host.room!.hostHasControl);
    lead.socket.emit('room:menuView', { view: 'rules' });
    await sleep(100);
    expect(host.room!.menu?.view).toBe('settings');
    host.socket.emit('room:menuView', { view: 'title' });
    await host.waitFor(() => host.room!.menu?.view === 'title');
    // Start schließt das Menü
    expect((await emitAck(host, 'room:startGame')).ok).toBe(true);
    await host.waitFor(() => host.room!.phase === 'playing');
    expect(host.room!.menu).toBeNull();
    host.socket.emit('room:backToLauncher');
    await host.waitFor(() => host.room!.phase === 'lobby');
    host.socket.emit('room:openMenu', { gameId: 'wort' });
    await host.waitFor(() => host.room!.menu?.gameId === 'wort');
    host.socket.emit('room:closeMenu');
    await host.waitFor(() => host.room!.menu === null);
    [host, ...players].forEach((c) => c.close());
  });
});

describe('Willkommensbildschirm', () => {
  it('ist am Anfang offen, Spielleitung oder Fernseher schließen ihn, Beitreten-Knopf öffnet ihn wieder', async () => {
    const { host, players } = await setupRoom(['Anna', 'Ben']);
    const [lead, other] = players as [TestClient, TestClient];
    expect(host.room!.welcome).toBe(true);
    other.socket.emit('room:setWelcome', { open: false });
    await sleep(100);
    expect(host.room!.welcome).toBe(true);
    lead.socket.emit('room:setWelcome', { open: false });
    await host.waitFor(() => host.room!.welcome === false);
    host.socket.emit('room:setWelcome', { open: true });
    await host.waitFor(() => host.room!.welcome === true);
    // ein Spielmenü zu öffnen schließt ihn ebenfalls
    host.socket.emit('room:openMenu', { gameId: 'plopp' });
    await host.waitFor(() => host.room!.menu?.gameId === 'plopp');
    expect(host.room!.welcome).toBe(false);
    [host, ...players].forEach((c) => c.close());
  });
});

describe('Zuschauer-Emotes', () => {
  it('Emotes mit Abklingzeit, Effekt einmal pro Spiel, nur während eines Spiels', async () => {
    const { host, players } = await setupRoom(['Anna', 'Ben', 'Cleo']);
    const got: any[] = [];
    host.socket.on('room:emote', (e) => got.push(e));
    // in der Lobby geht nichts
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'emote', id: 'lachen' })).ok).toBe(false);
    players[0]!.socket.emit('room:selectGame', { gameId: 'schach' });
    await host.waitFor(() => host.room!.selectedGameId === 'schach');
    expect((await emitAck(host, 'room:startGame')).ok).toBe(true);
    await host.waitFor(() => host.room!.phase === 'playing');
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'emote', id: 'lachen' })).ok).toBe(true);
    // zu schnell hintereinander
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'emote', id: 'wow' })).ok).toBe(false);
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'emote', id: 'gibtsnicht' })).ok).toBe(false);
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'effect', id: 'konfetti' })).ok).toBe(true);
    expect((await emitAck(players[2]!, 'player:emote', { kind: 'effect', id: 'laser' })).ok).toBe(false);
    await host.waitFor(() => got.length === 2);
    expect(got.map((e) => [e.kind, e.id, e.playerId])).toEqual([
      ['emote', 'lachen', players[2]!.id],
      ['effect', 'konfetti', players[2]!.id],
    ]);
    [host, ...players].forEach((c) => c.close());
  });
});

describe('Montagsmaler', () => {
  it('kompletter Spielablauf mit geheimem Wort, Punkten und Zeichnen', async () => {
    const { host, players } = await setupRoom(['Anna', 'Ben', 'Cleo']);
    const upd = await emitAck(host, 'room:updateSettings', {
      gameId: 'montagsmaler',
      settings: { rounds: 1, drawTimeSeconds: 30, wordChoices: 1, hints: false },
    });
    expect(upd.ok).toBe(true);
    const started = await emitAck(players[0]!, 'room:startGame');
    expect(started.ok).toBe(true);

    await host.waitFor(() => host.game?.public?.phase === 'drawing');
    const pub = host.game!.public;
    expect(host.game!.private).toBeNull();
    const drawer = players.find((p) => p.id === pub.drawerId)!;
    const guessers = players.filter((p) => p !== drawer);
    await drawer.waitFor(() => drawer.game?.private?.word);
    const word: string = drawer.game!.private.word;
    expect(word.length).toBeGreaterThan(0);

    // Wort darf nirgends öffentlich auftauchen
    expect(JSON.stringify(host.game)).not.toContain(`"${word}"`);
    for (const g of guessers) {
      await g.waitFor(() => g.game?.private?.role === 'guesser');
      expect(g.game!.private.word).toBeNull();
      expect(pub.wordMask.filter((c: string | null) => c === null).length).toBeGreaterThan(0);
    }

    // Nicht-Zeichner darf nicht zeichnen
    guessers[0]!.socket.emit('game:action', { type: 'draw', payload: { ops: [{ k: 's', id: 1, c: 0, w: 9, x: 10, y: 10 }] } });
    await sleep(100);
    expect(host.events.filter((e) => e.name === 'draw')).toHaveLength(0);
    // Zeichner zeichnet
    drawer.socket.emit('game:action', {
      type: 'draw',
      payload: { ops: [{ k: 's', id: 1, c: 3, w: 9, x: 100, y: 100 }, { k: 'p', id: 1, pts: [110, 110, 120, 130] }, { k: 's', id: 2, c: 99, w: 9, x: 1, y: 1 }] },
    });
    const drawEvt = await host.waitFor(() => host.events.find((e) => e.name === 'draw'));
    expect(drawEvt.payload.ops).toHaveLength(2); // ungültige Farbe verworfen

    // falsche Antwort -> Chat
    guessers[0]!.socket.emit('game:action', { type: 'guess', payload: { text: 'bestimmt falsch xyz' } });
    await host.waitFor(() => host.events.find((e) => e.name === 'chat'));
    // richtige Antwort (Groß-/Kleinschreibung egal)
    guessers[0]!.socket.emit('game:action', { type: 'guess', payload: { text: `  ${word.toUpperCase()} ` } });
    await host.waitFor(() => host.game!.public.correctGuesses.length === 1);
    // keine Chat-Bubble mit dem Wort
    expect(host.events.some((e) => e.name === 'chat' && String(e.payload.text).toLowerCase() === word.toLowerCase())).toBe(false);
    // Doppelte Abgabe bringt keine weiteren Punkte
    guessers[0]!.socket.emit('game:action', { type: 'guess', payload: { text: word } });
    await sleep(100);
    expect(host.game!.public.correctGuesses).toHaveLength(1);
    const scoreOf = (id: string) => host.game!.public.scores.find((s: any) => s.playerId === id).score;
    const firstPoints = scoreOf(guessers[0]!.id);
    expect(firstPoints).toBeGreaterThanOrEqual(100);
    expect(scoreOf(drawer.id)).toBe(25);
    // Rater sieht nun das Wort privat
    await guessers[0]!.waitFor(() => guessers[0]!.game?.private?.word === word);

    // Reconnect des Hosts -> Zeichnung wird synchronisiert
    const sync = await connect(server.port);
    const resumed = await emitAck(sync, 'host:resume', { code: host.room!.code, hostToken: (host as any).token ?? '' });
    expect(resumed.ok).toBe(false); // falscher Token wird abgelehnt
    sync.close();

    // zweiter Rater -> alle haben geraten -> Reveal
    guessers[1]!.socket.emit('game:action', { type: 'guess', payload: { text: word } });
    await host.waitFor(() => host.game!.public.phase === 'reveal');
    expect(host.game!.public.reveal.word).toBe(word);
    expect(scoreOf(guessers[1]!.id)).toBeLessThan(firstPoints + 1);
    expect(scoreOf(drawer.id)).toBe(50);
    [host, ...players].forEach((c) => c.close());
  });

  it('synchronisiert die Zeichnung beim Wiederverbinden und beendet das Spiel mit Rangliste', async () => {
    const { host, code, hostToken, players } = await setupRoom(['Anna', 'Ben']);
    await emitAck(host, 'room:updateSettings', { gameId: 'montagsmaler', settings: { rounds: 1, drawTimeSeconds: 30, wordChoices: 3 } });
    expect((await emitAck(host, 'room:startGame')).ok).toBe(true);
    await host.waitFor(() => host.game?.public?.phase === 'choosing');
    const drawer = players.find((p) => p.id === host.game!.public.drawerId)!;
    const guesser = players.find((p) => p !== drawer)!;
    await drawer.waitFor(() => drawer.game?.private?.choices?.length === 3);
    const choice = drawer.game!.private.choices[1];
    drawer.socket.emit('game:action', { type: 'chooseWord', payload: { index: 1 } });
    await drawer.waitFor(() => drawer.game?.private?.word === choice);
    drawer.socket.emit('game:action', { type: 'draw', payload: { ops: [{ k: 's', id: 5, c: 0, w: 4, x: 1, y: 2 }] } });
    await host.waitFor(() => host.events.find((e) => e.name === 'draw'));

    // Host-Bildschirm lädt neu
    host.close();
    const host2 = await connect(server.port);
    const res = await emitAck(host2, 'host:resume', { code, hostToken });
    expect(res.ok).toBe(true);
    const sync = await host2.waitFor(() => host2.events.find((e) => e.name === 'canvas-sync'));
    expect(sync.payload.strokes).toHaveLength(1);

    // beide Runden durchspielen: Rater rät richtig
    guesser.socket.emit('game:action', { type: 'guess', payload: { text: choice } });
    await host2.waitFor(() => host2.game!.public.phase === 'reveal');
    // nach Reveal zeichnet der zweite Spieler; wir warten auf dessen Zug
    await host2.waitFor(() => host2.game!.public.phase !== 'reveal' && host2.game!.public.drawerId === guesser.id, 10000);
    expect(host2.game!.public.round).toBe(1);
    host2.socket.emit('room:backToLauncher');
    await host2.waitFor(() => host2.room!.phase === 'lobby');
    [host2, ...players].forEach((c) => c.close());
  });
});
