import type { PlayerId } from '../../shared/types/room';

export type Side = 'w' | 'b';

export type EndReason = 'checkmate' | 'timeout' | 'resign' | 'stalemate' | 'insufficient' | 'repetition' | 'fifty' | 'agreed' | 'left';

export interface SchachPublicState {
  /** aktuelle Stellung (FEN) */
  fen: string;
  /** Züge in Kurznotation (SAN) */
  history: string[];
  lastMove: { from: string; to: string } | null;
  turn: Side;
  inCheck: boolean;
  players: Record<Side, PlayerId>;
  /** Restzeit in ms zum Zeitpunkt `turnStartedAt` (null = ohne Uhr) */
  clocks: Record<Side, number> | null;
  incMs: number;
  turnStartedAt: number;
  drawOffer: Side | null;
  result: { winner: Side | null; reason: EndReason } | null;
}
