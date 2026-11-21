import type { PlayerId } from '../../shared/types/room';

export interface KinoResult {
  id: string;
  /** wer das will */
  likers: PlayerId[];
}

export interface KinoPublicState {
  phase: 'swipe' | 'results';
  /** die 25 Titel dieser Runde (Reihenfolge je Person siehe privater Zustand) */
  deck: string[];
  /** wie viele Karten jede Person schon bewertet hat */
  progress: Record<PlayerId, number>;
  /** wer mitwischt */
  swipers: PlayerId[];
  /** erst am Ende: Rangliste nach Matches */
  results: KinoResult[] | null;
  round: number;
}

export interface KinoPrivateState {
  /** eigene Reihenfolge der Karten */
  order: string[];
  /** bereits bewertet: id → gefällt */
  votes: Record<string, boolean>;
}
