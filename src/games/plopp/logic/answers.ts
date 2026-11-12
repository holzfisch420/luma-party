/**
 * Aufgaben aufbereiten und Antworten prüfen – mit Autokorrektur.
 *
 * Eine Eingabe wird normalisiert (Kleinschreibung, ä→ae, ß→ss, ohne Satzzeichen, ohne Artikel)
 * und zuerst exakt, dann mit typischen Endungen (Mehrzahl) und zuletzt unscharf verglichen:
 * „Tigger“ → „Tiger“, „Giraff“ → „Giraffe“, „Elefannt“ → „Elefant“.
 */
import { PROMPTS_A } from '../prompts-a';
import { PROMPTS_B } from '../prompts-b';
import { PROMPTS_C } from '../prompts-c';
import type { PromptPack, PromptSource } from '../prompt-types';

export interface Answer {
  /** angezeigte Schreibweise */
  display: string;
  /** normalisierte Schreibweisen (inkl. Varianten) */
  keys: string[];
}

export interface Prompt {
  id: string;
  text: string;
  pack: PromptPack;
  /** nur Antworten mit diesem Anfangsbuchstaben (normalisiert, z. B. „a“) */
  letter?: string;
  answers: Answer[];
}

export const PROMPT_SOURCES: PromptSource[] = [...PROMPTS_A, ...PROMPTS_B, ...PROMPTS_C];

const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'the', 'a', 'an', 'le', 'la', 'il']);

/** Kleinbuchstaben, Umlaute vereinheitlicht, ohne Artikel und Satzzeichen */
export function normalizeAnswer(text: string): string {
  const words = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/&/g, ' und ')
    .replace(/\$/g, 's')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  // Artikel am Anfang weglassen („der Tiger“ → „tiger“), aber nicht, wenn nur der Artikel bleibt
  while (words.length > 1 && ARTICLES.has(words[0]!)) words.shift();
  return words.join('');
}

/** Damerau-Levenshtein (Vertauschung zweier Nachbarbuchstaben zählt als 1) mit Abbruch */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length;
  const m = b.length;
  let prev2: number[] = [];
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2]! + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[m]!;
}

/** erlaubte Tippfehler je nach Wortlänge */
export function allowedTypos(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

function parseAnswers(csv: string): Answer[] {
  const out: Answer[] = [];
  const seen = new Set<string>();
  for (const entry of csv.split(',')) {
    const variants = entry
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!variants.length) continue;
    const keys = [...new Set(variants.map(normalizeAnswer).filter(Boolean))];
    if (!keys.length || keys.some((k) => seen.has(k))) continue; // doppelte Einträge überspringen
    keys.forEach((k) => seen.add(k));
    out.push({ display: variants[0]!, keys });
  }
  return out;
}

/** Mindestanzahl Antworten für eine Buchstaben-Aufgabe */
const LETTER_MIN = 10;

function buildPrompts(): Prompt[] {
  const prompts: Prompt[] = [];
  for (const src of PROMPT_SOURCES) {
    const answers = parseAnswers(src.answers);
    prompts.push({ id: src.id, text: src.text, pack: src.pack, answers });
    if (!src.letters) continue;
    const byLetter = new Map<string, Answer[]>();
    for (const a of answers) {
      const first = a.keys[0]![0]!;
      if (!/[a-z]/.test(first)) continue;
      byLetter.set(first, [...(byLetter.get(first) ?? []), a]);
    }
    for (const [letter, list] of byLetter) {
      if (list.length < LETTER_MIN) continue;
      prompts.push({ id: `${src.id}-${letter}`, text: `${src.text} mit „${letter.toUpperCase()}“`, pack: src.pack, letter, answers });
    }
  }
  return prompts;
}

let cache: Prompt[] | null = null;
export function allPrompts(): Prompt[] {
  return (cache ??= buildPrompts());
}

export function getPrompt(id: string): Prompt | undefined {
  return allPrompts().find((p) => p.id === id);
}

export type MatchResult =
  | { kind: 'ok'; answer: Answer; key: string; corrected: boolean }
  | { kind: 'letter'; answer: Answer }
  | { kind: 'unknown' }
  | { kind: 'empty' };

/** typische Endungen (Mehrzahl, Fälle), die man probeweise abschneidet */
const SUFFIXES = ['nen', 'en', 'er', 'e', 'n', 's'];

function startsWithLetter(a: Answer, letter: string | undefined): boolean {
  return !letter || a.keys.some((k) => k.startsWith(letter));
}

/** findet die passende Antwort zur Eingabe (exakt, ohne Endung oder mit Tippfehlern) */
export function matchAnswer(prompt: Pick<Prompt, 'answers' | 'letter'>, input: string): MatchResult {
  const key = normalizeAnswer(input);
  if (!key) return { kind: 'empty' };
  const index = new Map<string, Answer>();
  for (const a of prompt.answers) for (const k of a.keys) index.set(k, a);

  const finish = (a: Answer, matchedKey: string, corrected: boolean): MatchResult =>
    startsWithLetter(a, prompt.letter) ? { kind: 'ok', answer: a, key: matchedKey, corrected } : { kind: 'letter', answer: a };

  // 1. exakt
  const exact = index.get(key);
  if (exact) return finish(exact, key, normalizeAnswer(exact.display) !== key && !exact.keys.includes(key));

  // 2. Mehrzahl / Endungen („Tigern“, „Elefanten“, „Katzen“) – in beide Richtungen
  for (const suf of SUFFIXES) {
    if (key.length - suf.length >= 3 && key.endsWith(suf)) {
      const hit = index.get(key.slice(0, -suf.length));
      if (hit) return finish(hit, key.slice(0, -suf.length), false);
    }
    const hit = index.get(key + suf);
    if (hit && key.length >= 3) return finish(hit, key + suf, false);
  }

  // 3. unscharf: kleinster Abstand gewinnt; bei Gleichstand gleicher Anfangsbuchstabe, dann ähnliche Länge
  let best: { a: Answer; k: string; d: number; score: number } | null = null;
  for (const a of prompt.answers) {
    for (const k of a.keys) {
      const max = Math.min(allowedTypos(key.length), allowedTypos(k.length + 1));
      if (max === 0) continue;
      const d = editDistance(key, k, max);
      if (d > max) continue;
      const score = d * 10 + (k[0] === key[0] ? 0 : 3) + Math.abs(k.length - key.length) + (startsWithLetter(a, prompt.letter) ? 0 : 1);
      if (!best || score < best.score) best = { a, k, d, score };
    }
  }
  if (best) return finish(best.a, best.k, true);
  return { kind: 'unknown' };
}
