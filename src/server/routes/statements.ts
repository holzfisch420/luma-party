/** REST-API für eigene Satz-Sammlungen („Echt jetzt?“). */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { TokenService } from '../accounts/tokens';
import { RateLimiter } from '../security/rate-limit';
import { STATEMENT_LIST_MAX, StatementError, type StatementStore } from '../storage/statement-store';
import type { Owner } from '../storage/word-list-store';
import { bearerToken } from './auth';

const OWNER_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const body = z.object({ name: z.string().max(200), statements: z.array(z.string().max(400)).max(STATEMENT_LIST_MAX * 2) });

export function createStatementRouter(store: StatementStore, opts: { publicMode: boolean; tokens: TokenService }): Router {
  const r = Router();
  const limiter = new RateLimiter(120, 60_000);

  const wrap = (fn: (req: Request, res: Response, owner: Owner) => Promise<unknown>) => async (req: Request, res: Response) => {
    if (!limiter.take(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Zu viele Anfragen – bitte kurz warten.' });
      return;
    }
    let owner: Owner = null;
    if (opts.publicMode) {
      const accountId = opts.tokens.verify(bearerToken(req));
      const device = String(req.headers['x-luma-owner'] ?? '');
      if (accountId) owner = `acc:${accountId}`;
      else if (OWNER_PATTERN.test(device)) owner = device;
      else {
        res.status(400).json({ error: 'Gerätekennung fehlt.' });
        return;
      }
    }
    try {
      const result = await fn(req, res, owner);
      if (!res.headersSent) res.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json({ error: 'Ungültige Eingabe.' });
      else if (err instanceof StatementError) res.status(400).json({ error: err.message });
      else {
        console.error('[statements] Fehler:', err);
        res.status(500).json({ error: 'Serverfehler.' });
      }
    }
  };
  const id = (req: Request) => String(req.params.id ?? '');

  r.get('/', wrap(async (_req, _res, owner) => ({ lists: store.list(owner) })));
  r.get(
    '/:id',
    wrap(async (req, res, owner) => {
      const l = store.getOwned(id(req), owner);
      if (!l) return res.status(404).json({ error: 'Sammlung nicht gefunden.' });
      return { list: l };
    }),
  );
  r.post(
    '/',
    wrap(async (req, _res, owner) => {
      const b = body.parse(req.body);
      return store.create(b.name, b.statements, owner);
    }),
  );
  r.put(
    '/:id',
    wrap(async (req, _res, owner) => {
      const b = body.parse(req.body);
      return store.update(id(req), b.name, b.statements, owner);
    }),
  );
  r.delete(
    '/:id',
    wrap(async (req, _res, owner) => {
      await store.remove(id(req), owner);
      return { ok: true };
    }),
  );
  return r;
}
