/** Zentrale Konstanten für Launcher, Lobby und Server. */

/** Gut lesbares Alphabet für Raumcodes (ohne I, O, 0, 1 – verwechslungsarm). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

export const MAX_PLAYERS_PER_ROOM = 12;
export const PLAYER_NAME_MIN = 1;
export const PLAYER_NAME_MAX = 16;

/** Wie lange ein getrennter Spieler im Raum gehalten wird (Wiederverbindung möglich). */
export const PLAYER_RECONNECT_GRACE_MS = 3 * 60_000;
/** Ein Raum ohne verbundene Geräte wird nach dieser Zeit aufgeräumt. */
export const EMPTY_ROOM_TTL_MS = 15 * 60_000;

/** Rate-Limit für Spielaktionen pro Socket (Token-Bucket). */
export const ACTION_RATE_PER_SECOND = 45;
export const ACTION_BURST = 90;

/** Avatarfarben – werden reihum vergeben. */
export const AVATAR_COLORS = [
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7',
  '#748ffc', '#b197fc', '#f783ac', '#e599f7', '#63e6be', '#a9e34b',
] as const;

export const STORAGE_KEYS = {
  hostSession: 'luma.host-session',
  playerSession: 'luma.player-session',
  playerName: 'luma.player-name',
} as const;
