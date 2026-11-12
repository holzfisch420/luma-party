import type { PlayerId } from '../../shared/types/room';

/** g = richtig an dieser Stelle, y = kommt vor, aber woanders, x = kommt nicht (mehr) vor */
export type Mark = 'g' | 'y' | 'x';

export interface WortBoard {
  /** Farben je Versuch – ohne Buchstaben */
  marks: Mark[][];
  solved: boolean;
  failed: boolean;
  /** Platz unter denen, die gelöst haben (1 = Erste) */
  place: number | null;
}

export interface WortPublicState {
  phase: 'play' | 'reveal';
  round: number;
  rounds: number;
  phaseEndsAt: number | null;
  boards: Record<PlayerId, WortBoard>;
  /** nach der Runde: Lösung, alle Versuche mit Buchstaben und Punkte */
  reveal: { word: string; guesses: Record<PlayerId, string[]>; gained: Record<PlayerId, number> } | null;
  scores: Record<PlayerId, number>;
}

export interface WortPrivateState {
  guesses: string[];
  marks: Mark[][];
  /** letzte Ablehnung (z. B. unbekanntes Wort) */
  error: { id: number; message: string } | null;
}
