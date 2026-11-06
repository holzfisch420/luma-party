/** Schriftgröße (in rem) für ein Wort in einem Comic-Stern – lange Wörter werden kleiner. */
export function fitWord(word: string, baseRem: number, maxChars = 7): string {
  const len = Math.max(1, word.length);
  return `${(baseRem * Math.min(1, maxChars / len)).toFixed(2)}rem`;
}
