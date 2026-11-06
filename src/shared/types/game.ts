import type { AvatarConfig } from '../avatar';

/**
 * Spiel-Metadaten, die Launcher, Server und Client gleichermaßen kennen.
 * Der Launcher arbeitet ausschließlich mit diesen Daten – er kennt keine Spielinterna.
 */
export type GameStatus = 'available' | 'beta' | 'coming-soon';

export interface GameTheme {
  /** CSS-Farben für den Cover-Verlauf */
  from: string;
  via?: string;
  to: string;
  /** Akzentfarbe für Buttons, Fokus-Ringe etc. */
  accent: string;
}

export interface GameMeta {
  id: string;
  name: string;
  tagline: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  /** geschätzte Spieldauer in Minuten [min, max] */
  durationMinutes: [number, number];
  status: GameStatus;
  theme: GameTheme;
  tags: string[];
}

/** Ergebnisse, die jedes Spiel am Ende an den Launcher zurückgibt. */
export interface GameResultEntry {
  playerId: string;
  name: string;
  avatarColor: string;
  avatar?: AvatarConfig | null;
  score: number;
  rank: number;
}

export interface GameResults {
  gameId: string;
  entries: GameResultEntry[];
  winnerIds: string[];
  finishedAt: number;
  /** optionaler Untertitel, z. B. "3 Runden · 24 Wörter" */
  summary?: string;
}
