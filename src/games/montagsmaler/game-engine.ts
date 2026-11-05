/**
 * Montagsmaler – serverseitige Game-Engine.
 *
 * Der Server ist die einzige Quelle der Wahrheit:
 *  - das geheime Wort existiert nur hier und im privaten Zustand des Zeichners
 *  - richtige Antworten werden ausschließlich hier geprüft
 *  - Zeichenoperationen werden nur vom aktuellen Zeichner angenommen und validiert
 */
import type {
  GameContext,
  GameEngine,
  GamePlayer,
  GameServices,
  ServerGameModule,
  TimerHandle,
  Viewer,
} from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import type { WordEntry } from '../../shared/types/words';
import { sanitizeText } from '../../shared/utils/text';
import {
  DEFAULT_MONTAGSMALER_SETTINGS,
  GUESS_MAX_LENGTH,
  montagsmalerMeta,
  parseMontagsmalerSettings,
  PHASE_TIMING,
  type MontagsmalerSettings,
} from './game-config';
import { applyDrawOp, DRAW_LIMITS, sanitizeDrawOp } from './logic/draw-model';
import { drawerPoints, guesserPoints } from './logic/scoring';
import { buildMask, evaluateGuess, isGuessableChar, normalizeGuess } from './logic/word-utils';
import {
  MM_EVENTS,
  type CanvasSyncEvent,
  type ChatEvent,
  type CorrectEvent,
  type DrawEvent,
  type DrawOp,
  type GuessFeedbackEvent,
  type MontagsmalerPhase,
  type MontagsmalerPrivateState,
  type MontagsmalerPublicState,
  type RevealReason,
  type Stroke,
} from './types';
import { DEFAULT_WORDS } from './words/default-words';

const GUESS_WINDOW_MS = 4000;
const GUESS_MAX_PER_WINDOW = 5;

