import type { PlayerId } from '../../shared/types/room';
import type { Role } from './game-config';

export type VollmondPhase = 'roles' | 'night' | 'witch' | 'morning' | 'hunter' | 'day' | 'vote' | 'verdict' | 'end';

export interface Death {
  playerId: PlayerId;
  /** nur sichtbar, wenn Rollen von Toten aufgedeckt werden (oder am Ende) */
  role: Role | null;
  cause: 'wolf' | 'gift' | 'dorf' | 'jaeger';
}

export interface VollmondPublicState {
  phase: VollmondPhase;
  day: number;
  phaseEndsAt: number | null;
  /** Sitzreihenfolge: alle, die mitspielen */
  order: PlayerId[];
  alive: PlayerId[];
  /** Rollen im Spiel (Anzahl je Rolle) – öffentlich bekannt */
  roleCount: Partial<Record<Role, number>>;
  /** wer in dieser Phase schon fertig ist (ohne zu verraten, was) */
  done: PlayerId[];
  /** Tote der letzten Nacht bzw. des letzten Urteils */
  news: Death[];
  graveyard: Death[];
  /** offene Abstimmung: wer wen wählt (null = niemand) */
  votes: Record<PlayerId, PlayerId | null>;
  /** wer zur Abstimmung bereit ist (Diskussion) */
  ready: PlayerId[];
  hunterId: PlayerId | null;
  /** Erzähltext (Fernseher liest ihn vor) */
  narration: { id: number; text: string };
  winner: 'wolf' | 'dorf' | null;
  /** am Ende: alle Rollen */
  roles: Record<PlayerId, Role> | null;
}

export interface VollmondPrivateState {
  role: Role;
  alive: boolean;
  /** andere Werwölfe (nur für Werwölfe) */
  wolves: PlayerId[];
  /** aktuelle Auswahl in dieser Phase */
  pick: PlayerId | null;
  /** Werwölfe: Wahl der anderen Wölfe */
  wolfPicks: Record<PlayerId, PlayerId | null>;
  /** Seherin: bisherige Ergebnisse */
  seen: { playerId: PlayerId; wolf: boolean; day: number }[];
  /** Hexe */
  witch: { victim: PlayerId | null; heal: boolean; poison: boolean; usedHeal: boolean; poisonTarget: PlayerId | null } | null;
  /** Leibwächter: letzte geschützte Person (darf nicht nochmal) */
  lastProtected: PlayerId | null;
  /** muss in dieser Phase etwas tun */
  task: 'none' | 'wolf' | 'seer' | 'guard' | 'dummy' | 'witch' | 'hunter' | 'vote';
}
