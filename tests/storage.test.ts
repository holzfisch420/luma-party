import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { FileDocumentStore, PostgresDocumentStore, type DocumentStore } from '../src/server/storage/document-store';
import { AccountStore } from '../src/server/accounts/account-store';

async function roundTrip(make: () => DocumentStore) {
  const a = make();
  const accounts = new AccountStore(a);
  await accounts.load();
  const created = await accounts.register(`Tester${Date.now() % 100000}`, 'passwort1');
  await a.close();
  // neuer Store (wie nach einem Neustart) findet das Konto wieder
  const b = make();
  const again = new AccountStore(b);
  await again.load();
  expect(again.get(created.id)?.username).toBe(created.username);
  expect((await again.login(created.username, 'passwort1')).id).toBe(created.id);
  await again.delete(created.id, 'passwort1');
  await b.close();
}

describe('Dokumentenspeicher', () => {
  it('Datei: Konten überleben einen Neustart (und alte Wortlisten-Dateien werden gelesen)', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'luma-store-'));
    await fs.writeFile(path.join(dir, 'word-lists.json'), JSON.stringify({ lists: [{ id: 'x', name: 'Alt', words: [] }] }));
    const store = new FileDocumentStore(dir);
    expect((await store.loadAll('word-lists'))[0]).toMatchObject({ id: 'x', name: 'Alt' });
    await roundTrip(() => new FileDocumentStore(dir));
  });

  it.skipIf(!process.env.TEST_DATABASE_URL)('PostgreSQL: Konten überleben einen Neustart', async () => {
    await roundTrip(() => new PostgresDocumentStore(process.env.TEST_DATABASE_URL!));
  });
});