/** Baut den Wörterpool gemäß Spielmodus, Kategorien und Schwierigkeit. */
export function buildWordPool(settings: MontagsmalerSettings, services: GameServices): WordEntry[] {
  const source: WordEntry[] = [];
  if (settings.wordMode !== 'custom') source.push(...DEFAULT_WORDS);
  if (settings.wordMode !== 'standard') source.push(...services.wordLists.wordsFrom(settings.customListIds));

  const categories = new Set<string>(settings.categories);
  const difficulties = new Set<string>(settings.difficulties);
  const seen = new Set<string>();
  const pool: WordEntry[] = [];
  for (const w of source) {
    if (!categories.has(w.category) || !difficulties.has(w.difficulty)) continue;
    const key = normalizeGuess(w.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pool.push(w);
  }
  return pool;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export class MontagsmalerEngine implements GameEngine<MontagsmalerPublicState, MontagsmalerPrivateState> {
  private phase: MontagsmalerPhase = 'choosing';
  private round = 1;
  private turn = 0;
  private turnQueue: PlayerId[] = [];
  private drawerId: PlayerId | null = null;
  private word: WordEntry | null = null;
  private choices: WordEntry[] = [];
  private phaseEndsAt = 0;
  private phaseDurationMs = 0;
  private phaseTimer: TimerHandle | null = null;
  private hintTimers: TimerHandle[] = [];
  private drawerGraceTimer: TimerHandle | null = null;
  private revealed = new Set<number>();
  private scores = new Map<PlayerId, number>();
  private correct: { playerId: PlayerId; points: number; rank: number }[] = [];
  private turnGains = new Map<PlayerId, number>();
  private strokes: Stroke[] = [];
  private totalPoints = { value: 0 };
  private usedWords = new Set<string>();
  private guessLog = new Map<PlayerId, number[]>();
  private reveal: { word: string; reason: RevealReason } | null = null;
  private eventSeq = 0;
  private wordsPlayed = 0;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: MontagsmalerSettings,
    private readonly pool: WordEntry[],
  ) {}

  // ------------------------------------------------------------------ Lebenszyklus

  start(): void {
    for (const p of this.ctx.getPlayers()) this.scores.set(p.id, 0);
    this.turnQueue = this.connectedPlayers().map((p) => p.id);
    this.nextTurn();
  }

  dispose(): void {
    this.finished = true;
    this.clearTurnTimers();
    this.drawerGraceTimer?.cancel();
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): MontagsmalerPublicState {
    const showMask = this.phase === 'drawing' && this.word;
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: this.settings.rounds,
      turn: this.turn,
      drawerId: this.drawerId,
      phaseEndsAt: this.phaseEndsAt,
      phaseDurationMs: this.phaseDurationMs,
      wordMask: showMask ? buildMask(this.word!.word, this.revealed) : null,
      category: this.settings.showCategory && this.word && this.phase !== 'choosing' ? this.word.category : null,
      scores: [...this.scores].map(([playerId, score]) => ({ playerId, score })),
      correctGuesses: this.correct.map((c) => ({ ...c })),
      turnGains: Object.fromEntries(this.turnGains),
      reveal: this.phase === 'reveal' ? this.reveal : null,
      upcomingDrawerIds: [...this.turnQueue],
    };
  }

  getPrivateState(playerId: PlayerId): MontagsmalerPrivateState {
    if (playerId === this.drawerId) {
      return {
        role: 'drawer',
        word: this.phase === 'choosing' ? null : (this.word?.word ?? null),
        choices: this.phase === 'choosing' ? this.choices.map((c) => c.word) : null,
      };
    }
    const hasGuessed = this.correct.some((c) => c.playerId === playerId);
    return { role: 'guesser', hasGuessed, word: hasGuessed || this.phase === 'reveal' ? (this.word?.word ?? null) : null };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    switch (type) {
      case 'chooseWord':
        return this.handleChoose(playerId, data.index);
      case 'draw':
        return this.handleDraw(playerId, data.ops);
      case 'guess':
        return this.handleGuess(playerId, data.text);
      default:
        return;
    }
  }

  private handleChoose(playerId: PlayerId, index: unknown): void {
    if (this.phase !== 'choosing' || playerId !== this.drawerId) return;
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= this.choices.length) return;
    this.word = this.choices[index]!;
    this.startDrawing();
  }

  private handleDraw(playerId: PlayerId, rawOps: unknown): void {
    // nur der aktuelle Zeichner darf während der Zeichenphase zeichnen
    if (this.phase !== 'drawing' || playerId !== this.drawerId) return;
    if (!Array.isArray(rawOps) || rawOps.length === 0 || rawOps.length > DRAW_LIMITS.maxOpsPerMessage) return;
    const applied: DrawOp[] = [];
    for (const raw of rawOps) {
      const op = sanitizeDrawOp(raw);
      if (op && applyDrawOp(this.strokes, op, this.totalPoints)) applied.push(op);
    }
    if (applied.length === 0) return;
    const event: DrawEvent = { turn: this.turn, ops: applied };
    this.ctx.emit(MM_EVENTS.draw, event, { to: 'all', except: playerId });
  }

  private handleGuess(playerId: PlayerId, rawText: unknown): void {
    if (this.phase !== 'drawing' || !this.word || playerId === this.drawerId) return;
    if (!this.ctx.getPlayer(playerId)) return;
    if (this.correct.some((c) => c.playerId === playerId)) return; // keine Doppelpunkte
    const text = sanitizeText(rawText, GUESS_MAX_LENGTH);
    if (!text) return;

    // Rate-Limit: max. n Versuche pro Zeitfenster
    const now = this.ctx.now();
    const log = (this.guessLog.get(playerId) ?? []).filter((t) => now - t < GUESS_WINDOW_MS);
    if (log.length >= GUESS_MAX_PER_WINDOW) {
      this.feedback(playerId, { kind: 'rate-limited' });
      return;
    }
    log.push(now);
    this.guessLog.set(playerId, log);

    const result = evaluateGuess(text, this.word.word);
    if (result === 'correct') {
      this.registerCorrectGuess(playerId);
      return;
    }
    const chat: ChatEvent = { id: this.nextEventId(), playerId, text };
    this.ctx.emit(MM_EVENTS.chat, chat);
    this.feedback(playerId, { kind: result === 'close' ? 'close' : 'wrong', text });
  }

  private registerCorrectGuess(playerId: PlayerId): void {
    const rank = this.correct.length;
    const remaining = Math.max(0, this.phaseEndsAt - this.ctx.now()) / Math.max(1, this.phaseDurationMs);
    const points = guesserPoints(this.settings.scoring, rank, remaining);
    this.correct.push({ playerId, points, rank: rank + 1 });
    this.addScore(playerId, points);
    if (this.drawerId && this.ctx.getPlayer(this.drawerId)) this.addScore(this.drawerId, drawerPoints(this.settings.scoring));

    const event: CorrectEvent = { id: this.nextEventId(), playerId, rank: rank + 1, points };
    this.ctx.emit(MM_EVENTS.correct, event);
    this.feedback(playerId, { kind: 'correct' });
    this.ctx.publishState();
    this.checkAllGuessed();
  }

  // ------------------------------------------------------------------ Spieler-Ereignisse

  onPlayerJoined(player: GamePlayer): void {
    if (!this.scores.has(player.id)) this.scores.set(player.id, 0);
    this.ctx.publishState();
  }

  onPlayerLeft(player: GamePlayer): void {
    this.scores.delete(player.id);
    this.turnQueue = this.turnQueue.filter((id) => id !== player.id);
    this.correct = this.correct.filter((c) => c.playerId !== player.id);
    if (player.id === this.drawerId && this.phase !== 'reveal') {
      this.endTurn('drawer-left');
      return;
    }
    this.checkAllGuessed();
    this.ctx.publishState();
  }

  onPlayerDisconnected(player: GamePlayer): void {
    if (player.id === this.drawerId && this.phase !== 'reveal') {
      this.drawerGraceTimer?.cancel();
      this.drawerGraceTimer = this.ctx.setTimer(PHASE_TIMING.drawerReconnectGraceSeconds * 1000, () => {
        const drawer = this.drawerId ? this.ctx.getPlayer(this.drawerId) : undefined;
        if (player.id === this.drawerId && (!drawer || !drawer.isConnected) && this.phase !== 'reveal') {
          this.endTurn('drawer-left');
        }
      });
    }
    // kurze Verbindungsabbrüche (z. B. Neuladen) sollen den Zug nicht sofort beenden
    this.ctx.setTimer(PHASE_TIMING.guesserReconnectGraceSeconds * 1000, () => this.checkAllGuessed());
    this.ctx.publishState();
  }

  onPlayerReconnected(player: GamePlayer): void {
    if (player.id === this.drawerId) {
      this.drawerGraceTimer?.cancel();
      this.drawerGraceTimer = null;
    }
    this.ctx.publishState();
  }

  /** Zeichenstand für neu verbundene Geräte wiederherstellen */
  onViewerSync(viewer: Viewer): void {
    const event: CanvasSyncEvent = { turn: this.turn, strokes: this.strokes };
    if (viewer.kind === 'host') this.ctx.emit(MM_EVENTS.canvasSync, event, { to: 'host' });
    else this.ctx.emit(MM_EVENTS.canvasSync, event, { to: 'player', playerId: viewer.playerId });
  }

  // ------------------------------------------------------------------ Rundenablauf

  private nextTurn(): void {
    if (this.finished) return;
    this.clearTurnTimers();
    this.drawerGraceTimer?.cancel();

    if (this.connectedPlayers().length < 2) {
      this.ctx.notify('all', 'info', 'Zu wenige Spieler verbunden – das Spiel wird beendet.');
      return this.finish();
    }

    let drawer: GamePlayer | undefined;
    while (!drawer) {
      const nextId = this.turnQueue.shift();
      if (nextId === undefined) {
        if (this.turn > 0) this.round++;
        if (this.round > this.settings.rounds) return this.finish();
        this.turnQueue = this.connectedPlayers().map((p) => p.id);
        continue;
      }
      const p = this.ctx.getPlayer(nextId);
      if (p && p.isConnected) drawer = p;
    }

    this.turn++;
    this.drawerId = drawer.id;
    this.word = null;
    this.reveal = null;
    this.revealed.clear();
    this.correct = [];
    this.turnGains.clear();
    this.strokes = [];
    this.totalPoints = { value: 0 };
    this.guessLog.clear();
    this.choices = this.pickWords(this.settings.wordChoices);

    if (this.choices.length === 1) {
      this.word = this.choices[0]!;
      this.startDrawing();
      return;
    }
    this.setPhase('choosing', PHASE_TIMING.chooseSeconds * 1000, () => {
      // Zeit abgelaufen → zufälliges Wort
      this.word = this.choices[Math.floor(Math.random() * this.choices.length)]!;
      this.startDrawing();
    });
    this.ctx.publishState();
  }

  private startDrawing(): void {
    if (!this.word) return;
    this.usedWords.add(normalizeGuess(this.word.word));
    this.wordsPlayed++;
    const durationMs = this.settings.drawTimeSeconds * 1000;
    this.setPhase('drawing', durationMs, () => this.endTurn('time'));
    this.scheduleHints(durationMs);
    // leere Zeichenfläche an alle
    this.broadcastCanvasSync();
    this.ctx.publishState();
  }

  private scheduleHints(durationMs: number): void {
    if (!this.settings.hints || !this.word) return;
    const guessable = [...this.word.word].map((ch, i) => (isGuessableChar(ch) ? i : -1)).filter((i) => i >= 0);
    const hintCount = Math.min(3, Math.max(0, Math.floor((guessable.length - 2) / 2)));
    const at = [0.5, 0.7, 0.85].slice(0, hintCount);
    for (const fraction of at) {
      this.hintTimers.push(
        this.ctx.setTimer(durationMs * fraction, () => {
          if (this.phase !== 'drawing' || !this.word) return;
          const hidden = guessable.filter((i) => !this.revealed.has(i));
          if (hidden.length <= 2) return;
          this.revealed.add(hidden[Math.floor(Math.random() * hidden.length)]!);
          this.ctx.publishState();
        }),
      );
    }
  }

  private endTurn(reason: RevealReason): void {
    if (this.phase === 'reveal' || this.finished) return;
    this.clearTurnTimers();
    this.drawerGraceTimer?.cancel();
    if (!this.word) {
      // Zeichner war noch bei der Wortwahl
      this.word = this.choices[0] ?? null;
    }
    this.reveal = { word: this.word?.word ?? '', reason };
    this.setPhase('reveal', PHASE_TIMING.revealSeconds * 1000, () => this.nextTurn());
    this.ctx.publishState();
  }

  private checkAllGuessed(): void {
    if (this.phase !== 'drawing') return;
    const guessers = this.connectedPlayers().filter((p) => p.id !== this.drawerId);
    if (guessers.length === 0) return this.endTurn('skipped');
    const done = new Set(this.correct.map((c) => c.playerId));
    if (guessers.every((p) => done.has(p.id))) this.endTurn('all-guessed');
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.clearTurnTimers();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) scores[p.id] = this.scores.get(p.id) ?? 0;
    this.ctx.endGame({
      scores,
      summary: `${Math.min(this.round, this.settings.rounds)} ${this.settings.rounds === 1 ? 'Runde' : 'Runden'} · ${this.wordsPlayed} Wörter gezeichnet`,
    });
  }

  // ------------------------------------------------------------------ Hilfsfunktionen

  private setPhase(phase: MontagsmalerPhase, durationMs: number, onEnd: () => void): void {
    this.phaseTimer?.cancel();
    this.phase = phase;
    this.phaseDurationMs = durationMs;
    this.phaseEndsAt = this.ctx.now() + durationMs;
    this.phaseTimer = this.ctx.setTimer(durationMs, onEnd);
  }

  private clearTurnTimers(): void {
    this.phaseTimer?.cancel();
    this.phaseTimer = null;
    for (const t of this.hintTimers) t.cancel();
    this.hintTimers = [];
  }

  private pickWords(count: number): WordEntry[] {
    let candidates = this.pool.filter((w) => !this.usedWords.has(normalizeGuess(w.word)));
    if (candidates.length < count) {
      // Pool erschöpft → wieder von vorne beginnen
      this.usedWords.clear();
      candidates = [...this.pool];
    }
    return shuffle([...candidates]).slice(0, Math.max(1, Math.min(count, candidates.length)));
  }

  private addScore(playerId: PlayerId, points: number): void {
    this.scores.set(playerId, (this.scores.get(playerId) ?? 0) + points);
    this.turnGains.set(playerId, (this.turnGains.get(playerId) ?? 0) + points);
  }

  private connectedPlayers(): GamePlayer[] {
    return this.ctx.getPlayers().filter((p) => p.isConnected);
  }

  private feedback(playerId: PlayerId, event: GuessFeedbackEvent): void {
    this.ctx.emit(MM_EVENTS.feedback, event, { to: 'player', playerId });
  }

  private broadcastCanvasSync(): void {
    const event: CanvasSyncEvent = { turn: this.turn, strokes: this.strokes };
    this.ctx.emit(MM_EVENTS.canvasSync, event);
  }

  private nextEventId(): string {
    return `${this.turn}-${++this.eventSeq}`;
  }
}

