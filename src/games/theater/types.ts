/** Datenmodell für Theaterskripte und die Textprobe. */

export type SegmentKind = 'speech' | 'direction';
export interface Segment {
  k: SegmentKind;
  t: string;
}

export type LineKind = 'dialog' | 'direction' | 'cast';

export interface ScriptLine {
  /** Seite im regulären Skript (aus den Seitenumbrüchen von Word) */
  page: number;
  scene: number;
  kind: LineKind;
  /** kanonischer Rollenname (nur bei Dialog) */
  character?: string;
  segments: Segment[];
}

export interface ScriptScene {
  number: number;
  title: string;
  /** Index der ersten Zeile */
  start: number;
  page: number;
}

export interface Script {
  id: string;
  title: string;
  createdAt: number;
  pageCount: number;
  characters: string[];
  scenes: ScriptScene[];
  lines: ScriptLine[];
}

export type ScriptSummary = Pick<Script, 'id' | 'title' | 'createdAt' | 'pageCount' | 'characters'> & { sceneCount: number; lineCount: number };

export type HideMode = 'none' | 'prev' | 'next' | 'both';

export interface TheaterPublicState {
  scriptId: string;
  title: string;
  index: number;
  hide: HideMode;
  skipDirections: boolean;
  focus: string[];
  /** wer zuletzt geblättert hat (Name) */
  lastBy: string | null;
}

export const TH_EVENTS = { script: 'script' } as const;

export const LIMITS = {
  maxLines: 6000,
  maxSegments: 40,
  maxSegmentLength: 2000,
  maxCharacters: 200,
  maxScenes: 300,
  maxTitle: 120,
} as const;
