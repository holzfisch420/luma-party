/**
 * „Plopp!“ – Server-Engine.
 *
 * Ablauf je Runde: Aufgabe zeigen → Fisch wandert reihum, jede gültige Antwort gibt ihn weiter →
 * eine versteckte Zündschnur (zufällig) läuft ab → wer den Fisch hält, verliert ein Leben.
 * Die Zündschnur läuft über alle Weitergaben hinweg und pausiert nur während einer Abstimmung.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { sanitizeText } from '../../shared/utils/text';
import { ANSWER_MAX, DEFAULT_PLOPP_SETTINGS, FUSE_RANGES, parsePloppSettings, ploppMeta, TIMING, type PloppSettings } from './game-config';
import { allPrompts, matchAnswer, normalizeAnswer, type Prompt } from './logic/answers';
import type { PloppEvent, PloppPhase, PloppPrivateState, PloppPublicState, PloppUsed } from './types';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

type Feedback = NonNullable<PloppPrivateState['feedback']>;

export class PloppEngine implements GameEngine<PloppPublicState, PloppPrivateState> {
  private phase: PloppPhase = 'intro';
  private order: PlayerId[] = [];
  private lives = new Map<PlayerId, number>();
  private scores = new Map<PlayerId, number>();
  private round = 0;
  private prompt!: Prompt;
  private baseDeck: Prompt[] = [];
  private letterDeck: Prompt[] = [];
  private lastSource = '';
  private holderId: PlayerId | null = null;
  private used: PloppUsed[] = [];
  /** bereits genannte Antworten (normalisierte Hauptschreibweise) */
  private usedKeys = new Set<string>();
  /** wer in dieser Runde schon eine Abstimmung verloren hat */
  private appealed = new Set<PlayerId>();
  private feedback = new Map<PlayerId, Feedback>();
  private eventId = 0;
  private event: PloppEvent | null = null;

  // Zündschnur
  private fuseLeft = 0;
  private runStartedAt = 0;
  private fuse: PloppPublicState['fuse'] = null;
  private fuseTimer: TimerHandle | null = null;

  private phaseEndsAt: number | null = null;
  private phaseTimer: TimerHandle | null = null;
  private vote: { playerId: PlayerId; text: string; key: string; eligible: PlayerId[]; votes: Map<PlayerId, boolean> } | null = null;
  private pop: PloppPublicState['pop'] = null;
  private winnerId: PlayerId | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: PloppSettings,
  ) {}

  start(): void {
    const players = this.ctx.getPlayers().filter((p) => p.isConnected);
    this.order = players.map((p) => p.id);
    for (const id of this.order) {
      this.lives.set(id, this.settings.lives);
      this.scores.set(id, 0);
    }
    this.holderId = this.order[Math.floor(Math.random() * this.order.length)] ?? null;
    this.startRound();
  }

  dispose(): void {
    this.fuseTimer?.cancel();
    this.phaseTimer?.cancel();
  }

  // ------------------------------------------------------------------ Hilfen

  private alive(id: PlayerId): boolean {
    return (this.lives.get(id) ?? 0) > 0;
  }

  /** noch im Spiel und verbunden */
  private active(id: PlayerId): boolean {
    return this.alive(id) && !!this.ctx.getPlayer(id)?.isConnected;
  }

  private activePlayers(): PlayerId[] {
    return this.order.filter((id) => this.active(id));
  }

  /** nächste aktive Person nach `from` in Sitzreihenfolge */
  private nextAfter(from: PlayerId | null): PlayerId | null {
    if (!this.order.length) return null;
    const start = from ? this.order.indexOf(from) : -1;
    for (let k = 1; k <= this.order.length; k++) {
      const id = this.order[(start + k + this.order.length) % this.order.length]!;
      if (id !== from && this.active(id)) return id;
    }
    return null;
  }

  private emitEvent(e: Omit<PloppEvent, 'id'>) {
    this.event = { ...e, id: ++this.eventId };
  }

  private setFeedback(id: PlayerId, f: Omit<Feedback, 'id'>) {
    this.feedback.set(id, { ...f, id: ++this.eventId });
  }

  private pickPrompt(): Prompt {
    const prompts = allPrompts().filter((p) => this.settings.packs.includes(p.pack));
    const pool = prompts.length ? prompts : allPrompts();
    const refill = (letter: boolean) => shuffle(pool.filter((p) => !!p.letter === letter));
    const useLetter = this.settings.letters && Math.random() < TIMING.letterShare && pool.some((p) => p.letter);
    for (let tries = 0; tries < 6; tries++) {
      const deck = useLetter ? this.letterDeck : this.baseDeck;
      if (!deck.length) deck.push(...refill(useLetter));
      const p = deck.pop();
      if (!p) break;
      const source = p.id.split('-')[0]!;
      if (source === this.lastSource && tries < 5) continue; // nicht zweimal dieselbe Kategorie hintereinander
      this.lastSource = source;
      return p;
    }
    return pool[Math.floor(Math.random() * pool.length)]!;
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): PloppPublicState {
    return {
      phase: this.phase,
      round: this.round,
      prompt: { text: this.prompt.text, pack: this.prompt.pack, letter: this.prompt.letter },
      holderId: this.holderId,
      order: this.order,
      lives: Object.fromEntries(this.lives),
      maxLives: this.settings.lives,
      used: this.used,
      fuse: this.fuse,
      phaseEndsAt: this.phaseEndsAt,
      vote: this.vote ? { playerId: this.vote.playerId, text: this.vote.text, voters: [...this.vote.votes.keys()], eligible: this.vote.eligible } : null,
      pop: this.pop,
      event: this.event,
      scores: Object.fromEntries(this.scores),
      winnerId: this.winnerId,
    };
  }

  getPrivateState(playerId: PlayerId): PloppPrivateState {
    const v = this.vote?.votes.get(playerId);
    return {
      isHolder: playerId === this.holderId,
      feedback: this.feedback.get(playerId) ?? null,
      myVote: v === undefined ? null : v ? 'yes' : 'no',
      canVote: !!this.vote && this.vote.eligible.includes(playerId),
      canAppeal: this.settings.vote && !this.appealed.has(playerId),
    };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || !this.order.includes(playerId)) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    if (type === 'answer') return this.answer(playerId, sanitizeText(data.text, ANSWER_MAX));
    if (type === 'vote' && this.phase === 'vote' && this.vote?.eligible.includes(playerId) && typeof data.yes === 'boolean') {
      this.vote.votes.set(playerId, data.yes);
      if (this.vote.eligible.every((id) => this.vote!.votes.has(id) || !this.active(id))) this.resolveVote();
      else this.ctx.publishState();
    }
  }

  private answer(playerId: PlayerId, typed: string) {
    if (this.phase !== 'play' || playerId !== this.holderId || !typed) return;
    const res = matchAnswer(this.prompt, typed);
    if (res.kind === 'empty') return;
    if (res.kind === 'ok') {
      const key = res.answer.keys[0]!;
      if (this.usedKeys.has(key)) {
        this.setFeedback(playerId, { kind: 'dupe', typed, answer: res.answer.display });
        this.emitEvent({ kind: 'dupe', playerId, text: typed, answer: res.answer.display });
        this.ctx.publishState();
        return;
      }
      this.accept(playerId, key, { by: playerId, text: res.answer.display, typed: res.corrected ? typed : undefined });
      this.setFeedback(playerId, { kind: 'ok', typed, answer: res.answer.display, corrected: res.corrected });
      return;
    }
    if (res.kind === 'letter') {
      this.setFeedback(playerId, { kind: 'letter', typed, answer: res.answer.display });
      this.emitEvent({ kind: 'letter', playerId, text: typed, answer: res.answer.display });
      this.ctx.publishState();
      return;
    }
    // unbekannt: schon per Abstimmung zugelassen?
    const key = `custom:${normalizeAnswer(typed)}`;
    if (this.usedKeys.has(key)) {
      this.setFeedback(playerId, { kind: 'dupe', typed, answer: typed });
      this.emitEvent({ kind: 'dupe', playerId, text: typed, answer: typed });
      this.ctx.publishState();
      return;
    }
    const eligible = this.activePlayers().filter((id) => id !== playerId);
    if (this.settings.vote && !this.appealed.has(playerId) && eligible.length > 0) {
      this.startVote(playerId, typed, key, eligible);
      return;
    }
    this.setFeedback(playerId, { kind: 'unknown', typed });
    this.emitEvent({ kind: 'unknown', playerId, text: typed });
    this.ctx.publishState();
  }

  /** gültige Antwort: merken und Fisch weitergeben */
  private accept(playerId: PlayerId, key: string, entry: PloppUsed) {
    this.usedKeys.add(key);
    this.used.push(entry);
    const to = this.nextAfter(playerId);
    this.emitEvent({ kind: 'pass', playerId, text: entry.typed ?? entry.text, answer: entry.text, to: to ?? undefined });
    if (to) this.holderId = to;
    this.ctx.publishState();
  }

  // ------------------------------------------------------------------ Abstimmung

  private startVote(playerId: PlayerId, text: string, key: string, eligible: PlayerId[]) {
    this.pauseFuse();
    this.phase = 'vote';
    this.vote = { playerId, text, key, eligible, votes: new Map() };
    this.setFeedback(playerId, { kind: 'pending', typed: text });
    this.phaseEndsAt = this.ctx.now() + TIMING.voteMs;
    this.phaseTimer?.cancel();
    this.phaseTimer = this.ctx.setTimer(TIMING.voteMs, () => this.resolveVote());
    this.ctx.publishState();
  }

  private resolveVote() {
    const v = this.vote;
    if (!v || this.phase !== 'vote') return;
    this.phaseTimer?.cancel();
    const yes = [...v.votes.values()].filter(Boolean).length;
    const no = v.votes.size - yes;
    this.vote = null;
    this.phase = 'play';
    this.phaseEndsAt = null;
    // im Zweifel für die Antwort: Gleichstand oder keine Stimmen = gilt
    if (yes >= no) {
      this.setFeedback(v.playerId, { kind: 'ok', typed: v.text, answer: v.text });
      this.accept(v.playerId, v.key, { by: v.playerId, text: v.text, voted: true });
    } else {
      this.appealed.add(v.playerId);
      this.setFeedback(v.playerId, { kind: 'rejected', typed: v.text });
      this.emitEvent({ kind: 'rejected', playerId: v.playerId, text: v.text });
    }
    // Person mit Fisch könnte inzwischen weg sein
    if (this.holderId && !this.active(this.holderId)) this.skipHolder();
    this.resumeFuse();
    this.ctx.publishState();
  }

  // ------------------------------------------------------------------ Ablauf

  private startRound() {
    this.round++;
    this.prompt = this.pickPrompt();
    this.used = [];
    this.usedKeys.clear();
    this.appealed.clear();
    this.feedback.clear();
    this.event = null;
    this.pop = null;
    this.vote = null;
    this.fuse = null;
    if (!this.holderId || !this.active(this.holderId)) this.holderId = this.nextAfter(this.holderId);
    this.phase = 'intro';
    this.phaseEndsAt = this.ctx.now() + TIMING.introMs;
    this.phaseTimer?.cancel();
    this.phaseTimer = this.ctx.setTimer(TIMING.introMs, () => this.beginPlay());
    this.ctx.publishState();
  }

  private beginPlay() {
    const range = FUSE_RANGES[this.settings.fuse];
    this.fuseLeft = (range.min + Math.random() * (range.max - range.min)) * 1000;
    const now = this.ctx.now();
    this.fuse = { startedAt: now, pausedAt: null, pausedMs: 0, max: range.max * 1000 };
    this.phase = 'play';
    this.phaseEndsAt = null;
    this.runFuse();
    this.ctx.publishState();
  }

  private runFuse() {
    this.runStartedAt = this.ctx.now();
    this.fuseTimer?.cancel();
    this.fuseTimer = this.ctx.setTimer(Math.max(0, this.fuseLeft), () => this.explode());
  }

  private pauseFuse() {
    if (!this.fuse || this.fuse.pausedAt !== null) return;
    this.fuseTimer?.cancel();
    const now = this.ctx.now();
    this.fuseLeft -= now - this.runStartedAt;
    this.fuse = { ...this.fuse, pausedAt: now };
  }

  private resumeFuse() {
    if (!this.fuse || this.fuse.pausedAt === null) return;
    const now = this.ctx.now();
    this.fuse = { ...this.fuse, pausedMs: this.fuse.pausedMs + (now - this.fuse.pausedAt), pausedAt: null };
    this.runFuse();
  }

  private explode() {
    if (this.phase !== 'play' || this.finished) return;
    this.fuseTimer?.cancel();
    if (this.fuse) this.fuse = { ...this.fuse, pausedAt: this.ctx.now() };
    const loser = this.holderId;
    this.phase = 'pop';
    if (loser) {
      const left = Math.max(0, (this.lives.get(loser) ?? 1) - 1);
      this.lives.set(loser, left);
      this.pop = { playerId: loser, livesLeft: left, eliminated: left === 0 };
      // alle anderen, die noch dabei sind, haben die Runde überstanden
      for (const id of this.order) if (id !== loser && this.alive(id)) this.scores.set(id, (this.scores.get(id) ?? 0) + 1);
    }
    this.phaseEndsAt = this.ctx.now() + TIMING.popMs;
    this.phaseTimer?.cancel();
    this.phaseTimer = this.ctx.setTimer(TIMING.popMs, () => this.afterPop());
    this.ctx.publishState();
  }

  private afterPop() {
    if (this.activePlayers().length <= 1) {
      this.finish();
      return;
    }
    // wer geplatzt ist, fängt die nächste Runde an (falls noch dabei)
    this.startRound();
  }

  /** Person mit Fisch ist weg: Fisch geht automatisch weiter */
  private skipHolder() {
    const from = this.holderId;
    const to = this.nextAfter(from);
    if (!to) return;
    this.holderId = to;
    if (from) this.emitEvent({ kind: 'skip', playerId: from, text: '', to });
  }

  private checkPlayers() {
    if (this.finished) return;
    if (this.activePlayers().length <= 1 && this.phase !== 'pop') {
      this.finish();
      return;
    }
    if (this.phase === 'vote' && this.vote) {
      if (!this.active(this.vote.playerId) || this.vote.eligible.every((id) => this.vote!.votes.has(id) || !this.active(id))) {
        this.resolveVote();
        return;
      }
    }
    if ((this.phase === 'play' || this.phase === 'intro') && this.holderId && !this.active(this.holderId)) this.skipHolder();
    this.ctx.publishState();
  }

  onPlayerJoined(p: GamePlayer): void {
    if (!this.scores.has(p.id)) this.scores.set(p.id, 0);
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    if (!this.order.includes(p.id)) return;
    if (this.holderId === p.id && this.phase !== 'pop') this.skipHolder();
    this.order = this.order.filter((id) => id !== p.id);
    this.lives.delete(p.id);
    this.checkPlayers();
  }

  onPlayerDisconnected(): void {
    this.checkPlayers();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.fuseTimer?.cancel();
    this.phaseTimer?.cancel();
    const survivors = this.order.filter((id) => this.alive(id));
    // Gewinner: wer übrig ist (bei mehreren: meiste Leben, dann meiste Runden)
    survivors.sort((a, b) => (this.lives.get(b) ?? 0) - (this.lives.get(a) ?? 0) || (this.scores.get(b) ?? 0) - (this.scores.get(a) ?? 0));
    this.winnerId = survivors[0] ?? null;
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.scores.get(p.id) ?? 0;
    if (this.winnerId) scores[this.winnerId] = Math.max(...Object.values(scores)) + 1;
    this.ctx.endGame({ scores, summary: `${this.round} ${this.round === 1 ? 'Runde' : 'Runden'} · Punkte = überstandene Runden` });
  }
}

export const ploppServerModule: ServerGameModule<PloppSettings> = {
  meta: ploppMeta,
  defaultSettings: DEFAULT_PLOPP_SETTINGS,
  parseSettings: parsePloppSettings,
  canStart(players, settings) {
    if (players.filter((p) => p.isConnected).length < 2) return '„Plopp!“ braucht mindestens 2 Spieler.';
    if (settings.packs.length === 0) return 'Bitte mindestens eine Kategorie auswählen.';
    return null;
  },
  createEngine(ctx, settings) {
    return new PloppEngine(ctx, settings);
  },
};
