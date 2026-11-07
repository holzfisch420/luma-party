export const WORD_CATEGORIES = [
  'Tiere',
  'Essen',
  'Gegenstände',
  'Berufe',
  'Natur',
  'Fahrzeuge',
  'Aktivitäten',
  'Orte',
  'Redewendungen',
  'Begriffe',
  'Sonstiges',
] as const;
export type WordCategory = (typeof WORD_CATEGORIES)[number];

export const WORD_DIFFICULTIES = ['leicht', 'mittel', 'schwer'] as const;
export type WordDifficulty = (typeof WORD_DIFFICULTIES)[number];

export interface WordEntry {
  id: string;
  word: string;
  category: WordCategory;
  difficulty: WordDifficulty;
}

export interface WordList {
  id: string;
  /** Besitzer (nur im öffentlichen Online-Modus gesetzt) */
  owner?: string;
  name: string;
  words: WordEntry[];
  createdAt: number;
  updatedAt: number;
}

export type WordListSummary = Omit<WordList, 'words' | 'owner'> & { wordCount: number };

export const WORD_MAX_LENGTH = 32;
export const WORD_LIST_NAME_MAX = 40;
export const WORD_LIST_MAX_WORDS = 2000;
export const WORD_LISTS_PER_OWNER = 30;
