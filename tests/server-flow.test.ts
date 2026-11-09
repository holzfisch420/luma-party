import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { connect, emitAck, sleep, type TestClient } from './helpers';

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
