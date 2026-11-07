import type { HideMode, Script, ScriptLine } from '../types';

/** sichtbare Zeilen (ggf. ohne Regieanweisungen) – die aktuelle Zeile ist immer dabei */
export function visibleIndices(script: Script, current: number, skipDirections: boolean): number[] {
  const out: number[] = [];
  script.lines.forEach((l, i) => {
    if (!skipDirections || l.kind === 'dialog' || i === current) out.push(i);
  });
  return out;
}

/** Fenster um die aktuelle Zeile + welche Nachbarzeilen ausgeblendet sind */
export function windowAround(script: Script, current: number, skipDirections: boolean, before: number, after: number, hide: HideMode) {
  const vis = visibleIndices(script, current, skipDirections);
  const pos = Math.max(0, vis.indexOf(current));
  const indices = vis.slice(Math.max(0, pos - before), pos + after + 1);
  const prev = vis[pos - 1];
  const next = vis[pos + 1];
  const hidden = new Set<number>();
  if ((hide === 'prev' || hide === 'both') && prev !== undefined) hidden.add(prev);
  if ((hide === 'next' || hide === 'both') && next !== undefined) hidden.add(next);
  return { indices, hidden, prev, next };
}

export function sceneOf(script: Script, index: number) {
  const line = script.lines[index];
  return script.scenes.find((s) => s.number === line?.scene) ?? script.scenes[0];
}

export function lineText(line: ScriptLine, withDirections = true): string {
  return line.segments
    .filter((s) => withDirections || s.k === 'speech')
    .map((s) => s.t)
    .join(' ');
}

export function speaks(line: ScriptLine, focus: string[]): boolean {
  if (!line.character || focus.length === 0) return false;
  if (line.character === 'Alle') return true;
  return line.character.split(', ').some((c) => focus.includes(c));
}

export const HIDE_LABEL: Record<HideMode, string> = {
  none: 'Alles sichtbar',
  prev: 'Zeile davor ausgeblendet',
  next: 'Zeile danach ausgeblendet',
  both: 'Davor & danach ausgeblendet',
};
