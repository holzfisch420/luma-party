/** Typen für die Aufgaben von „Plopp!“ */

export const PROMPT_PACKS = ['alltag', 'essen', 'welt', 'natur', 'pop', 'musik', 'sport', 'szene'] as const;
export type PromptPack = (typeof PROMPT_PACKS)[number];

export const PACK_LABELS: Record<PromptPack, { label: string; emoji: string }> = {
  alltag: { label: 'Alltag & Wissen', emoji: '🏠' },
  essen: { label: 'Essen & Trinken', emoji: '🍕' },
  welt: { label: 'Länder & Orte', emoji: '🌍' },
  natur: { label: 'Tiere & Natur', emoji: '🐢' },
  pop: { label: 'Film, Serien & Games', emoji: '🎬' },
  musik: { label: 'Musik & Rap', emoji: '🎤' },
  sport: { label: 'Sport & Freizeit', emoji: '⚽' },
  szene: { label: 'Geeker & Party', emoji: '🌿' },
};

/** Rohdaten einer Aufgabe: Antworten kommagetrennt, Schreibvarianten mit „|“ */
export interface PromptSource {
  id: string;
  text: string;
  pack: PromptPack;
  /** zusätzlich Varianten „… mit B“ erzeugen */
  letters?: boolean;
  answers: string;
}
