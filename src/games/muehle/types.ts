import type { PlayerId } from '../../shared/types/room';
import type { MillState, Side } from './logic/rules';

export interface MuehlePublicState {
  state: MillState;
  players: Record<Side, PlayerId>;
  /** Anzahl Mühlen je Seite (für die Anzeige) */
  mills: Record<Side, number>;
  /** Grund fürs Ende */
  endReason: 'pieces' | 'blocked' | 'draw' | 'resign' | 'left' | null;
}
