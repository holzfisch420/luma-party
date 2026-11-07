/**
 * Imposter – Server-Engine.
 *
 * Ablauf je Runde: Karte ansehen → Hinweisrunden (reihum ein Wort sagen) → Diskussion
 * → Abstimmung → ggf. Imposter rät das Wort → Auflösung. Das geheime Wort geht
 * ausschließlich über den privaten Zustand an die Crew.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import type { WordEntry } from '../../shared/types/words';
import { sanitizeText } from '../../shared/utils/text';
import { evaluateGuess } from '../montagsmaler/logic/word-utils';
import { DEFAULT_WORDS } from '../montagsmaler/words/default-words';
import { DEFAULT_IMPOSTER_SETTINGS, imposterMeta, parseImposterSettings, POINTS, TIMING, type ImposterSettings } from './game-config';
import type { ImposterPhase, ImposterPrivateState, ImposterPublicState, ImposterRoundResult } from './types';

export function wordPool(settings: Pick<ImposterSettings, 'categories' | 'difficulties'>): WordEntry[] {
  const cats = new Set<string>(settings.categories);
  const diffs = new Set<string>(settings.difficulties);
  return DEFAULT_WORDS.filter((w) => cats.has(w.category) && diffs.has(w.difficulty));
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export class ImposterEngine implements GameEngine<ImposterPublicState, ImposterPrivateState> {
  private phase: ImposterPhase = 'reveal';
  private round = 0;
  private phaseEndsAt: number | null = null;
  private timer: TimerHandle | null = null;
  private order: PlayerId[] = [];
  private turn = 0;
  private clueRound = 1;
  private imposterId: PlayerId = '';
  private word: WordEntry | null = null;
  private ready = new Set<PlayerId>();
  private votes = new Map<PlayerId, PlayerId>();
  private result: ImposterRoundResult | null = null;
  private scores = new Map<PlayerId, number>();
  private used = new Set<string>();
  private lastImposter: PlayerId | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: ImposterSettings,
  ) {}

  start(): void {
    for (const p of this.ctx.getPlayers()) this.scores.set(p.id, 0);
    this.startRound();
  }

  dispose(): void {
    this.timer?.cancel();
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): ImposterPublicState {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      phaseEndsAt: this.phaseEndsAt,
      order: this.order,
      turn: this.turn,
      clueRound: this.clueRound,
      clueRounds: this.settings.clueRounds,
      category: this.settings.showCategory && this.word ? this.word.category : null,
      ready: [...this.ready],
      voted: [...this.votes.keys()],
      result: this.result,
      accusedId: this.phase === 'guess' ? (this.pendingResult?.ejectedId ?? null) : null,
      scores: Object.fromEntries(this.scores),
    };
  }

  getPrivateState(playerId: PlayerId): ImposterPrivateState | null {
    const inRound = this.order.includes(playerId);
    if (!inRound) return { inRound, role: null, word: null, myVote: null };
    const imposter = playerId === this.imposterId;
    return {
      inRound,
      role: imposter ? 'imposter' : 'crew',
      word: imposter ? null : (this.word?.word ?? null),
      myVote: this.votes.get(playerId) ?? null,
    };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || !this.order.includes(playerId)) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    switch (type) {
      case 'seen':
        if (this.phase !== 'reveal') return;
        this.ready.add(playerId);
        if (this.connected().every((id) => this.ready.has(id))) this.startClues();
        else this.ctx.publishState();
        return;
      case 'done':
        // nur wer gerade dran ist
        if (this.phase !== 'clues' || this.order[this.turn] !== playerId) return;
        this.nextTurn();
        return;
      case 'readyToVote':
        if (this.phase !== 'discuss') return;
        this.ready.add(playerId);
        // Mehrheit bereit → Abstimmung
        if (this.ready.size * 2 > this.connected().length) this.startVote();
        else this.ctx.publishState();
        return;
      case 'vote': {
        if (this.phase !== 'vote') return;
        const target = data.target;
        if (typeof target !== 'string' || target === playerId || !this.order.includes(target)) return;
        this.votes.set(playerId, target);
        if (this.connected().every((id) => this.votes.has(id))) this.tally();
        else this.ctx.publishState();
        return;
      }
      case 'guess': {
        if (this.phase !== 'guess' || playerId !== this.imposterId) return;
        const guess = sanitizeText(data.text, 60);
        if (!guess) return;
        this.finishRound(guess);
        return;
      }
      default:
        return;
    }
  }

  // ------------------------------------------------------------------ Spieler-Ereignisse

  onPlayerJoined(p: GamePlayer): void {
    if (!this.scores.has(p.id)) this.scores.set(p.id, 0);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    if (!this.order.includes(p.id) || this.finished) return;
    if (p.id === this.imposterId && this.phase !== 'result') {
      this.endWithoutImposter();
      return;
    }
    const wasCurrent = this.phase === 'clues' && this.order[this.turn] === p.id;
    const idx = this.order.indexOf(p.id);
    this.order = this.order.filter((id) => id !== p.id);
    if (idx < this.turn) this.turn--;
    this.ready.delete(p.id);
    this.votes.delete(p.id);
    for (const [voter, target] of this.votes) if (target === p.id) this.votes.delete(voter);
    if (this.order.length < 3 && this.phase !== 'result') {
      this.endWithoutImposter('Zu wenige Mitspielende – Runde abgebrochen.');
      return;
    }
    if (wasCurrent) {
      this.turn--;
      this.nextTurn();
      return;
    }
    this.checkProgress();
  }

  onPlayerDisconnected(p: GamePlayer): void {
    if (this.phase === 'clues' && this.order[this.turn] === p.id) {
      this.nextTurn();
      return;
    }
    this.checkProgress();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  /** nach Verbindungsänderungen: ist die Phase schon erfüllt? */
  private checkProgress() {
    const conn = this.connected();
    if (this.phase === 'reveal' && conn.every((id) => this.ready.has(id))) this.startClues();
    else if (this.phase === 'vote' && conn.every((id) => this.votes.has(id))) this.tally();
    else this.ctx.publishState();
  }

  // ------------------------------------------------------------------ Ablauf

  private connected(): PlayerId[] {
    return this.order.filter((id) => this.ctx.getPlayer(id)?.isConnected);
  }

  private setPhase(phase: ImposterPhase, seconds: number | null, onEnd?: () => void) {
    this.timer?.cancel();
    this.timer = null;
    this.phase = phase;
    this.phaseEndsAt = seconds ? this.ctx.now() + seconds * 1000 : null;
    if (seconds && onEnd) this.timer = this.ctx.setTimer(seconds * 1000, onEnd);
    this.ctx.publishState();
  }

  private pickWord(): WordEntry {
    let pool = wordPool(this.settings).filter((w) => !this.used.has(w.id));
    if (pool.length === 0) {
      this.used.clear();
      pool = wordPool(this.settings);
    }
    if (pool.length === 0) pool = [...DEFAULT_WORDS];
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    this.used.add(w.id);
    return w;
  }

  private startRound() {
    this.round++;
    const players = this.ctx.getPlayers().filter((p) => p.isConnected).map((p) => p.id);
    this.order = shuffle(players);
    // nicht zweimal hintereinander derselbe Imposter (wenn möglich)
    const candidates = this.order.filter((id) => id !== this.lastImposter);
    this.imposterId = (candidates.length ? candidates : this.order)[Math.floor(Math.random() * (candidates.length || this.order.length))]!;
    this.lastImposter = this.imposterId;
    // der Imposter beginnt nie
    if (this.order[0] === this.imposterId && this.order.length > 1) this.order.push(this.order.shift()!);
    this.word = this.pickWord();
    this.turn = 0;
    this.clueRound = 1;
    this.ready.clear();
    this.votes.clear();
    this.result = null;
    this.setPhase('reveal', TIMING.revealSeconds, () => this.startClues());
  }

  private startClues() {
    this.ready.clear();
    this.turn = -1;
    this.clueRound = 1;
    this.phase = 'clues';
    this.nextTurn();
  }

  /** nächste verbundene Person ist dran; nach der letzten Hinweisrunde → Diskussion */
  private nextTurn() {
    for (;;) {
      this.turn++;
      if (this.turn >= this.order.length) {
        if (this.clueRound >= this.settings.clueRounds) {
          this.startDiscuss();
          return;
        }
        this.clueRound++;
        this.turn = 0;
      }
      if (this.ctx.getPlayer(this.order[this.turn]!)?.isConnected) break;
      if (this.connected().length === 0) {
        this.startDiscuss();
        return;
      }
    }
    this.setPhase('clues', TIMING.turnSeconds, () => this.nextTurn());
  }

  private startDiscuss() {
    this.ready.clear();
    this.setPhase('discuss', this.settings.discussSeconds, () => this.startVote());
  }

  private startVote() {
    this.ready.clear();
    this.votes.clear();
    this.setPhase('vote', TIMING.voteSeconds, () => this.tally());
  }

  private tally() {
    const counts = new Map<PlayerId, number>();
    for (const target of this.votes.values()) counts.set(target, (counts.get(target) ?? 0) + 1);
    let best: PlayerId | null = null;
    let bestN = 0;
    let tie = false;
    for (const [id, n] of counts) {
      if (n > bestN) {
        best = id;
        bestN = n;
        tie = false;
      } else if (n === bestN) tie = true;
    }
    const ejectedId = tie ? null : best;
    const caught = ejectedId === this.imposterId;
    this.result = {
      imposterId: this.imposterId,
      word: this.word!.word,
      category: this.word!.category,
      ejectedId,
      votes: Object.fromEntries(this.votes),
      caught,
      guess: null,
      guessCorrect: false,
      gained: {},
    };
    if (caught && this.ctx.getPlayer(this.imposterId)?.isConnected) {
      // Wort bleibt noch geheim, bis der Imposter geraten hat
      const pending = this.result;
      this.result = null;
      this.pendingResult = pending;
      this.setPhase('guess', TIMING.guessSeconds, () => this.finishRound(null));
      return;
    }
    this.finishRound(null);
  }

  private pendingResult: ImposterRoundResult | null = null;

  private finishRound(guess: string | null) {
    const r = this.pendingResult ?? this.result!;
    this.pendingResult = null;
    r.guess = guess;
    r.guessCorrect = !!guess && evaluateGuess(guess, r.word) !== 'wrong';
    const gained: Record<PlayerId, number> = {};
    const add = (id: PlayerId, n: number) => {
      if (n <= 0) return;
      gained[id] = (gained[id] ?? 0) + n;
      this.scores.set(id, (this.scores.get(id) ?? 0) + n);
    };
    if (!r.caught) add(r.imposterId, POINTS.imposterEscapes);
    else {
      for (const id of this.order) {
        if (id === r.imposterId) continue;
        add(id, POINTS.crewCatch);
        if (r.votes[id] === r.imposterId) add(id, POINTS.correctVote);
      }
      if (r.guessCorrect) add(r.imposterId, POINTS.imposterGuess);
    }
    r.gained = gained;
    this.result = r;
    this.setPhase('result', TIMING.resultSeconds, () => this.next());
  }

  private endWithoutImposter(message = 'Der Imposter hat das Spiel verlassen – neue Runde.') {
    this.pendingResult = null;
    this.result = {
      imposterId: this.imposterId,
      word: this.word?.word ?? '',
      category: this.word?.category ?? '',
      ejectedId: null,
      votes: {},
      caught: false,
      guess: null,
      guessCorrect: false,
      gained: {},
      imposterLeft: true,
    };
    this.order = this.order.filter((id) => this.ctx.getPlayer(id));
    this.ctx.notify('all', 'info', message);
    this.setPhase('result', 6, () => this.next());
  }

  private next() {
    if (this.round >= this.settings.rounds || this.ctx.getPlayers().filter((p) => p.isConnected).length < 3) {
      this.finish();
      return;
    }
    this.startRound();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.timer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.scores.get(p.id) ?? 0;
    this.ctx.endGame({ scores, summary: `${this.round} ${this.round === 1 ? 'Runde' : 'Runden'} Imposter` });
  }
}

export const imposterServerModule: ServerGameModule<ImposterSettings> = {
  meta: imposterMeta,
  defaultSettings: DEFAULT_IMPOSTER_SETTINGS,
  parseSettings: parseImposterSettings,
  canStart(players, settings) {
    if (players.filter((p) => p.isConnected).length < 3) return 'Imposter braucht mindestens 3 Spieler.';
    if (wordPool(settings).length === 0) return 'Mit dieser Auswahl gibt es keine Wörter – wähle mehr Kategorien oder Schwierigkeiten.';
    return null;
  },
  createEngine(ctx, settings) {
    return new ImposterEngine(ctx, settings);
  },
};
