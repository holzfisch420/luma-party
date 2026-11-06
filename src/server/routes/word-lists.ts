/** REST-API für eigene Wortlisten. */
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { WORD_LIST_MAX_WORDS, WORD_LISTS_PER_OWNER, type WordList } from '../../shared/types/words';
import { RateLimiter } from '../security/rate-limit';
import { WordListError, type Owner, type WordListStore } from '../storage/word-list-store';
import type { TokenService } from '../accounts/tokens';
import { bearerToken } from './auth';

const wordInput = z.object({
  word: z.string().max(200),
  category: z.string().max(40).optional(),
  difficulty: z.string().max(20).optional(),
});
const createBody = z.object({ name: z.string().max(200), words: z.array(wordInput).max(WORD_LIST_MAX_WORDS).optional() });
const renameBody = z.object({ name: z.string().max(200) });
const addWordsBody = z.object({ words: z.array(wordInput).min(1).max(WORD_LIST_MAX_WORDS) });
const updateWordBody = wordInput.partial();
const restoreBody = z.object({
  lists: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(200),
        createdAt: z.number().optional(),
        words: z.array(wordInput).max(WORD_LIST_MAX_WORDS),
      }),
    )
    .max(WORD_LISTS_PER_OWNER),
});

const OWNER_HEADER = 'x-luma-owner';
const OWNER_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

type Handler = (req: Request, res: Response, owner: Owner) => Promise<unknown>;

/** Besitzerkennung entfernen, bevor Listen ausgeliefert werden */
const clean = (list: WordList) => {
  const { owner: _owner, ...rest } = list;
  return rest;
};

const param = (req: Request, name: string) => String(req.params[name] ?? '');

export function createWordListRouter(store: WordListStore, opts: { publicMode: boolean; tokens: TokenService }): Router {
  const r = Router();
  const limiter = new RateLimiter(240, 60_000);

  // Rate-Limit pro IP
  r.use((req: Request, res: Response, next: NextFunction) => {
    if (!limiter.take(req.ip ?? 'unknown')) {
      res.status(429).json({ error: 'Zu viele Anfragen – bitte kurz warten.' });
      return;
    }
    next();
  });

  const wrap = (fn: Handler) => async (req: Request, res: Response) => {
    let owner: Owner = null;
    if (opts.publicMode) {
      // angemeldet: Listen gehören dem Konto (auf allen Geräten), sonst dem Gerät
      const accountId = opts.tokens.verify(bearerToken(req));
      const header = String(req.headers[OWNER_HEADER] ?? '');
      if (accountId) owner = `acc:${accountId}`;
      else if (OWNER_PATTERN.test(header)) owner = header;
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
      else if (err instanceof WordListError) res.status(400).json({ error: err.message });
      else {
        console.error('[api] Fehler:', err);
        res.status(500).json({ error: 'Serverfehler.' });
      }
    }
  };

  r.get('/', wrap(async (_req, _res, owner) => ({ lists: store.list(owner) })));
  /** komplette Listen – für die Sicherung auf dem Gerät */
  r.get('/export', wrap(async (_req, _res, owner) => ({ lists: store.export(owner) })));
  r.post(
    '/restore',
    wrap(async (req, _res, owner) => ({ restored: await store.restore(owner, restoreBody.parse(req.body).lists) })),
  );
  r.get(
    '/:id',
    wrap(async (req, res, owner) => {
      const list = store.get(param(req, 'id'), owner);
      if (!list) return res.status(404).json({ error: 'Wortliste nicht gefunden.' });
      return { list: clean(list) };
    }),
  );
  r.post(
    '/',
    wrap(async (req, _res, owner) => {
      const body = createBody.parse(req.body);
      return { list: clean(await store.create(body.name, body.words, owner)) };
    }),
  );
  r.patch('/:id', wrap(async (req, _res, owner) => ({ list: clean(await store.rename(param(req, 'id'), renameBody.parse(req.body).name, owner)) })));
  r.delete(
    '/:id',
    wrap(async (req, _res, owner) => {
      await store.remove(param(req, 'id'), owner);
      return { ok: true };
    }),
  );
  r.post(
    '/:id/words',
    wrap(async (req, _res, owner) => {
      const res = await store.addWords(param(req, 'id'), addWordsBody.parse(req.body).words, owner);
      return { ...res, list: clean(res.list) };
    }),
  );
  r.patch(
    '/:id/words/:wordId',
    wrap(async (req, _res, owner) => ({ list: clean(await store.updateWord(param(req, 'id'), param(req, 'wordId'), updateWordBody.parse(req.body), owner)) })),
  );
  r.delete(
    '/:id/words/:wordId',
    wrap(async (req, _res, owner) => ({ list: clean(await store.removeWord(param(req, 'id'), param(req, 'wordId'), owner)) })),
  );
  return r;
}
