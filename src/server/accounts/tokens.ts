/**
 * Signierte Anmelde-Tokens (HMAC-SHA256). Kein Sitzungsspeicher nötig.
 * Das Geheimnis wird einmalig erzeugt und im Dokumentenspeicher abgelegt
 * (oder per LUMA_SECRET vorgegeben).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DocumentStore } from '../storage/document-store';
import type { AccountStore } from './account-store';

const TOKEN_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

export class TokenService {
  private constructor(
    private readonly secret: Buffer,
    private readonly accounts: AccountStore,
  ) {}

  static async create(store: DocumentStore, accounts: AccountStore): Promise<TokenService> {
    let secret = process.env.LUMA_SECRET;
    if (!secret) {
      const meta = await store.loadAll<{ id: string; value: string }>('meta');
      secret = meta.find((m) => m.id === 'token-secret')?.value;
      if (!secret) {
        secret = randomBytes(32).toString('base64url');
        await store.put('meta', { id: 'token-secret', value: secret });
      }
    }
    return new TokenService(Buffer.from(secret), accounts);
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }

  issue(account: { id: string; tokenVersion: number }): string {
    const payload = Buffer.from(JSON.stringify({ a: account.id, v: account.tokenVersion, e: Date.now() + TOKEN_LIFETIME_MS })).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  /** gibt die Konto-ID zurück, wenn das Token gültig ist */
  verify(token: unknown): string | null {
    if (typeof token !== 'string' || token.length > 512) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = Buffer.from(this.sign(payload));
    const actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { a: string; v: number; e: number };
      if (typeof data.e !== 'number' || data.e < Date.now()) return null;
      const account = this.accounts.get(data.a);
      if (!account || account.tokenVersion !== data.v) return null;
      return account.id;
    } catch {
      return null;
    }
  }
}
