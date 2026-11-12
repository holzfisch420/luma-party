/**
 * „Wortknacker“ – Server-Engine.
 *
 * Je Runde ein geheimes Wort für alle. Jede Person rät auf dem Handy (max. 6 Versuche);
 * der Fernseher bekommt nur die Farben, die Buchstaben erst bei der Auflösung.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_WORT_SETTINGS, MAX_GUESSES, parseWortSettings, SPEED_BONUS, TIMING, wortMeta, type WortSettings } from './game-config';
import { answers, isAllowed, normalizeWord, scoreGuess } from './logic/words';
import type { Mark, WortPrivateState, WortPublicState } from './types';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Board {
  guesses: string[];
  marks: Mark[][];
  solved: boolean;
  place: number | null;
}

export class WortEngine implements GameEngine<WortPublicState, WortPrivateState> {
  private phase: WortPublicState['phase'] = 'play';
  private round = 0;
  private word = '';
  private deck: string[] = [];
  private boards = new Map<PlayerId, Board>();
  private scores = new Map<PlayerId, number>();
  private solvedCount = 0;
  private reveal: WortPublicState['reveal'] = null;
  private phaseEndsAt: number | null = null;
  private timer: TimerHandle | null = null;
  private errors = new Map<PlayerId, { id: number; message: string }>();
  private errorId = 0;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: WortSettings,
  ) {}

  start(): void {
    for (const p of this.ctx.getPlayers()) this.scores.set(p.id, 0);
    this.deck = shuffle(answers());
    this.startRound();
  }

  dispose(): void {
    this.timer?.cancel();
  }

  /** für Tests */
  get secret() {
    return this.word;
  }

  getPublicState(): WortPublicState {
    const boards: WortPublicState['boards'] = {};
    for (const [id, b] of this.boards)
      boards[id] = { marks: b.marks, solved: b.solved, failed: !b.solved && b.guesses.length >= MAX_GUESSES, place: b.place };
    return {
      phase: this.phase,
      round: this.round,
      rounds: this.settings.rounds,
      phaseEndsAt: this.phaseEndsAt,
      boards,
      reveal: this.reveal,
      scores: Object.fromEntries(this.scores),
    };
  }

  getPrivateState(playerId: PlayerId): WortPrivateState {
    const b = this.boards.get(playerId);
    return { guesses: b?.guesses ?? [], marks: b?.marks ?? [], error: this.errors.get(playerId) ?? null };
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || this.phase !== 'play' || type !== 'guess') return;
    const b = this.boards.get(playerId);
    if (!b || b.solved || b.guesses.length >= MAX_GUESSES) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const guess = normalizeWord(String(data.word ?? '').slice(0, 20));
    if (!isAllowed(guess)) {
      this.errors.set(playerId, { id: ++this.errorId, message: guess.length === 5 ? 'Kein bekanntes Wort' : 'Genau 5 Buchstaben' });
      this.ctx.publishState();
      return;
    }
    this.errors.delete(playerId);
    const marks = scoreGuess(guess, this.word);
    b.guesses.push(guess);
    b.marks.push(marks);
    if (guess === this.word) {
      b.solved = true;
      b.place = ++this.solvedCount;
    }
    if (this.everyoneDone()) this.endRound();
    else this.ctx.publishState();
  }

  private everyoneDone(): boolean {
    return [...this.boards].every(([id, b]) => b.solved || b.guesses.length >= MAX_GUESSES || !this.ctx.getPlayer(id)?.isConnected);
  }

  private startRound() {
    this.round++;
    if (!this.deck.length) this.deck = shuffle(answers());
    this.word = this.deck.pop()!;
    this.boards.clear();
    this.errors.clear();
    this.solvedCount = 0;
    this.reveal = null;
    for (const p of this.ctx.getPlayers()) if (p.isConnected) this.boards.set(p.id, { guesses: [], marks: [], solved: false, place: null });
    this.phase = 'play';
    this.phaseEndsAt = this.ctx.now() + this.settings.seconds * 1000;
    this.timer?.cancel();
    this.timer = this.ctx.setTimer(this.settings.seconds * 1000, () => this.endRound());
    this.ctx.publishState();
  }

  private endRound() {
    if (this.phase !== 'play') return;
    this.timer?.cancel();
    const gained: Record<PlayerId, number> = {};
    const guesses: Record<PlayerId, string[]> = {};
    for (const [id, b] of this.boards) {
      guesses[id] = b.guesses;
      if (!b.solved) continue;
      const pts = MAX_GUESSES + 1 - b.guesses.length + (SPEED_BONUS[(b.place ?? 99) - 1] ?? 0);
      gained[id] = pts;
      this.scores.set(id, (this.scores.get(id) ?? 0) + pts);
    }
    this.reveal = { word: this.word, guesses, gained };
    this.phase = 'reveal';
    this.phaseEndsAt = this.ctx.now() + TIMING.revealMs;
    this.timer = this.ctx.setTimer(TIMING.revealMs, () => (this.round >= this.settings.rounds ? this.finish() : this.startRound()));
    this.ctx.publishState();
  }

  onPlayerJoined(p: GamePlayer): void {
    if (!this.scores.has(p.id)) this.scores.set(p.id, 0);
    // wer während einer Runde dazukommt, rät direkt mit
    if (this.phase === 'play' && !this.boards.has(p.id)) this.boards.set(p.id, { guesses: [], marks: [], solved: false, place: null });
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    this.boards.delete(p.id);
    this.check();
  }

  onPlayerDisconnected(): void {
    this.check();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  private check() {
    if (this.phase === 'play' && this.boards.size > 0 && this.everyoneDone()) this.endRound();
    else this.ctx.publishState();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.timer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.scores.get(p.id) ?? 0;
    this.ctx.endGame({ scores, summary: `${this.round} ${this.round === 1 ? 'Wort' : 'Wörter'}` });
  }
}

export const wortServerModule: ServerGameModule<WortSettings> = {
  meta: wortMeta,
  defaultSettings: DEFAULT_WORT_SETTINGS,
  parseSettings: parseWortSettings,
  canStart(players) {
    if (players.filter((p) => p.isConnected).length < 1) return 'Mindestens eine Person muss mit dem Handy verbunden sein.';
    return null;
  },
  createEngine(ctx, settings) {
    return new WortEngine(ctx, settings);
  },
};
