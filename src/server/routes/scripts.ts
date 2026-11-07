/** REST-API für Theaterskripte (Upload als bereits im Browser geparstes JSON). */
import express, { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { scriptUploadSchema } from '../../games/theater/game-config';
import type { TokenService } from '../accounts/tokens';
import { RateLimiter } from '../security/rate-limit';
import { ScriptError, type ScriptStore } from '../storage/script-store';
import type { Owner } from '../storage/word-list-store';
import { bearerToken } from './auth';

const OWNER_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function createScriptRouter(store: ScriptStore, opts: { publicMode: boolean; tokens: TokenService }): Router {
  const r = Router();
  const limiter = new RateLimiter(120, 60_000);
  r.use(express.json({ limit: '4mb' }));

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
      if (err instanceof z.ZodError) res.status(400).json({ error: 'Das Skript konnte nicht gelesen werden (ungültige Daten).' });
      else if (err instanceof ScriptError) res.status(400).json({ error: err.message });
      else {
        console.error('[scripts] Fehler:', err);
        res.status(500).json({ error: 'Serverfehler.' });
      }
    }
  };
  const id = (req: Request) => String(req.params.id ?? '');

  r.get('/', wrap(async (_req, _res, owner) => ({ scripts: store.list(owner) })));
  r.get(
    '/:id',
    wrap(async (req, res, owner) => {
      const s = store.getOwned(id(req), owner);
      if (!s) return res.status(404).json({ error: 'Skript nicht gefunden.' });
      return { script: s };
    }),
  );
  r.post('/', wrap(async (req, _res, owner) => ({ script: await store.create(scriptUploadSchema.parse(req.body), owner) })));
  r.patch(
    '/:id',
    wrap(async (req, _res, owner) => {
      await store.rename(id(req), z.object({ title: z.string().max(200) }).parse(req.body).title, owner);
      return { ok: true };
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
