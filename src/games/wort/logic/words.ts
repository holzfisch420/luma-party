/** Wörter prüfen und Versuche bewerten. */
import { ANSWERS } from '../answers';
import { GUESSES_RAW } from '../guesses';
import { WORD_LENGTH } from '../game-config';
import type { Mark } from '../types';

let allowed: Set<string> | null = null;

/** Großbuchstaben, ß → SS, nur Buchstaben */
export function normalizeWord(input: string): string {
  return input
    .toUpperCase()
    .replace(/ß/g, 'SS')
    .replace(/[^A-ZÄÖÜ]/g, '');
}

export function isAllowed(word: string): boolean {
  allowed ??= new Set([...GUESSES_RAW.split(' '), ...ANSWERS]);
  return word.length === WORD_LENGTH && allowed.has(word);
}

export function answers(): string[] {
  return ANSWERS;
}

/** Farben wie üblich – doppelte Buchstaben werden nur so oft markiert, wie sie im Wort vorkommen */
export function scoreGuess(guess: string, answer: string): Mark[] {
  const g = [...guess];
  const a = [...answer];
  const marks: Mark[] = g.map(() => 'x');
  const left = new Map<string, number>();
  g.forEach((ch, i) => {
    if (ch === a[i]) marks[i] = 'g';
    else left.set(a[i]!, (left.get(a[i]!) ?? 0) + 1);
  });
  g.forEach((ch, i) => {
    if (marks[i] === 'g') return;
    const n = left.get(ch) ?? 0;
    if (n > 0) {
      marks[i] = 'y';
      left.set(ch, n - 1);
    }
  });
  return marks;
}
