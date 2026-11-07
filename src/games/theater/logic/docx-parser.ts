/**
 * Liest ein Theaterskript aus einer Word-Datei (.docx).
 *
 * Erkannt wird das übliche Format:
 *   „Szene 3: Titel“          → neue Szene
 *   „Figuren: …“              → Besetzung der Szene
 *   „(kursiv in Klammern)“    → Regieanweisung
 *   „Name: Text (Anweisung)“  → Dialogzeile, eingebettete Anweisungen werden getrennt
 * Seitenzahlen stammen aus den von Word gespeicherten Seitenumbrüchen.
 * Tippfehler in Rollennamen („Aplh“ → „Alph“) werden automatisch zusammengeführt.
 */
import { unzipSync, strFromU8 } from 'fflate';
import type { Script, ScriptLine, ScriptScene, Segment } from '../types';

interface Run {
  text: string;
  bold: boolean;
  italic: boolean;
}

interface Para {
  page: number;
  runs: Run[];
  text: string;
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');

function flag(rPr: string, tag: 'b' | 'i'): boolean {
  const m = rPr.match(new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`));
  return !!m && m[1] !== '0' && m[1] !== 'false';
}

/** Absätze mit formatierten Läufen aus document.xml lesen */
export function readParagraphs(xml: string): Para[] {
  const body = xml.slice(xml.indexOf('<w:body'));
  const paras: Para[] = [];
  let page = 1;
  const pRe = /<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g;
  for (const pm of body.match(pRe) ?? []) {
    const runs: Run[] = [];
    const rRe = /<w:r[ >][\s\S]*?<\/w:r>/g;
    for (const rm of pm.match(rRe) ?? []) {
      const rPr = rm.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? '';
      const bold = flag(rPr, 'b');
      const italic = flag(rPr, 'i');
      const content = rm.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '');
      const tokRe = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:t\/>|<w:tab\/>|<w:br(?:\s[^>]*)?\/>|<w:lastRenderedPageBreak\/>/g;
      let m: RegExpExecArray | null;
      while ((m = tokRe.exec(content))) {
        const tok = m[0];
        if (tok.startsWith('<w:lastRenderedPageBreak') || (tok.startsWith('<w:br') && /w:type="page"/.test(tok))) {
          page++;
        } else if (tok.startsWith('<w:tab') || tok.startsWith('<w:br')) {
          runs.push({ text: ' ', bold, italic });
        } else if (m[1] !== undefined) {
          runs.push({ text: decode(m[1]), bold, italic });
        }
      }
    }
    const text = runs.map((r) => r.text).join('').replace(/\s+/g, ' ').trim();
    paras.push({ page, runs, text });
  }
  return paras;
}

// ------------------------------------------------------------------ Rollennamen

/** Editierdistanz mit Buchstabendrehern (Optimal String Alignment) */
export function lev(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
    }
  }
  return d[a.length]![b.length]!;
}

const nameKey = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
const words = (s: string) => s.toLowerCase().split(/[^a-zäöüß0-9]+/).filter(Boolean);

/** Namen aus einer Zeile „Figuren: 3 Elfen (Schnipsel, Alph und Knirps), Hauptgruppe (…) Wiehnachtsma.“ */
export function castNames(line: string): string[] {
  const body = line.replace(/^Figuren\s*:/i, '');
  return body
    .replace(/([^,()]+?)[:]?\s*\(/g, ',') // Gruppenbezeichnung vor „(“ entfernen
    .replace(/\)/g, ',')
    .split(/,|\bund\b|&/)
    .map((n) => n.replace(/[.:;]+$/, '').replace(/\s+/g, ' ').trim())
    .filter((n) => n && !/\d/.test(n) && n.split(' ').length <= 3);
}

/** zulässige Abweichung je nach Namenslänge (kurze Namen müssen exakt passen: Zip ≠ Zap) */
function tolerance(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  return len >= 10 ? 3 : len >= 8 ? 2 : len >= 4 ? 1 : 0;
}

/**
 * Ordnet jeder Sprecher-Schreibweise eine Rolle zu.
 * Grundlage sind die Figurenlisten; Tippfehler werden nur bei ausreichend langen Namen
 * und eindeutiger Zuordnung korrigiert. Mehrere Sprecher („Rico, Spidy“) bleiben als Gruppe.
 */
export function canonicalizeNames(speakerCounts: Map<string, number>, cast: string[]): Map<string, string> {
  // 1. Figurenliste vereinheitlichen (Wall-e = Wall-E, Wiehnachtsma ≈ Weihnachtsmann)
  const roles: { name: string; keys: string[]; count: number }[] = [];
  const countOf = (n: string) => speakerCounts.get(n) ?? 0;
  const similar = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 10 && lev(a, b) <= tolerance(a, b));
  for (const n of cast) {
    const key = nameKey(n);
    const same = roles.find((r) => r.keys.some((k) => similar(k, key)));
    if (same) {
      if (!same.keys.includes(key)) same.keys.push(key);
      if (countOf(n) > same.count) Object.assign(same, { name: n, count: countOf(n) });
    } else roles.push({ name: n, keys: [key], count: countOf(n) });
  }

  const resolvePart = (part: string): string => {
    const key = nameKey(part);
    const exact = roles.find((r) => r.keys.includes(key));
    if (exact) return exact.name;
    // Kurzform: „Karl“ → „K.O. Karl“ (ganzes Wort, mind. 4 Buchstaben)
    if (key.length >= 4) {
      const byWord = roles.filter((r) => words(r.name).includes(key));
      if (byWord.length === 1) return byWord[0]!.name;
    }
    // Tippfehler: gleicher Anfangsbuchstabe, kleine Abweichung, eindeutig
    const near = roles.filter((r) => r.keys.some((k) => k[0] === key[0] && lev(k, key) <= tolerance(k, key)));
    if (near.length === 1) return near[0]!.name;
    return part;
  };

  // häufigste Schreibweise unbekannter Namen bevorzugen
  const sorted = [...speakerCounts].sort((a, b) => b[1] - a[1]);
  const unknown = new Map<string, string>(); // key → Anzeigename
  const map = new Map<string, string>();
  for (const [raw] of sorted) {
    const parts = raw.split(/\s*(?:,|&|\bund\b)\s*/).filter(Boolean);
    const resolved = parts.map((part) => {
      const r = resolvePart(part);
      if (r !== part) return r;
      const k = nameKey(part);
      if (!unknown.has(k)) unknown.set(k, part);
      return unknown.get(k)!;
    });
    map.set(raw, [...new Set(resolved)].join(', '));
  }
  return map;
}

// ------------------------------------------------------------------ Struktur

const SCENE_RE = /^Szene\s+(\d+)\s*:?\s*(.*)$/i;
const SPEAKER_RE = /^([A-ZÄÖÜ][^:()]{0,28}?)\s*:\s*(.*)$/;

/** Text in gesprochene Teile und (Klammer-)Anweisungen aufteilen */
export function splitSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let depth = 0;
  let buf = '';
  const flush = (k: Segment['k']) => {
    const t = buf.replace(/\s+/g, ' ').trim();
    if (t) out.push({ k, t });
    buf = '';
  };
  for (const ch of text) {
    if (ch === '(') {
      if (depth === 0) flush('speech');
      depth++;
      buf += ch;
    } else if (ch === ')' && depth > 0) {
      buf += ch;
      depth--;
      if (depth === 0) flush('direction');
    } else buf += ch;
  }
  flush(depth > 0 ? 'direction' : 'speech');
  return out;
}

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
}

export interface ParseResult extends Omit<Script, 'id' | 'createdAt'> {
  /** Schreibweisen, die zusammengeführt wurden: Variante → Rolle */
  merged: Record<string, string>;
}

export function parseScriptXml(xml: string, title: string): ParseResult {
  const paras = readParagraphs(xml).filter((p) => p.text);

  // 1. Durchgang: Sprecher sammeln (fett gesetzte Namen gelten sicher)
  const counts = new Map<string, number>();
  const boldNames = new Set<string>();
  for (const p of paras) {
    const m = p.text.match(SPEAKER_RE);
    if (!m || SCENE_RE.test(p.text) || /^Figuren/i.test(p.text)) continue;
    const name = cleanName(m[1]!);
    if (name.split(' ').length > 3) continue;
    const firstBold = p.runs.find((r) => r.text.trim())?.bold ?? false;
    if (firstBold) boldNames.add(name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const cast = paras.filter((p) => /^Figuren\s*:/i.test(p.text)).flatMap((p) => castNames(p.text));
  const canon = canonicalizeNames(counts, cast);
  const castKeys = new Set(cast.map(nameKey));
  // gültige Sprecher: einmal fett gesetzt oder aus der Figurenliste
  const validCanon = new Set([...counts.keys()].filter((n) => boldNames.has(n) || castKeys.has(nameKey(n)) || canon.get(n) !== n).map((n) => canon.get(n)!));

  // 2. Durchgang: Zeilen bauen
  const lines: ScriptLine[] = [];
  const scenes: ScriptScene[] = [];
  let scene = 0;
  for (const p of paras) {
    const sm = p.text.match(SCENE_RE);
    if (sm) {
      scene = Number(sm[1]);
      scenes.push({ number: scene, title: sm[2]!.replace(/[.\s]+$/, '').trim(), start: lines.length, page: p.page });
      continue;
    }
    if (scene === 0) {
      // Text vor der ersten Szene → Szene 0 „Vorspann“
      scenes.push({ number: 0, title: 'Vorspann', start: 0, page: p.page });
      scene = -1;
    }
    const sceneNo = Math.max(scene, 0);
    if (/^Figuren\s*:/i.test(p.text)) {
      lines.push({ page: p.page, scene: sceneNo, kind: 'cast', segments: [{ k: 'direction', t: p.text }] });
      continue;
    }
    const m = p.text.match(SPEAKER_RE);
    const name = m ? cleanName(m[1]!) : '';
    const character = m && name.split(' ').length <= 3 ? canon.get(name) : undefined;
    if (m && character && validCanon.has(character)) {
      const segments = splitSegments(m[2]!);
      lines.push({ page: p.page, scene: sceneNo, kind: 'dialog', character, segments: segments.length ? segments : [{ k: 'speech', t: '' }] });
      continue;
    }
    const allItalic = p.runs.filter((r) => r.text.trim()).every((r) => r.italic);
    if (allItalic || p.text.startsWith('(')) {
      lines.push({ page: p.page, scene: sceneNo, kind: 'direction', segments: [{ k: 'direction', t: p.text }] });
      continue;
    }
    // Fortsetzung der vorherigen Rede (z. B. Liedstrophe)
    const prev = [...lines].reverse().find((l) => l.kind === 'dialog');
    if (prev) lines.push({ page: p.page, scene: sceneNo, kind: 'dialog', character: prev.character, segments: splitSegments(p.text) });
    else lines.push({ page: p.page, scene: sceneNo, kind: 'direction', segments: [{ k: 'direction', t: p.text }] });
  }

  // Szenen ohne Zeilen entfernen, Seitenzahl der Szene = Seite der ersten Zeile
  const usedScenes = scenes.filter((s) => s.number >= 0 && lines.some((l) => l.scene === s.number));
  for (const s of usedScenes) {
    s.start = lines.findIndex((l) => l.scene === s.number);
    s.page = lines[s.start]!.page;
  }
  // Rollenliste: Einzelrollen (Gruppenzeilen wie „Rico, Spidy“ zählen für jede Rolle)
  const appearances = new Map<string, number>();
  for (const l of lines) for (const c of l.character?.split(', ') ?? []) appearances.set(c, (appearances.get(c) ?? 0) + 1);
  const merged: Record<string, string> = {};
  for (const [raw, c] of canon) if (raw !== c && validCanon.has(c)) merged[raw] = c;
  return {
    title,
    pageCount: Math.max(1, ...lines.map((l) => l.page)),
    characters: [...appearances].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    scenes: usedScenes,
    lines,
    merged,
  };
}

/** .docx-Datei (Bytes) → Skript */
export function parseDocx(bytes: Uint8Array, fileName: string): ParseResult {
  const files = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  const doc = files['word/document.xml'];
  if (!doc) throw new Error('Das ist keine gültige Word-Datei (.docx).');
  const title = fileName.replace(/\.docx$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Skript';
  return parseScriptXml(strFromU8(doc), title);
}
