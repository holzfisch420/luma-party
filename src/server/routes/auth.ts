/** REST-API für Konten: registrieren, anmelden, Avatar speichern, Passwort ändern, löschen. */
import { Router, type Request, type Response } from 'express';
import { AccountError, type AccountStore } from '../accounts/account-store';
import type { TokenService } from '../accounts/tokens';
import { RateLimiter } from '../security/rate-limit';

export function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

export function createAuthRouter(accounts: AccountStore, tokens: TokenService): Router {
  const r = Router();
  const attempts = new RateLimiter(20, 10 * 60_000); // Anmelde-/Registrierversuche pro IP
  const general = new RateLimiter(120, 60_000);

  type Handler = (req: Request, res: Response) => Promise<unknown>;
  const wrap = (fn: Handler, limiter = general) => async (req: Request, res: Response) => {
    if (!limiter.take(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Zu viele Versuche – bitte in ein paar Minuten erneut probieren.' });
      return;
    }
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.json(result);
    } catch (err) {
      if (err instanceof AccountError) res.status(400).json({ error: err.message });
      else {
        console.error('[auth] Fehler:', err);
        res.status(500).json({ error: 'Serverfehler.' });
      }
    }
  };

  const requireAccount = (req: Request, res: Response) => {
    const id = tokens.verify(bearerToken(req));
    const account = id ? accounts.get(id) : undefined;
    if (!account) {
      res.status(401).json({ error: 'Bitte melde dich erneut an.' });
      return null;
    }
    return account;
  };

  const body = (req: Request) => (req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {});

  r.post(
    '/register',
    wrap(async (req) => {
      const b = body(req);
      const account = await accounts.register(b.username, b.password, b.avatar);
      return { token: tokens.issue(account), account: accounts.toPublic(account) };
    }, attempts),
  );

  r.post(
    '/login',
    wrap(async (req) => {
      const b = body(req);
      const account = await accounts.login(b.username, b.password);
      return { token: tokens.issue(account), account: accounts.toPublic(account) };
    }, attempts),
  );

  r.get(
    '/me',
    wrap(async (req, res) => {
      const account = requireAccount(req, res);
      return account ? { account: accounts.toPublic(account) } : undefined;
    }),
  );

  r.put(
    '/me/avatar',
    wrap(async (req, res) => {
      const account = requireAccount(req, res);
      if (!account) return;
      const updated = await accounts.updateAvatar(account.id, body(req).avatar);
      return { account: accounts.toPublic(updated) };
    }),
  );

  r.post(
    '/me/password',
    wrap(async (req, res) => {
      const account = requireAccount(req, res);
      if (!account) return;
      const b = body(req);
      const updated = await accounts.changePassword(account.id, b.oldPassword, b.newPassword);
      return { token: tokens.issue(updated), account: accounts.toPublic(updated) };
    }, attempts),
  );

  r.delete(
    '/me',
    wrap(async (req, res) => {
      const account = requireAccount(req, res);
      if (!account) return;
      await accounts.delete(account.id, body(req).password);
      return { ok: true };
    }, attempts),
  );

  return r;
}
