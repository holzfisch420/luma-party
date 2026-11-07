import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { castNames, canonicalizeNames, parseDocx, splitSegments } from '../src/games/theater/logic/docx-parser';
import { stepIndex } from '../src/games/theater/game-engine';
import { connect, emitAck } from './helpers';

// ---- kleines Test-Skript als .docx bauen
const run = (t: string, o: { b?: boolean; i?: boolean; pb?: boolean } = {}) =>
  `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}</w:rPr>${o.pb ? '<w:lastRenderedPageBreak/>' : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const p = (...runs: string[]) => `<w:p>${runs.join('')}</w:p>`;
const xml = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body>
${p(run('Szene 1: ', { b: true }), run('Die Werkstatt', { b: true }))}
${p(run('Figuren: ', { b: true, i: true }), run('3 Elfen (Schnipsel, Alph und Knirps), Wiehnachtsma.', { i: true }))}
${p(run('(Der Vorhang geht auf)', { i: true }))}
${p(run('Schnipsel:', { b: true }), run(' Hallo zäme! '), run('(winkt)', { i: true }), run(' Wie gahts?'))}
${p(run('Aplh: '), run('Mir isch langwilig.'))}
${p(run('Wiehnachtsma:', { b: true }), run(' Ho ho ho.'))}
${p(run('Szene 2: Am Abend', { b: true, pb: true }))}
${p(run('Figuren: ', { b: true, i: true }), run('Weihnachtsmann, Alph', { i: true }))}
${p(run('Weihnachstmann:', { b: true }), run(' Gueti Nacht &amp; tschüss.'))}
${p(run('Alph und Knirps:', { b: true }), run(' Gueti Nacht!'))}
${p(run('Alph:', { b: true }), run(' Ende.'))}
</w:body></w:document>`;
const docx = zipSync({ 'word/document.xml': strToU8(xml) });

describe('Textprobe – Skript-Parser', () => {
  const s = parseDocx(docx, 'Mein_Stueck.docx');
  it('erkennt Titel, Szenen, Seiten und Zeilenarten', () => {
    expect(s.title).toBe('Mein Stueck');
    expect(s.scenes.map((x) => [x.number, x.title, x.page])).toEqual([
      [1, 'Die Werkstatt', 1],
      [2, 'Am Abend', 2],
    ]);
    expect(s.pageCount).toBe(2);
    expect(s.lines.map((l) => l.kind)).toEqual(['cast', 'direction', 'dialog', 'dialog', 'dialog', 'cast', 'dialog', 'dialog', 'dialog']);
  });
  it('trennt eingebettete Regieanweisungen und führt Tippfehler zusammen', () => {
    const l = s.lines[2]!;
    expect(l.character).toBe('Schnipsel');
    expect(l.segments).toEqual([
      { k: 'speech', t: 'Hallo zäme!' },
      { k: 'direction', t: '(winkt)' },
      { k: 'speech', t: 'Wie gahts?' },
    ]);
    expect(s.lines[3]!.character).toBe('Alph'); // „Aplh“ (nicht fett) → Alph
    expect(s.lines[6]!.character).toBe(s.lines[4]!.character); // Weihnachstmann = Wiehnachtsma
    expect(s.lines[6]!.segments[0]!.t).toBe('Gueti Nacht & tschüss.');
    expect(s.lines[7]!.character).toBe('Alph, Knirps');
  });
  it('kurze Namen werden nicht vermischt', () => {
    const map = canonicalizeNames(new Map([['Zip', 5], ['Zap', 4], ['Alle', 2], ['Wall-e', 6], ['Ruby', 1], ['Rubi', 9]]), ['Zip', 'Zap', 'Wall-E', 'Rubi']);
    expect(map.get('Zap')).toBe('Zap');
    expect(map.get('Alle')).toBe('Alle');
    expect(map.get('Wall-e')).toBe('Wall-E');
    expect(map.get('Ruby')).toBe('Rubi');
  });
  it('Hilfsfunktionen', () => {
    expect(castNames('Figuren: 3 Elfen (Schnipsel, Alph und Knirps), Hauptgruppe (Spidy, K.O. Karl) Weihnachtsmann.')).toEqual(['Schnipsel', 'Alph', 'Knirps', 'Spidy', 'K.O. Karl', 'Weihnachtsmann']);
    expect(splitSegments('(leise) Hallo (dreht sich um)')).toEqual([
      { k: 'direction', t: '(leise)' },
      { k: 'speech', t: 'Hallo' },
      { k: 'direction', t: '(dreht sich um)' },
    ]);
    const script = { ...s, id: 'x', createdAt: 0 };
    expect(stepIndex(script, 0, 1, true)).toBe(2); // überspringt Regieanweisung
    expect(stepIndex(script, 0, 1, false)).toBe(1);
    expect(stepIndex(script, 0, -1, false)).toBe(0);
  });
});

