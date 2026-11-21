/**
 * „Mühle“ – Server-Engine. Regeln stehen in logic/rules.ts.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_MUEHLE_SETTINGS, END_SHOW_MS, muehleMeta, parseMuehleSettings, type MuehleSettings } from './game-config';
import { countOn, initialState, move, other, place, remove, type MillState, type Side } from './logic/rules';
import type { MuehlePublicState } from './types';

export class MuehleEngine implements GameEngine<MuehlePublicState, null> {
  private state: MillState;
  private players!: Record<Side, PlayerId>;
  private mills: Record<Side, number> = { w: 0, b: 0 };
  private endReason: MuehlePublicState['endReason'] = null;
  private finished = false;
  private ending = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: MuehleSettings,
  ) {
    this.state = initialState(settings.flying);
  }

  start(): void {
    const [a, b] = this.ctx.getPlayers().filter((p) => p.isConnected).slice(0, 2).map((p) => p.id) as [PlayerId, PlayerId];
    const swap = this.settings.colors === 'random' && Math.random() < 0.5;
    this.players = swap ? { w: b, b: a } : { w: a, b: b };
    this.ctx.publishState();
  }

  dispose(): void {}

  getPublicState(): MuehlePublicState {
    return { state: this.state, players: this.players, mills: { ...this.mills }, endReason: this.endReason };
  }

  getPrivateState(): null {
    return null;
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.ending) return;
    const side: Side | null = this.players.w === playerId ? 'w' : this.players.b === playerId ? 'b' : null;
    if (!side) return;
    if (type === 'resign') {
      this.state = { ...this.state, winner: other(side) };
      this.endReason = 'resign';
      return this.end();
    }
    if (this.state.turn !== side) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : -1);
    let next: MillState | null = null;
    if (type === 'place') next = place(this.state, n(data.to));
    else if (type === 'move') next = move(this.state, n(data.from), n(data.to));
    else if (type === 'remove') next = remove(this.state, n(data.at));
    if (!next) return;
    if (next.mustRemove && !this.state.mustRemove) this.mills[side]++;
    this.state = next;
    if (next.winner || next.draw) {
      const loser = next.winner ? other(next.winner) : null;
      this.endReason = next.draw ? 'draw' : loser && countOn(next, loser) + next.hand[loser] < 3 ? 'pieces' : 'blocked';
      return this.end();
    }
    this.ctx.publishState();
  }

  private end() {
    this.ending = true;
    this.ctx.publishState();
    this.ctx.setTimer(END_SHOW_MS, () => this.finish());
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = 0;
    const w = this.state.winner;
    if (w) scores[this.players[w]] = 3;
    else {
      scores[this.players.w] = 1;
      scores[this.players.b] = 1;
    }
    const why = { pieces: 'nur noch zwei Steine', blocked: 'kein Zug mehr möglich', draw: 'Remis (50 Züge ohne Mühle)', resign: 'aufgegeben', left: 'Gegner hat verlassen' };
    this.ctx.endGame({ scores, summary: `${this.endReason ? why[this.endReason] : ''} · Sieg 3 Punkte, Remis 1` });
  }

  onPlayerLeft(p: GamePlayer): void {
    if (this.ending) return;
    const side: Side | null = this.players.w === p.id ? 'w' : this.players.b === p.id ? 'b' : null;
    if (!side) return;
    this.state = { ...this.state, winner: other(side) };
    this.endReason = 'left';
    this.end();
  }
}

export const muehleServerModule: ServerGameModule<MuehleSettings> = {
  meta: muehleMeta,
  defaultSettings: DEFAULT_MUEHLE_SETTINGS,
  parseSettings: parseMuehleSettings,
  canStart(players) {
    if (players.filter((p) => p.isConnected).length < 2) return 'Mühle braucht 2 Spieler (weitere schauen zu).';
    return null;
  },
  createEngine(ctx, settings) {
    return new MuehleEngine(ctx, settings);
  },
};
