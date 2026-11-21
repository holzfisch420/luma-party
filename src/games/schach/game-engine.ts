/**
 * „Schach“ – Server-Engine. Regeln (legale Züge, Matt, Patt, Remis) über chess.js.
 * Uhren: Restzeit wird beim Zug abgezogen; ein Timer beendet die Partie bei Zeitablauf.
 */
import { Chess } from 'chess.js';
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_SCHACH_SETTINGS, END_SHOW_MS, parseSchachSettings, parseTimeControl, schachMeta, type SchachSettings } from './game-config';
import type { EndReason, SchachPublicState, Side } from './types';

const other = (s: Side): Side => (s === 'w' ? 'b' : 'w');

export class SchachEngine implements GameEngine<SchachPublicState, null> {
  private chess = new Chess();
  private players!: Record<Side, PlayerId>;
  private clocks: Record<Side, number> | null;
  private incMs: number;
  private turnStartedAt = 0;
  private lastMove: SchachPublicState['lastMove'] = null;
  private drawOffer: Side | null = null;
  private result: SchachPublicState['result'] = null;
  private flagTimer: TimerHandle | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: SchachSettings,
  ) {
    const { baseMs, incMs } = parseTimeControl(settings.time);
    this.clocks = baseMs > 0 ? { w: baseMs, b: baseMs } : null;
    this.incMs = incMs;
  }

  start(): void {
    const two = this.ctx.getPlayers().filter((p) => p.isConnected).slice(0, 2).map((p) => p.id);
    const [a, b] = two as [PlayerId, PlayerId];
    const swap = this.settings.colors === 'random' && Math.random() < 0.5;
    this.players = swap ? { w: b, b: a } : { w: a, b: b };
    this.turnStartedAt = this.ctx.now();
    this.armFlag();
    this.ctx.publishState();
  }

  dispose(): void {
    this.flagTimer?.cancel();
  }

  private sideOf(id: PlayerId): Side | null {
    return this.players.w === id ? 'w' : this.players.b === id ? 'b' : null;
  }

  /** Restzeit der Seite am Zug, jetzt */
  private remaining(side: Side): number {
    if (!this.clocks) return Infinity;
    const used = side === this.chess.turn() && !this.result ? this.ctx.now() - this.turnStartedAt : 0;
    return this.clocks[side] - used;
  }

  private armFlag() {
    this.flagTimer?.cancel();
    if (!this.clocks || this.result) return;
    const side = this.chess.turn();
    this.flagTimer = this.ctx.setTimer(Math.max(0, this.remaining(side)) + 30, () => this.onFlag(side));
  }

  private onFlag(side: Side) {
    if (this.result || this.chess.turn() !== side || this.remaining(side) > 0) return;
    this.clocks![side] = 0;
    // kann die Gegenseite gar nicht mehr matt setzen (nur König), ist es Remis
    const opp = other(side);
    const onlyKing = this.chess
      .board()
      .flat()
      .filter((p) => p && p.color === opp)
      .every((p) => p!.type === 'k');
    this.end(onlyKing ? null : opp, onlyKing ? 'insufficient' : 'timeout');
  }

  getPublicState(): SchachPublicState {
    return {
      fen: this.chess.fen(),
      history: this.chess.history(),
      lastMove: this.lastMove,
      turn: this.chess.turn(),
      inCheck: this.chess.inCheck(),
      players: this.players,
      clocks: this.clocks ? { ...this.clocks } : null,
      incMs: this.incMs,
      turnStartedAt: this.turnStartedAt,
      drawOffer: this.drawOffer,
      result: this.result,
    };
  }

  getPrivateState(): null {
    return null;
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.result) return;
    const side = this.sideOf(playerId);
    if (!side) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'move') return this.move(side, data);
    if (type === 'resign') return this.end(other(side), 'resign');
    if (type === 'offerDraw') {
      if (this.drawOffer === other(side)) return this.end(null, 'agreed');
      this.drawOffer = side;
      this.ctx.publishState();
      return;
    }
    if (type === 'answerDraw' && this.drawOffer === other(side)) {
      if (data.accept === true) return this.end(null, 'agreed');
      this.drawOffer = null;
      this.ctx.publishState();
    }
  }

  private move(side: Side, data: Record<string, unknown>) {
    if (this.chess.turn() !== side) return;
    const from = typeof data.from === 'string' ? data.from : '';
    const to = typeof data.to === 'string' ? data.to : '';
    const promotion = typeof data.promotion === 'string' && 'qrbn'.includes(data.promotion) ? data.promotion : undefined;
    // Zeit zuerst prüfen
    if (this.clocks && this.remaining(side) <= 0) return this.onFlag(side);
    try {
      this.chess.move({ from, to, promotion: promotion ?? 'q' });
    } catch {
      return; // illegaler Zug
    }
    const now = this.ctx.now();
    if (this.clocks) this.clocks[side] = this.clocks[side] - (now - this.turnStartedAt) + this.incMs;
    this.turnStartedAt = now;
    this.lastMove = { from, to };
    // ein Zug lehnt ein offenes Remisangebot der Gegenseite ab
    if (this.drawOffer && this.drawOffer !== side) this.drawOffer = null;
    if (this.chess.isCheckmate()) return this.end(side, 'checkmate');
    if (this.chess.isStalemate()) return this.end(null, 'stalemate');
    if (this.chess.isInsufficientMaterial()) return this.end(null, 'insufficient');
    if (this.chess.isThreefoldRepetition()) return this.end(null, 'repetition');
    if (this.chess.isDrawByFiftyMoves()) return this.end(null, 'fifty');
    this.armFlag();
    this.ctx.publishState();
  }

  private end(winner: Side | null, reason: EndReason) {
    if (this.result) return;
    this.flagTimer?.cancel();
    // Uhren einfrieren
    if (this.clocks && reason !== 'timeout') {
      const side = this.chess.turn();
      this.clocks[side] = Math.max(0, this.clocks[side] - (this.ctx.now() - this.turnStartedAt));
    }
    this.result = { winner, reason };
    this.drawOffer = null;
    this.ctx.publishState();
    this.ctx.setTimer(END_SHOW_MS, () => this.finish());
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = 0;
    const r = this.result!;
    if (r.winner) scores[this.players[r.winner]] = 3;
    else {
      scores[this.players.w] = 1;
      scores[this.players.b] = 1;
    }
    const why: Record<EndReason, string> = {
      checkmate: 'Schachmatt',
      timeout: 'Zeit abgelaufen',
      resign: 'Aufgegeben',
      stalemate: 'Patt – Remis',
      insufficient: 'Remis – zu wenig Material',
      repetition: 'Remis – dreifache Wiederholung',
      fifty: 'Remis – 50-Züge-Regel',
      agreed: 'Remis vereinbart',
      left: 'Gegner hat das Spiel verlassen',
    };
    this.ctx.endGame({ scores, summary: `${why[r.reason]} · ${Math.ceil(this.chess.history().length / 2)} Züge · Sieg 3 Punkte, Remis 1` });
  }

  onPlayerLeft(p: GamePlayer): void {
    const side = this.sideOf(p.id);
    if (side && !this.result) this.end(other(side), 'left');
  }
}

export const schachServerModule: ServerGameModule<SchachSettings> = {
  meta: schachMeta,
  defaultSettings: DEFAULT_SCHACH_SETTINGS,
  parseSettings: parseSchachSettings,
  canStart(players) {
    if (players.filter((p) => p.isConnected).length < 2) return 'Schach braucht 2 Spieler (weitere schauen zu).';
    return null;
  },
  createEngine(ctx, settings) {
    return new SchachEngine(ctx, settings);
  },
};
