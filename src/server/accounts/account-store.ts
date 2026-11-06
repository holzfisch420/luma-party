/**
 * Konten: Benutzername + Passwort (scrypt-Hash) + Avatar.
 * Gespeichert im Dokumentenspeicher (Datei oder PostgreSQL), im Speicher gecacht.
 */
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { DEFAULT_AVATAR, parseAvatar, type AvatarConfig } from '../../shared/avatar';
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_PATTERN,
  type PublicAccount,
} from '../../shared/types/account';
import { sanitizeText } from '../../shared/utils/text';
import type { DocumentStore } from '../storage/document-store';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const COLLECTION = 'accounts';
const MAX_ACCOUNTS = 100_000;

export class AccountError extends Error {}

interface AccountDoc {
  id: string;
  username: string;
  /** Kleinschreibung für eindeutige Namen */
  key: string;
  /** scrypt$<salt>$<hash> (base64url) */
  password: string;
  avatar: AvatarConfig;
  /** wird erhöht, wenn das Passwort geändert wird → alte Anmeldungen ungültig */
  tokenVersion: number;
  createdAt: number;
  updatedAt: number;
}

export function normalizeUsername(raw: unknown): string {
  return sanitizeText(raw, USERNAME_MAX + 10);
}

function validateUsername(name: string): void {
  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
    throw new AccountError(`Der Benutzername muss ${USERNAME_MIN}–${USERNAME_MAX} Zeichen lang sein.`);
  }
  if (!USERNAME_PATTERN.test(name)) throw new AccountError('Erlaubt sind Buchstaben, Ziffern, Leerzeichen, Punkt, - und _.');
}

function validatePassword(pw: unknown): string {
  if (typeof pw !== 'string' || pw.length < PASSWORD_MIN) throw new AccountError(`Das Passwort muss mindestens ${PASSWORD_MIN} Zeichen haben.`);
  if (pw.length > PASSWORD_MAX) throw new AccountError('Das Passwort ist zu lang.');
  return pw;
}

async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await scrypt(pw, Buffer.from(saltB64, 'base64url'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// fester Dummy-Hash, damit unbekannte Namen gleich lange dauern wie falsche Passwörter
const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA$' + Buffer.alloc(64).toString('base64url');

export class AccountStore {
  private byId = new Map<string, AccountDoc>();
  private byKey = new Map<string, AccountDoc>();

  constructor(private readonly store: DocumentStore) {}

  async load(): Promise<void> {
    for (const a of await this.store.loadAll<AccountDoc>(COLLECTION)) this.index(a);
  }

  private index(a: AccountDoc) {
    this.byId.set(a.id, a);
    this.byKey.set(a.key, a);
  }

  private async save(a: AccountDoc) {
    a.updatedAt = Date.now();
    await this.store.put(COLLECTION, a);
  }

  toPublic(a: AccountDoc): PublicAccount {
    return { id: a.id, username: a.username, avatar: a.avatar, createdAt: a.createdAt };
  }

  get(id: string): AccountDoc | undefined {
    return this.byId.get(id);
  }

  async register(rawUsername: unknown, rawPassword: unknown, rawAvatar?: unknown): Promise<AccountDoc> {
    const username = normalizeUsername(rawUsername);
    validateUsername(username);
    const password = validatePassword(rawPassword);
    const key = username.toLowerCase();
    if (this.byKey.has(key)) throw new AccountError('Dieser Benutzername ist schon vergeben.');
    if (this.byId.size >= MAX_ACCOUNTS) throw new AccountError('Es können gerade keine neuen Konten erstellt werden.');
    const now = Date.now();
    const doc: AccountDoc = {
      id: randomUUID(),
      username,
      key,
      password: await hashPassword(password),
      avatar: parseAvatar(rawAvatar) ?? { ...DEFAULT_AVATAR },
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    // erneut prüfen (paralleles Registrieren)
    if (this.byKey.has(key)) throw new AccountError('Dieser Benutzername ist schon vergeben.');
    this.index(doc);
    await this.save(doc);
    return doc;
  }

  async login(rawUsername: unknown, rawPassword: unknown): Promise<AccountDoc> {
    const key = normalizeUsername(rawUsername).toLowerCase();
    const doc = this.byKey.get(key);
    const ok = await verifyPassword(typeof rawPassword === 'string' ? rawPassword : '', doc?.password ?? DUMMY_HASH);
    if (!doc || !ok) throw new AccountError('Benutzername oder Passwort ist falsch.');
    return doc;
  }

  async updateAvatar(id: string, rawAvatar: unknown): Promise<AccountDoc> {
    const doc = this.require(id);
    const avatar = parseAvatar(rawAvatar);
    if (!avatar) throw new AccountError('Ungültiger Avatar.');
    doc.avatar = avatar;
    await this.save(doc);
    return doc;
  }

  async changePassword(id: string, oldPassword: unknown, newPassword: unknown): Promise<AccountDoc> {
    const doc = this.require(id);
    if (!(await verifyPassword(typeof oldPassword === 'string' ? oldPassword : '', doc.password))) {
      throw new AccountError('Das aktuelle Passwort stimmt nicht.');
    }
    doc.password = await hashPassword(validatePassword(newPassword));
    doc.tokenVersion++;
    await this.save(doc);
    return doc;
  }

  async delete(id: string, password: unknown): Promise<void> {
    const doc = this.require(id);
    if (!(await verifyPassword(typeof password === 'string' ? password : '', doc.password))) {
      throw new AccountError('Das Passwort stimmt nicht.');
    }
    this.byId.delete(id);
    this.byKey.delete(doc.key);
    await this.store.remove(COLLECTION, id);
  }

  private require(id: string): AccountDoc {
    const doc = this.byId.get(id);
    if (!doc) throw new AccountError('Konto nicht gefunden.');
    return doc;
  }
}