/** Server-Modul: wird in der Server-Game-Registry registriert. */
export const montagsmalerServerModule: ServerGameModule<MontagsmalerSettings> = {
  meta: montagsmalerMeta,
  defaultSettings: DEFAULT_MONTAGSMALER_SETTINGS,
  parseSettings: parseMontagsmalerSettings,
  canStart(players, settings, services) {
    const connected = players.filter((p) => p.isConnected).length;
    if (connected < montagsmalerMeta.minPlayers) return `Montagsmaler braucht mindestens ${montagsmalerMeta.minPlayers} Spieler.`;
    if (connected > montagsmalerMeta.maxPlayers) return `Montagsmaler erlaubt höchstens ${montagsmalerMeta.maxPlayers} Spieler.`;
    if (settings.wordMode !== 'standard' && settings.customListIds.length === 0 && settings.wordMode === 'custom') {
      return 'Wähle mindestens eine eigene Wortliste aus.';
    }
    const pool = buildWordPool(settings, services);
    if (pool.length === 0) return 'Keine Wörter verfügbar – prüfe Wortlisten, Kategorien und Schwierigkeit.';
    return null;
  },
  createEngine(ctx, settings) {
    return new MontagsmalerEngine(ctx, settings, buildWordPool(settings, ctx.services));
  },
};
