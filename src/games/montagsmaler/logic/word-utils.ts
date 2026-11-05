/** Normalisierung & Vergleich von Rateversuchen. */

/** Kleinbuchstaben, Umlaute vereinheitlicht, nur Buchstaben/Ziffern. */
export function normalizeGuess(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // restliche Akzente (z. B. Café → cafe)
    .replace(/[^a-z0-9]/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

export type GuessResult = 'correct' | 'close' | 'wrong';

export function evaluateGuess(guess: string, word: string): GuessResult {
  const g = normalizeGuess(guess);
  const w = normalizeGuess(word);
  if (!g) return 'wrong';
  if (g === w) return 'correct';
  const tolerance = w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0;
  if (tolerance > 0 && Math.abs(g.length - w.length) <= tolerance && levenshtein(g, w) <= tolerance) return 'close';
  return 'wrong';
}

/** Ist das Zeichen ein zu erratender Buchstabe (sonst wird es offen angezeigt, z. B. Leerzeichen/Bindestrich)? */
export function isGuessableChar(ch: string): boolean {
  return /[\p{L}\p{N}]/u.test(ch);
}

/** Erstellt die öffentliche Wortmaske. */
export function buildMask(word: string, revealed: ReadonlySet<number>): (string | null)[] {
  return [...word].map((ch, i) => (!isGuessableChar(ch) || revealed.has(i) ? ch : null));
}
