/**
 * „Couch-Match“ – Server-Engine.
 * Alle bekommen dieselben 25 Titel in eigener Reihenfolge; sind alle durch, gibt es die Rangliste.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { filterMedia } from './data/catalog';
import { DECK_SIZE, DEFAULT_KINO_SETTINGS, kinoMeta, parseKinoSettings, type KinoSettings } from './game-config';
import type { KinoPrivateState, KinoPublicState, KinoResult } from './types';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export class KinoEngine implements GameEngine<KinoPublicState, KinoPrivateState> {
  private phase: KinoPublicState['phase'] = 'swipe';
  private deck: string[] = [];
  private orders = new Map<PlayerId, string[]>();
  private votes = new Map<PlayerId, Map<string, boolean>>();
  private results: KinoResult[] | null = null;
  private round = 0;
  /** zufällige Reihenfolge bei Gleichstand – für alle gleich */
  private tiebreak = new Map<string, number>();

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: KinoSettings,
  ) {}

  start(): void {
    this.newRound();
  }

  dispose(): void {}

  private newRound() {
    this.round++;
    const pool = filterMedia(this.settings.type, this.settings.genres);
    this.deck = shuffle(pool)
      .slice(0, DECK_SIZE)
      .map((m) => m.id);
    this.tiebreak = new Map(this.deck.map((id) => [id, Math.random()]));
    this.orders.clear();
    this.votes.clear();
    this.results = null;
    this.phase = 'swipe';
    for (const p of this.ctx.getPlayers()) if (p.isConnected) this.join(p.id);
    this.ctx.publishState();
  }

  private join(id: PlayerId) {
    if (this.orders.has(id)) return;
    this.orders.set(id, shuffle(this.deck));
    this.votes.set(id, new Map());
  }

  getPublicState(): KinoPublicState {
    return {
      phase: this.phase,
      deck: this.deck,
      progress: Object.fromEntries([...this.votes].map(([id, v]) => [id, v.size])),
      swipers: [...this.orders.keys()],
      results: this.results,
      round: this.round,
    };
  }

  getPrivateState(playerId: PlayerId): KinoPrivateState | null {
    const order = this.orders.get(playerId);
    if (!order) return null;
    return { order, votes: Object.fromEntries(this.votes.get(playerId) ?? []) };
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'again' && this.phase === 'results') return this.newRound();
    if (type !== 'swipe' || this.phase !== 'swipe') return;
    const mine = this.votes.get(playerId);
    const id = typeof data.id === 'string' ? data.id : '';
    if (!mine || !this.deck.includes(id) || mine.has(id) || typeof data.like !== 'boolean') return;
    mine.set(id, data.like);
    this.checkDone();
    this.ctx.publishState();
  }

  /** alle (verbundenen) durch? Dann Rangliste */
  private checkDone() {
    if (this.phase !== 'swipe') return;
    const active = [...this.votes].filter(([id]) => this.ctx.getPlayer(id)?.isConnected);
    if (active.length === 0 || !active.every(([, v]) => v.size >= this.deck.length)) return;
    this.results = this.deck
      .map((id) => ({ id, likers: [...this.votes].filter(([, v]) => v.get(id) === true).map(([pid]) => pid) }))
      .sort((a, b) => b.likers.length - a.likers.length || this.tiebreak.get(a.id)! - this.tiebreak.get(b.id)!);
    this.phase = 'results';
  }

  onPlayerJoined(p: GamePlayer): void {
    if (this.phase === 'swipe') this.join(p.id);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    this.orders.delete(p.id);
    this.votes.delete(p.id);
    this.checkDone();
    this.ctx.publishState();
  }

  onPlayerDisconnected(): void {
    this.checkDone();
    this.ctx.publishState();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }
}

export const kinoServerModule: ServerGameModule<KinoSettings> = {
  meta: kinoMeta,
  defaultSettings: DEFAULT_KINO_SETTINGS,
  parseSettings: parseKinoSettings,
  canStart(players, settings) {
    if (players.filter((p) => p.isConnected).length < 1) return 'Mindestens eine Person muss verbunden sein.';
    if (filterMedia(settings.type, settings.genres).length < 5) return 'Mit diesen Filtern gibt es zu wenige Titel – bitte mehr Genres wählen.';
    return null;
  },
  createEngine(ctx, settings) {
    return new KinoEngine(ctx, settings);
  },
};
