import type { AvatarConfig } from '../avatar';

/** Öffentliche Kontodaten (ohne Passwort). */
export interface PublicAccount {
  id: string;
  username: string;
  avatar: AvatarConfig;
  createdAt: number;
}

export interface AuthResponse {
  token: string;
  account: PublicAccount;
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 16;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 100;
/** Buchstaben (inkl. Umlaute), Ziffern, Leerzeichen, Punkt, Binde- und Unterstrich */
export const USERNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u;
