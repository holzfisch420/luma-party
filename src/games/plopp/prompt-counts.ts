/**
 * Anzahl Aufgaben je Kategorie – nur für die Anzeige in den Einstellungen,
 * damit die großen Aufgabenlisten nicht ins Startpaket der App müssen.
 * Ein Test (tests/plopp.test.ts) prüft, dass die Zahlen stimmen.
 */
import type { PromptPack } from "./prompt-types";

export const PROMPT_COUNTS: Record<PromptPack, number> = {
  natur: 22,
  essen: 9,
  welt: 25,
  alltag: 29,
  sport: 11,
  pop: 9,
  musik: 5,
  szene: 4,
};
