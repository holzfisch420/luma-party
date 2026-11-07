import type { PlayerId } from '../../shared/types/room';

export type ImposterPhase = 'reveal' | 'clues' | 'discuss' | 'vote' | 'guess' | 'result';

export interface ImposterRoundResult {
  imposterId: PlayerId;
  word: string;
  category: string;
  /** rausgewählte Person – null bei Gleichstand */
  ejectedId: PlayerId | null;
  /** wer für wen gestimmt hat */
  votes: Record<PlayerId, PlayerId>;
  caught: boolean;
  guess: string | null;
  guessCorrect: boolean;
  /** Punkte dieser Runde */
  gained: Record<PlayerId, number>;
  /** Imposter hat das Spiel verlassen */
  imposterLeft?: boolean;
}

export interface ImposterPublicState {
  phase: ImposterPhase;
  round: number;
  totalRounds: number;
  phaseEndsAt: number | null;
  /** Mitspielende dieser Runde in Sprechreihenfolge */
  order: PlayerId[];
  turn: number;
  clueRound: number;
  clueRounds: number;
  /** Kategorie (nur wenn für alle sichtbar) */
  category: string | null;
  /** Karte gesehen bzw. bereit zum Abstimmen */
  ready: PlayerId[];
  voted: PlayerId[];
  result: ImposterRoundResult | null;
  /** erwischte Person, die gerade das Wort rät (Phase „guess“) */
  accusedId: PlayerId | null;
  scores: Record<PlayerId, number>;
}

export interface ImposterPrivateState {
  inRound: boolean;
  role: 'crew' | 'imposter' | null;
  word: string | null;
  myVote: PlayerId | null;
}
