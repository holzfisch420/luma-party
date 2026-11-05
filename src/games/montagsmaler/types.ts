import type { PlayerId } from '../../shared/types/room';
import type { WordCategory } from '../../shared/types/words';

export type MontagsmalerPhase = 'choosing' | 'drawing' | 'reveal';

/** Zeichenoperationen – Koordinaten normalisiert auf 0..1000 (Integer). */
export type DrawOp =
  | { k: 's'; id: number; c: number; w: number; x: number; y: number } // Strich beginnen
  | { k: 'p'; id: number; pts: number[] } // Punkte anhängen [x1,y1,x2,y2,…]
  | { k: 'u' } // Undo
  | { k: 'x' }; // Leeren

export interface Stroke {
  id: number;
  /** Palettenindex oder -1 für Radierer */
  c: number;
  /** Strichstärke (Tausendstel der Breite) */
  w: number;
  pts: number[];
}

export interface ScoreEntry {
  playerId: PlayerId;
  score: number;
}

export interface CorrectGuess {
  playerId: PlayerId;
  points: number;
  rank: number;
}

export type RevealReason = 'time' | 'all-guessed' | 'drawer-left' | 'skipped';

export interface MontagsmalerPublicState {
  phase: MontagsmalerPhase;
  round: number;
  totalRounds: number;
  /** fortlaufende Zugnummer – ändert sich bei jedem neuen Zeichner */
  turn: number;
  drawerId: PlayerId | null;
  phaseEndsAt: number;
  phaseDurationMs: number;
  /** Platzhalter: null = verborgener Buchstabe, sonst sichtbares Zeichen (Leerzeichen, Bindestrich, Hinweis) */
  wordMask: (string | null)[] | null;
  category: WordCategory | null;
  scores: ScoreEntry[];
  correctGuesses: CorrectGuess[];
  /** Punkte, die in diesem Zug gewonnen wurden */
  turnGains: Record<PlayerId, number>;
  /** nur in der Reveal-Phase gesetzt */
  reveal: { word: string; reason: RevealReason } | null;
  /** Spieler, die in dieser Runde bereits gezeichnet haben bzw. noch dran sind */
  upcomingDrawerIds: PlayerId[];
}

export type MontagsmalerPrivateState =
  | { role: 'drawer'; word: string | null; choices: string[] | null }
  | { role: 'guesser'; hasGuessed: boolean; word: string | null };

// ---- Aktionen (Client → Server) ----
export type MontagsmalerAction =
  | { type: 'chooseWord'; payload: { index: number } }
  | { type: 'draw'; payload: { ops: DrawOp[] } }
  | { type: 'guess'; payload: { text: string } };

// ---- Events (Server → Client) ----
export interface ChatEvent {
  id: string;
  playerId: PlayerId;
  text: string;
}
export interface CorrectEvent {
  id: string;
  playerId: PlayerId;
  rank: number;
  points: number;
}
export interface DrawEvent {
  turn: number;
  ops: DrawOp[];
}
export interface CanvasSyncEvent {
  turn: number;
  strokes: Stroke[];
}
export interface GuessFeedbackEvent {
  kind: 'close' | 'rate-limited' | 'correct' | 'wrong';
  text?: string;
}

export const MM_EVENTS = {
  chat: 'chat',
  correct: 'correct',
  draw: 'draw',
  canvasSync: 'canvas-sync',
  feedback: 'guess-feedback',
} as const;