describe('Textprobe – Server', () => {
  let server: Awaited<ReturnType<typeof import('../src/server/index').startServer>>;
  let base = '';
  beforeAll(async () => {
    const mod = await import('../src/server/index');
    server = await mod.startServer({ port: 0, dataDir: null, databaseUrl: null, publicMode: true });
    base = `http://localhost:${server.port}`;
  });
  afterAll(async () => server?.close());

  const A = 'a'.repeat(24);
  const B = 'b'.repeat(24);
  const api = (owner: string, path: string, init?: RequestInit) =>
    fetch(`${base}/api/scripts${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'X-Luma-Owner': owner } });

  it('Upload ist privat, Probe lässt sich per Handy steuern', async () => {
    const parsed = parseDocx(docx, 'Mein_Stueck.docx');
    const { merged: _m, ...upload } = parsed;
    expect((await api(A, '/', { method: 'POST', body: JSON.stringify({ title: '' }) })).status).toBe(400);
    const created = await (await api(A, '/', { method: 'POST', body: JSON.stringify(upload) })).json();
    expect(created.script.lines).toHaveLength(9);
    expect((await (await api(B, '/')).json()).scripts).toHaveLength(0);
    expect((await api(B, `/${created.script.id}`)).status).toBe(404);

    const host = await connect(server.port);
    const room = await emitAck<{ code: string }>(host, 'host:create');
    if (!room.ok) throw new Error();
    const phone = await connect(server.port);
    await emitAck(phone, 'player:join', { code: room.data.code, name: 'Lea' });
    host.socket.emit('room:selectGame', { gameId: 'textprobe' });
    expect((await emitAck(host, 'room:startGame')).ok).toBe(false); // kein Skript gewählt
    await emitAck(host, 'room:updateSettings', { gameId: 'textprobe', settings: { scriptId: created.script.id } });
    expect((await emitAck(host, 'room:startGame')).ok).toBe(true);
    await host.waitFor(() => host.room?.phase === 'playing');
    await host.waitFor(() => host.events.find((e) => e.name === 'script'));
    await phone.waitFor(() => phone.events.find((e) => e.name === 'script'));
    await host.waitFor(() => host.game?.public?.index === 0);

    phone.socket.emit('game:action', { type: 'move', payload: { delta: 1 } });
    await host.waitFor(() => host.game!.public.index === 1);
    expect(host.game!.public.lastBy).toBe('Lea');
    // Überspringen einschalten springt direkt zur nächsten Dialogzeile
    phone.socket.emit('game:action', { type: 'skipDirections', payload: { on: true } });
    await host.waitFor(() => host.game!.public.index === 2);
    phone.socket.emit('game:action', { type: 'move', payload: { delta: 1 } });
    await host.waitFor(() => host.game!.public.index === 3);
    phone.socket.emit('game:action', { type: 'page', payload: { page: 2 } });
    await host.waitFor(() => host.game!.public.index === 6);
    phone.socket.emit('game:action', { type: 'scene', payload: { number: 1 } });
    await host.waitFor(() => host.game!.public.index === 2);
    phone.socket.emit('game:action', { type: 'hide', payload: { mode: 'both' } });
    await host.waitFor(() => host.game!.public.hide === 'both');
    phone.socket.emit('game:action', { type: 'hide', payload: { mode: 'quatsch' } });
    phone.socket.emit('game:action', { type: 'focus', payload: { characters: ['Alph', 'Unbekannt'] } });
    await host.waitFor(() => host.game!.public.focus.length === 1);
    expect(host.game!.public.hide).toBe('both');
    [host, phone].forEach((c) => c.close());
  });
});
