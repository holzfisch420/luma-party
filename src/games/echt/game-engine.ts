/**
 * „Echt jetzt?“ – Server-Engine.
 *
 * Ablauf je Satz: alle schreiben (die Person, die dran ist, ehrlich – alle anderen eine
 * Fälschung) → alle anderen stimmen ab, welche Antwort echt ist → Auflösung mit Punkten.
 * Wer was geschrieben hat, wird erst bei der Auflösung verraten.
 */
import { randomUUID } from 'node:crypto';
import type { GameContext, GameEngine, GamePlayer, GameServices, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { sanitizeText } from '../../shared/utils/text';
import { normalizeGuess } from '../montagsmaler/logic/word-utils';
import { ANSWER_MAX, DEFAULT_ECHT_SETTINGS, echtMeta, parseEchtSettings, POINTS, TIMING, type EchtSettings } from './game-config';
import { STATEMENTS } from './statements';
import type { EchtOption, EchtPhase, EchtPrivateState, EchtPublicState, EchtReveal, EchtRevealOption } from './types';

export function statementPool(settings: EchtSettings, services: GameServices | undefined): string[] {
  const builtIn = settings.sets.flatMap((s) => STATEMENTS[s]);
  const custom = settings.customListIds.flatMap((id) => services?.statements?.get(id)?.statements ?? []);
  const all = [...new Set([...builtIn, ...custom])];
  return all.length ? all : STATEMENTS.klassisch;
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Option extends EchtOption {
  authors: PlayerId[];
  real: boolean;
}

export class EchtEngine implements GameEngine<EchtPublicState, EchtPrivateState> {
  private phase: EchtPhase = 'write';
  private order: PlayerId[] = [];
  private turn = 0;
  /** Position der Person, die dran ist, in der Reihenfolge */
  private heroPos = 0;
  private turnsTotal = 0;
  private step = 0;
  private statement = '';
  private deck: string[] = [];
  private answers = new Map<PlayerId, string>();
  private votes = new Map<PlayerId, string>();
  private options: Option[] = [];
  private reveal: EchtReveal | null = null;
  private scores = new Map<PlayerId, number>();
  private phaseEndsAt: number | null = null;
  private timer: TimerHandle | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: EchtSettings,
  ) {}

  start(): void {
    const players = this.ctx.getPlayers().filter((p) => p.isConnected);
    this.order = players.map((p) => p.id);
    this.turnsTotal = this.order.length * this.settings.rounds;
    for (const p of this.ctx.getPlayers()) this.scores.set(p.id, 0);
    this.deck = shuffle(this.pool());
    this.startStatement();
  }

  dispose(): void {
    this.timer?.cancel();
  }

  /** alle Sätze aus den gewählten Sammlungen (eingebaut + eigene) */
  private pool(): string[] {
    return statementPool(this.settings, this.ctx.services);
  }

  private get totalTurns() {
    return this.turnsTotal;
  }

  private get heroId(): PlayerId {
    return this.order[this.heroPos % this.order.length]!;
  }

  /** wer gerade mitspielen kann */
  private active(): PlayerId[] {
    return this.order.filter((id) => this.ctx.getPlayer(id)?.isConnected);
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): EchtPublicState {
    return {
      phase: this.phase,
      turn: this.turn + 1,
      totalTurns: this.totalTurns,
      step: this.step + 1,
      perTurn: this.settings.perTurn,
      heroId: this.heroId,
      statement: this.statement,
      phaseEndsAt: this.phaseEndsAt,
      submitted: [...this.answers.keys()],
      voted: [...this.votes.keys()],
      options: this.phase === 'write' ? [] : this.options.map((o) => ({ id: o.id, text: o.text })),
      reveal: this.reveal,
      scores: Object.fromEntries(this.scores),
    };
  }

  getPrivateState(playerId: PlayerId): EchtPrivateState {
    return {
      isHero: playerId === this.heroId,
      myAnswer: this.answers.get(playerId) ?? null,
      myVote: this.votes.get(playerId) ?? null,
      ownOptionIds: this.options.filter((o) => o.authors.includes(playerId)).map((o) => o.id),
    };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || !this.order.includes(playerId)) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'answer') {
      if (this.phase !== 'write') return;
      const text = sanitizeText(data.text, ANSWER_MAX);
      if (!text) return;
      this.answers.set(playerId, text);
      if (this.active().every((id) => this.answers.has(id))) this.startVote();
      else this.ctx.publishState();
      return;
    }
    if (type === 'vote') {
      if (this.phase !== 'vote' || playerId === this.heroId) return;
      const option = this.options.find((o) => o.id === data.optionId);
      if (!option || option.authors.includes(playerId)) return;
      this.votes.set(playerId, option.id);
      if (this.voters().every((id) => this.votes.has(id))) this.finishStatement();
      else this.ctx.publishState();
    }
  }

  /** wer abstimmen darf: alle außer der Person, die dran ist (und außer denen, die nur noch ihre eigene Antwort sehen) */
  private voters(): PlayerId[] {
    return this.active().filter((id) => id !== this.heroId && this.options.some((o) => !o.authors.includes(id)));
  }

  onPlayerJoined(p: GamePlayer): void {
    if (!this.scores.has(p.id)) this.scores.set(p.id, 0);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    this.answers.delete(p.id);
    this.votes.delete(p.id);
    if (!this.order.includes(p.id)) return;
    const wasHero = p.id === this.heroId;
    const idx = this.order.indexOf(p.id);
    this.order = this.order.filter((id) => id !== p.id);
    if (this.order.length < 2) {
      this.finish();
      return;
    }
    // wer schon dran war, fällt aus der Rechnung; wer noch dran gewesen wäre, verkürzt das Spiel
    if (idx < this.heroPos) this.heroPos--;
    this.turnsTotal = Math.max(this.turn + 1, this.turnsTotal - this.settings.rounds);
    if (wasHero) {
      this.heroPos = (this.heroPos - 1 + this.order.length) % this.order.length;
      this.step = this.settings.perTurn - 1;
      if (this.phase === 'reveal') return; // nach der Auflösung geht es mit der nächsten Person weiter
      // Person, die dran war, ist weg: nächster Zug
      this.ctx.notify('all', 'info', `${p.name} hat das Spiel verlassen – weiter mit der nächsten Person.`);
      this.step = this.settings.perTurn - 1;
      this.next();
      return;
    }
    this.checkProgress();
  }

  onPlayerDisconnected(): void {
    this.checkProgress();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  private checkProgress() {
    if (this.phase === 'write' && this.active().every((id) => this.answers.has(id))) this.startVote();
    else if (this.phase === 'vote' && this.voters().every((id) => this.votes.has(id))) this.finishStatement();
    else this.ctx.publishState();
  }

  // ------------------------------------------------------------------ Ablauf

  private setPhase(phase: EchtPhase, seconds: number, onEnd: () => void) {
    this.timer?.cancel();
    this.phase = phase;
    this.phaseEndsAt = this.ctx.now() + seconds * 1000;
    this.timer = this.ctx.setTimer(seconds * 1000, onEnd);
    this.ctx.publishState();
  }

  private startStatement() {
    if (this.deck.length === 0) this.deck = shuffle(this.pool());
    this.statement = this.deck.pop()!;
    this.answers.clear();
    this.votes.clear();
    this.options = [];
    this.reveal = null;
    this.setPhase('write', this.settings.writeSeconds, () => this.startVote());
  }

  private startVote() {
    const real = this.answers.get(this.heroId);
    if (!real) {
      // ohne echte Antwort gibt es nichts zu raten
      this.reveal = { options: [], gained: {}, skipped: true };
      this.setPhase('reveal', 5, () => this.next());
      return;
    }
    // gleiche Antworten zusammenfassen
    const byKey = new Map<string, Option>();
    const realKey = normalizeGuess(real) || real;
    byKey.set(realKey, { id: randomUUID().slice(0, 8), text: real, authors: [this.heroId], real: true });
    for (const [id, text] of this.answers) {
      if (id === this.heroId) continue;
      const key = normalizeGuess(text) || text;
      const existing = byKey.get(key);
      if (existing) existing.authors.push(id);
      else byKey.set(key, { id: randomUUID().slice(0, 8), text, authors: [id], real: false });
    }
    this.options = shuffle([...byKey.values()]);
    this.votes.clear();
    if (this.options.length < 2 || this.voters().length === 0) {
      this.finishStatement();
      return;
    }
    this.setPhase('vote', TIMING.voteSeconds, () => this.finishStatement());
  }

  private finishStatement() {
    const gained: Record<PlayerId, number> = {};
    const add = (id: PlayerId, n: number) => {
      gained[id] = (gained[id] ?? 0) + n;
      this.scores.set(id, (this.scores.get(id) ?? 0) + n);
    };
    const realOpt = this.options.find((o) => o.real);
    // gleiche Antwort wie die Person, die dran ist
    for (const id of realOpt?.authors ?? []) if (id !== this.heroId) add(id, POINTS.exactMatch);
    for (const [voter, optionId] of this.votes) {
      const opt = this.options.find((o) => o.id === optionId);
      if (!opt) continue;
      if (opt.real) {
        add(voter, POINTS.correctGuess);
        add(this.heroId, POINTS.correctGuess);
      } else for (const author of opt.authors) if (author !== voter) add(author, POINTS.fooled);
    }
    const options: EchtRevealOption[] = this.options.map((o) => ({
      id: o.id,
      text: o.text,
      authors: o.authors,
      real: o.real,
      voters: [...this.votes].filter(([, v]) => v === o.id).map(([k]) => k),
    }));
    // echte Antwort zuerst, dann nach Stimmen
    options.sort((a, b) => Number(b.real) - Number(a.real) || b.voters.length - a.voters.length);
    this.reveal = { options, gained, skipped: false };
    this.setPhase('reveal', TIMING.revealSeconds + Math.min(6, options.length), () => this.next());
  }

  private next() {
    this.step++;
    if (this.step >= this.settings.perTurn) {
      this.step = 0;
      this.turn++;
      this.heroPos = (this.heroPos + 1) % this.order.length;
      if (this.turn >= this.totalTurns) {
        this.finish();
        return;
      }
    }
    this.startStatement();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.timer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.scores.get(p.id) ?? 0;
    this.ctx.endGame({ scores, summary: `${this.turn} ${this.turn === 1 ? 'Zug' : 'Züge'} · ${this.settings.perTurn} ${this.settings.perTurn === 1 ? 'Satz' : 'Sätze'} pro Person` });
  }
}

export const echtServerModule: ServerGameModule<EchtSettings> = {
  meta: echtMeta,
  defaultSettings: DEFAULT_ECHT_SETTINGS,
  parseSettings: parseEchtSettings,
  canStart(players, settings, services) {
    if (players.filter((p) => p.isConnected).length < 3) return '„Echt jetzt?“ braucht mindestens 3 Spieler.';
    const custom = settings.customListIds.reduce((n, id) => n + (services.statements?.get(id)?.statements.length ?? 0), 0);
    if (settings.sets.length === 0 && custom === 0) return 'Bitte mindestens eine Satz-Sammlung auswählen.';
    return null;
  },
  createEngine(ctx, settings) {
    return new EchtEngine(ctx, settings);
  },
};
