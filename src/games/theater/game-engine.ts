/**
 * Textprobe – Server-Engine. Kein Wettbewerb: alle verbundenen Handys können blättern.
 * Das Skript wird einmal pro Gerät als Ereignis verschickt, der Zustand ist klein.
 */
import type { GameContext, GameEngine, ServerGameModule, Viewer } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import { DEFAULT_THEATER_SETTINGS, parseTheaterSettings, theaterMeta, type TheaterSettings } from './game-config';
import { TH_EVENTS, type HideMode, type Script, type TheaterPublicState } from './types';

const HIDE_MODES: HideMode[] = ['none', 'prev', 'next', 'both'];

/** nächste anzuzeigende Zeile in Richtung `dir` (Regieanweisungen ggf. überspringen) */
export function stepIndex(script: Script, from: number, dir: 1 | -1, skipDirections: boolean): number {
  let i = from;
  for (;;) {
    const next = i + dir;
    if (next < 0 || next >= script.lines.length) return i;
    i = next;
    if (!skipDirections || script.lines[i]!.kind === 'dialog') return i;
  }
}

export class TheaterEngine implements GameEngine<TheaterPublicState, null> {
  private index = 0;
  private hide: HideMode = 'none';
  private skipDirections = false;
  private focus: string[] = [];
  private lastBy: string | null = null;

  constructor(
    private readonly ctx: GameContext,
    private readonly script: Script,
  ) {}

  start(): void {
    this.index = this.script.scenes[0]?.start ?? 0;
    this.ctx.emit(TH_EVENTS.script, this.script);
    this.ctx.publishState();
  }

  dispose(): void {}

  getPublicState(): TheaterPublicState {
    return {
      scriptId: this.script.id,
      title: this.script.title,
      index: this.index,
      hide: this.hide,
      skipDirections: this.skipDirections,
      focus: this.focus,
      lastBy: this.lastBy,
    };
  }

  getPrivateState(): null {
    return null;
  }

  onViewerSync(viewer: Viewer): void {
    this.ctx.emit(TH_EVENTS.script, this.script, viewer.kind === 'host' ? { to: 'host' } : { to: 'player', playerId: viewer.playerId });
  }

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const lines = this.script.lines;
    const before = this.index;
    switch (type) {
      case 'move': {
        const dir = data.delta === -1 ? -1 : data.delta === 1 ? 1 : 0;
        if (dir) this.index = stepIndex(this.script, this.index, dir, this.skipDirections);
        break;
      }
      case 'goto': {
        const i = data.index;
        if (typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < lines.length) this.index = i;
        break;
      }
      case 'scene': {
        const s = this.script.scenes.find((x) => x.number === data.number);
        if (s) this.index = this.firstShown(s.start);
        break;
      }
      case 'page': {
        const page = data.page;
        if (typeof page !== 'number') return;
        const i = lines.findIndex((l) => l.page >= page);
        if (i >= 0) this.index = this.firstShown(i);
        break;
      }
      case 'hide': {
        if (HIDE_MODES.includes(data.mode as HideMode)) this.hide = data.mode as HideMode;
        break;
      }
      case 'skipDirections': {
        this.skipDirections = Boolean(data.on);
        if (this.skipDirections) this.index = this.firstShown(this.index);
        break;
      }
      case 'focus': {
        const list = Array.isArray(data.characters) ? data.characters.filter((c): c is string => typeof c === 'string' && this.script.characters.includes(c)) : [];
        this.focus = list.slice(0, 20);
        break;
      }
      default:
        return;
    }
    if (this.index !== before) this.lastBy = this.ctx.getPlayer(playerId)?.name ?? null;
    this.ctx.publishState();
  }

  /** bei aktivem Überspringen: nächste Dialogzeile ab `i` */
  private firstShown(i: number): number {
    if (!this.skipDirections || this.script.lines[i]?.kind === 'dialog') return i;
    const next = stepIndex(this.script, i, 1, true);
    return next === i ? i : next;
  }
}

export const theaterServerModule: ServerGameModule<TheaterSettings> = {
  meta: theaterMeta,
  defaultSettings: DEFAULT_THEATER_SETTINGS,
  parseSettings: parseTheaterSettings,
  canStart(players, settings, services) {
    if (!players.some((p) => p.isConnected)) return 'Mindestens ein Handy muss verbunden sein, um zu blättern.';
    if (!settings.scriptId) return 'Bitte zuerst in den Einstellungen ein Skript hochladen oder auswählen.';
    if (!services.scripts.get(settings.scriptId)) return 'Das gewählte Skript existiert nicht mehr.';
    return null;
  },
  createEngine(ctx, settings) {
    const script = ctx.services.scripts.get(settings.scriptId);
    if (!script) throw new Error('Skript nicht gefunden');
    return new TheaterEngine(ctx, script);
  },
};
