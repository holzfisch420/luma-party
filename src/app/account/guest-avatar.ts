/**
 * Avatar für Gäste ohne Konto – wird nur auf diesem Handy gespeichert.
 * Beim ersten Besuch gibt es einen zufälligen Knubbel, damit niemand nur Initialen hat.
 */
import { parseAvatar, randomAvatar, type AvatarConfig } from '../../shared/avatar';

const KEY = 'luma.guest-avatar';

export function getGuestAvatar(): AvatarConfig {
  try {
    const saved = parseAvatar(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    if (saved) return saved;
  } catch {
    /* ignorieren */
  }
  const fresh = randomAvatar();
  saveGuestAvatar(fresh);
  return fresh;
}

export function saveGuestAvatar(avatar: AvatarConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(avatar));
  } catch {
    /* privat-Modus: dann eben nur für diese Sitzung */
  }
}
