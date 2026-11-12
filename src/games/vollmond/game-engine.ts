/**
 * „Vollmond“ – Server-Engine (Werwolf-Gruppenspiel).
 *
 * Ablauf: Rollen ansehen → Nacht (Werwölfe, Seherin, Leibwächter handeln; alle anderen tippen
 * eine Scheinauswahl, damit niemand an Bewegungen erkennt, wer eine Rolle hat) → Hexe →
 * Morgen (Tote) → ggf. Jäger → Diskussion → Abstimmung → Urteil → ggf. Jäger → nächste Nacht.
 * Geheimes bleibt im privaten Zustand; der öffentliche verrät nur, wer fertig ist.
 */
import type { GameContext, GameEngine, GamePlayer, ServerGameModule, TimerHandle } from '../../server/game-engine/types';
import type { PlayerId } from '../../shared/types/room';
import {
  autoWolves,
  DEFAULT_VOLLMOND_SETTINGS,
  parseVollmondSettings,
  ROLE_INFO,
  SPECIAL_MIN_PLAYERS,
  TIMING,
  vollmondMeta,
  type Role,
  type VollmondSettings,
} from './game-config';
import type { Death, VollmondPhase, VollmondPrivateState, VollmondPublicState } from './types';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Rollen für n Personen */
export function dealRoles(n: number, settings: VollmondSettings): Role[] {
  const wolves = Math.max(1, Math.min(settings.wolves || autoWolves(n), Math.floor((n - 1) / 2)));
  const roles: Role[] = Array.from({ length: wolves }, () => 'werwolf');
  for (const s of settings.specials) if (n >= SPECIAL_MIN_PLAYERS[s] && roles.length < n) roles.push(s);
  while (roles.length < n) roles.push('dorf');
  return shuffle(roles);
}

export class VollmondEngine implements GameEngine<VollmondPublicState, VollmondPrivateState> {
  private phase: VollmondPhase = 'roles';
  private day = 1;
  private phaseEndsAt: number | null = null;
  private timer: TimerHandle | null = null;
  private order: PlayerId[] = [];
  private roles = new Map<PlayerId, Role>();
  private alive = new Set<PlayerId>();
  private done = new Set<PlayerId>();
  private picks = new Map<PlayerId, PlayerId | null>();
  private seen = new Map<PlayerId, { playerId: PlayerId; wolf: boolean; day: number }[]>();
  private victim: PlayerId | null = null;
  private protectedId: PlayerId | null = null;
  private lastProtected: PlayerId | null = null;
  private healUsed = false;
  private poisonUsed = false;
  private witchHeal = false;
  private witchPoison: PlayerId | null = null;
  private news: Death[] = [];
  private graveyard: Death[] = [];
  private votes = new Map<PlayerId, PlayerId | null>();
  private ready = new Set<PlayerId>();
  private hunterId: PlayerId | null = null;
  private afterHunter: (() => void) | null = null;
  /** Jäger, die schon geschossen haben (bzw. dran waren) */
  private shotBy = new Set<PlayerId>();
  private narration = { id: 0, text: '' };
  private winner: 'wolf' | 'dorf' | null = null;
  private finished = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly settings: VollmondSettings,
  ) {}

  start(): void {
    this.order = this.ctx.getPlayers().filter((p) => p.isConnected).map((p) => p.id);
    const roles = dealRoles(this.order.length, this.settings);
    this.order.forEach((id, i) => {
      this.roles.set(id, roles[i]!);
      this.alive.add(id);
    });
    this.say('Willkommen in Mondtal. Schaut euch heimlich eure Rolle auf dem Handy an – und verratet sie niemandem!');
    this.setPhase('roles', TIMING.rolesMs, () => this.startNight());
  }

  dispose(): void {
    this.timer?.cancel();
  }

  // ------------------------------------------------------------------ Hilfen

  private say(text: string) {
    this.narration = { id: this.narration.id + 1, text };
  }

  private name(id: PlayerId | null) {
    return (id && this.ctx.getPlayer(id)?.name) || 'Jemand';
  }

  private setPhase(phase: VollmondPhase, ms: number | null, next?: () => void) {
    this.timer?.cancel();
    this.timer = null;
    this.phase = phase;
    this.done.clear();
    this.phaseEndsAt = ms ? this.ctx.now() + ms : null;
    if (ms && next) this.timer = this.ctx.setTimer(ms, next);
    this.ctx.publishState();
  }

  private isAlive(id: PlayerId) {
    return this.alive.has(id);
  }

  private connected(id: PlayerId) {
    return !!this.ctx.getPlayer(id)?.isConnected;
  }

  private aliveWith(role: Role): PlayerId[] {
    return [...this.alive].filter((id) => this.roles.get(id) === role);
  }

  /** wer in der aktuellen Phase etwas tun muss */
  private taskOf(id: PlayerId): VollmondPrivateState['task'] {
    const role = this.roles.get(id);
    const alive = this.isAlive(id);
    switch (this.phase) {
      case 'night':
        if (!alive) return 'none';
        if (role === 'werwolf') return 'wolf';
        if (role === 'seherin') return 'seer';
        if (role === 'leibwaechter') return 'guard';
        return 'dummy';
      case 'witch':
        return alive && role === 'hexe' ? 'witch' : 'none';
      case 'hunter':
        return id === this.hunterId ? 'hunter' : 'none';
      case 'vote':
        return alive ? 'vote' : 'none';
      default:
        return 'none';
    }
  }

  /** alle, die etwas tun müssen und verbunden sind, sind fertig */
  private allDone(): boolean {
    return this.order.filter((id) => this.taskOf(id) !== 'none' && this.connected(id)).every((id) => this.done.has(id));
  }

  // ------------------------------------------------------------------ Zustand

  getPublicState(): VollmondPublicState {
    const end = this.phase === 'end';
    return {
      phase: this.phase,
      day: this.day,
      phaseEndsAt: this.phaseEndsAt,
      order: this.order,
      alive: [...this.alive],
      roleCount: [...this.roles.values()].reduce<Partial<Record<Role, number>>>((acc, r) => ({ ...acc, [r]: (acc[r] ?? 0) + 1 }), {}),
      done: [...this.done],
      news: this.news,
      graveyard: this.graveyard,
      votes: this.phase === 'vote' || this.phase === 'verdict' ? Object.fromEntries(this.votes) : {},
      ready: [...this.ready],
      hunterId: this.hunterId,
      narration: this.narration,
      winner: this.winner,
      roles: end ? Object.fromEntries(this.roles) : null,
    };
  }

  getPrivateState(playerId: PlayerId): VollmondPrivateState | null {
    const role = this.roles.get(playerId);
    if (!role) return null;
    const isWolf = role === 'werwolf';
    const wolfPicks: Record<PlayerId, PlayerId | null> = {};
    if (isWolf && this.phase === 'night') for (const w of this.aliveWith('werwolf')) wolfPicks[w] = this.picks.get(w) ?? null;
    return {
      role,
      alive: this.isAlive(playerId),
      wolves: isWolf ? this.order.filter((id) => this.roles.get(id) === 'werwolf' && id !== playerId) : [],
      pick: this.phase === 'vote' ? (this.votes.has(playerId) ? (this.votes.get(playerId) ?? null) : null) : (this.picks.get(playerId) ?? null),
      wolfPicks,
      seen: role === 'seherin' ? (this.seen.get(playerId) ?? []) : [],
      witch:
        role === 'hexe'
          ? {
              victim: this.phase === 'witch' ? this.victim : null,
              heal: !this.healUsed,
              poison: !this.poisonUsed,
              usedHeal: this.witchHeal,
              poisonTarget: this.witchPoison,
            }
          : null,
      lastProtected: role === 'leibwaechter' ? this.lastProtected : null,
      task: this.taskOf(playerId),
    };
  }

  // ------------------------------------------------------------------ Aktionen

  handleAction(playerId: PlayerId, type: string, payload: unknown): void {
    if (this.finished || !this.roles.has(playerId)) return;
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    const target = typeof data.target === 'string' && this.roles.has(data.target) ? data.target : null;
    const task = this.taskOf(playerId);

    if (type === 'seen' && this.phase === 'roles') {
      this.done.add(playerId);
      if (this.order.filter((id) => this.connected(id)).every((id) => this.done.has(id))) this.startNight();
      else this.ctx.publishState();
      return;
    }

    if (type === 'pick' && this.phase === 'night') {
      if (target && !this.isAlive(target)) return;
      if (task === 'wolf') {
        if (target && this.roles.get(target) === 'werwolf') return;
      } else if (task === 'seer') {
        if (this.done.has(playerId) || !target || target === playerId) return; // Seherin schaut nur einmal
        const list = this.seen.get(playerId) ?? [];
        list.push({ playerId: target, wolf: this.roles.get(target) === 'werwolf', day: this.day });
        this.seen.set(playerId, list);
      } else if (task === 'guard') {
        if (!target || target === this.lastProtected) return;
      } else if (task !== 'dummy') return;
      this.picks.set(playerId, target);
      this.done.add(playerId);
      if (this.allDone()) this.endNight();
      else this.ctx.publishState();
      return;
    }

    if (type === 'witch' && this.phase === 'witch' && task === 'witch') {
      if (data.heal === true && !this.healUsed && this.victim) this.witchHeal = true;
      if (target && !this.poisonUsed && this.isAlive(target) && target !== playerId) this.witchPoison = target;
      this.done.add(playerId);
      this.morning();
      return;
    }

    if (type === 'shoot' && this.phase === 'hunter' && task === 'hunter') {
      if (!target || !this.isAlive(target) || target === playerId) return;
      this.done.add(playerId);
      this.kill([{ playerId: target, cause: 'jaeger' }]);
      this.say(`Mit letzter Kraft schießt ${this.name(playerId)} – und trifft ${this.name(target)}.`);
      this.resolveHunters();
      return;
    }

    if (type === 'ready' && this.phase === 'day' && this.isAlive(playerId)) {
      if (this.ready.has(playerId)) this.ready.delete(playerId);
      else this.ready.add(playerId);
      const alive = [...this.alive].filter((id) => this.connected(id));
      if (this.ready.size >= Math.ceil(alive.length * 0.67)) this.startVote();
      else this.ctx.publishState();
      return;
    }

    if (type === 'vote' && this.phase === 'vote' && task === 'vote') {
      if (target && (!this.isAlive(target) || target === playerId)) return;
      this.votes.set(playerId, target);
      this.done.add(playerId);
      if (this.allDone()) this.verdict();
      else this.ctx.publishState();
    }
  }

  // ------------------------------------------------------------------ Nacht

  private startNight() {
    this.picks.clear();
    this.victim = null;
    this.protectedId = null;
    this.witchHeal = false;
    this.witchPoison = null;
    this.news = [];
    this.say(
      this.day === 1
        ? 'Die erste Nacht bricht herein. Das ganze Dorf schläft ein … Alle schauen jetzt nur noch auf ihr eigenes Handy und tippen etwas an – auch wer nichts zu tun hat.'
        : `Nacht ${this.day}. Das Dorf schläft ein … Die Werwölfe erwachen und suchen ihr nächstes Opfer.`,
    );
    this.setPhase('night', TIMING.nightMs, () => this.endNight());
  }

  private endNight() {
    if (this.phase !== 'night') return;
    // Opfer: meiste Stimmen der Werwölfe, bei Gleichstand Zufall
    const counts = new Map<PlayerId, number>();
    for (const w of this.aliveWith('werwolf')) {
      const t = this.picks.get(w);
      if (t && this.isAlive(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const max = Math.max(0, ...counts.values());
    const top = [...counts].filter(([, n]) => n === max && n > 0).map(([id]) => id);
    this.victim = top.length ? top[Math.floor(Math.random() * top.length)]! : null;
    const guard = this.aliveWith('leibwaechter')[0];
    this.protectedId = guard ? (this.picks.get(guard) ?? null) : null;
    this.lastProtected = this.protectedId;
    const witch = this.aliveWith('hexe')[0];
    if (witch && (!this.healUsed || !this.poisonUsed) && this.connected(witch)) {
      this.say('Die Hexe erwacht und erfährt, wen die Werwölfe gewählt haben …');
      this.setPhase('witch', TIMING.witchMs, () => this.morning());
    } else this.morning();
  }

  private morning() {
    if (this.phase !== 'night' && this.phase !== 'witch') return;
    if (this.witchHeal) this.healUsed = true;
    if (this.witchPoison) this.poisonUsed = true;
    const deaths: Omit<Death, 'role'>[] = [];
    const saved = this.witchHeal || (this.victim !== null && this.victim === this.protectedId);
    if (this.victim && !saved) deaths.push({ playerId: this.victim, cause: 'wolf' });
    if (this.witchPoison && !deaths.some((d) => d.playerId === this.witchPoison)) deaths.push({ playerId: this.witchPoison, cause: 'gift' });
    this.news = [];
    this.kill(deaths);
    this.say(
      deaths.length === 0
        ? 'Der Morgen graut. Wie durch ein Wunder ist in dieser Nacht niemand gestorben!'
        : `Der Morgen graut. Das Dorf trauert um ${deaths.map((d) => this.name(d.playerId)).join(' und ')}.`,
    );
    this.afterHunter = () => this.checkWin() || this.startDay();
    this.setPhase('morning', TIMING.morningMs, () => this.resolveHunters());
  }

  private kill(deaths: Omit<Death, 'role'>[]) {
    for (const d of deaths) {
      if (!this.isAlive(d.playerId)) continue;
      this.alive.delete(d.playerId);
      const death: Death = { ...d, role: this.settings.revealDead ? (this.roles.get(d.playerId) ?? null) : null };
      this.news.push(death);
      this.graveyard.push(death);
    }
  }

  /** gestorbene Jäger schießen, danach geht es weiter */
  private resolveHunters() {
    const pendingHunter = this.news.map((d) => d.playerId).find((id) => this.roles.get(id) === 'jaeger' && !this.shotBy.has(id));
    if (pendingHunter && this.alive.size > 0 && this.connected(pendingHunter)) {
      this.shotBy.add(pendingHunter);
      this.hunterId = pendingHunter;
      this.say(`${this.name(pendingHunter)} war der Jäger! Mit dem letzten Atemzug darf ${this.name(pendingHunter)} eine Person mitnehmen.`);
      this.setPhase('hunter', TIMING.hunterMs, () => {
        this.hunterId = null;
        this.resolveHunters();
      });
      return;
    }
    this.hunterId = null;
    const next = this.afterHunter;
    this.afterHunter = null;
    next?.();
  }

  // ------------------------------------------------------------------ Tag

  private startDay() {
    this.ready.clear();
    this.votes.clear();
    this.say('Diskutiert! Wer benimmt sich verdächtig? Wer lügt? Tippt „Bereit zur Abstimmung“, wenn ihr genug geredet habt.');
    this.setPhase('day', this.settings.talkSeconds * 1000, () => this.startVote());
  }

  private startVote() {
    if (this.phase !== 'day') return;
    this.votes.clear();
    this.say('Zeit zu entscheiden! Wer soll aus dem Dorf verbannt werden? Stimmt auf dem Handy ab.');
    this.setPhase('vote', TIMING.voteMs, () => this.verdict());
  }

  private verdict() {
    if (this.phase !== 'vote') return;
    const counts = new Map<string, number>();
    for (const [voter, t] of this.votes) if (this.isAlive(voter)) counts.set(t ?? '-', (counts.get(t ?? '-') ?? 0) + 1);
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);
    const [top, second] = sorted;
    const out = top && top[0] !== '-' && (!second || second[1] < top[1]) ? top[0] : null;
    this.news = [];
    if (out) {
      this.kill([{ playerId: out, cause: 'dorf' }]);
      const role = this.roles.get(out)!;
      this.say(
        `Das Dorf hat entschieden: ${this.name(out)} wird verbannt.` +
          (this.settings.revealDead ? ` ${this.name(out)} war ${role === 'werwolf' ? 'ein Werwolf!' : `${ROLE_INFO[role].name} – unschuldig!`}` : ''),
      );
    } else this.say('Keine Mehrheit – heute wird niemand verbannt.');
    this.afterHunter = () => {
      if (this.checkWin()) return;
      this.day++;
      this.startNight();
    };
    this.setPhase('verdict', TIMING.verdictMs, () => this.resolveHunters());
  }

  // ------------------------------------------------------------------ Ende

  /** true, wenn das Spiel vorbei ist */
  private checkWin(): boolean {
    const wolves = this.aliveWith('werwolf').length;
    const others = this.alive.size - wolves;
    if (wolves > 0 && wolves < others) return false;
    this.winner = wolves === 0 ? 'dorf' : 'wolf';
    this.say(this.winner === 'dorf' ? 'Alle Werwölfe sind besiegt – das Dorf hat gewonnen!' : 'Die Werwölfe haben das Dorf überrannt – die Werwölfe gewinnen!');
    this.setPhase('end', 15_000, () => this.finish());
    return true;
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.timer?.cancel();
    const scores: Record<PlayerId, number> = {};
    for (const p of this.ctx.getPlayers()) {
      const role = this.roles.get(p.id);
      if (!role) {
        scores[p.id] = 0;
        continue;
      }
      const won = ROLE_INFO[role].team === this.winner;
      scores[p.id] = (won ? 3 : 0) + (this.isAlive(p.id) ? 1 : 0);
    }
    this.ctx.endGame({ scores, summary: `${this.winner === 'dorf' ? 'Das Dorf' : 'Die Werwölfe'} gewinnt nach ${this.day} ${this.day === 1 ? 'Tag' : 'Tagen'} · Sieg 3 Punkte, überlebt +1` });
  }

  // ------------------------------------------------------------------ Spieler

  onPlayerJoined(): void {
    this.ctx.publishState();
  }

  onPlayerLeft(p: GamePlayer): void {
    if (!this.roles.has(p.id)) return;
    const wasAlive = this.isAlive(p.id);
    this.alive.delete(p.id);
    this.ready.delete(p.id);
    if (wasAlive && this.phase !== 'end' && this.checkWin()) return;
    this.progress();
  }

  onPlayerDisconnected(): void {
    this.progress();
  }

  onPlayerReconnected(): void {
    this.ctx.publishState();
  }

  /** prüfen, ob die aktuelle Phase wegen fehlender Personen weitergehen kann */
  private progress() {
    if (this.phase === 'night' && this.allDone()) return this.endNight();
    if (this.phase === 'vote' && this.allDone()) return this.verdict();
    if (this.phase === 'witch' && this.allDone()) return this.morning();
    if (this.phase === 'hunter' && this.hunterId && !this.connected(this.hunterId)) {
      this.hunterId = null;
      return this.resolveHunters();
    }
    this.ctx.publishState();
  }
}

export const vollmondServerModule: ServerGameModule<VollmondSettings> = {
  meta: vollmondMeta,
  defaultSettings: DEFAULT_VOLLMOND_SETTINGS,
  parseSettings: parseVollmondSettings,
  canStart(players) {
    if (players.filter((p) => p.isConnected).length < 4) return '„Vollmond“ braucht mindestens 4 Spieler (am besten 6 oder mehr).';
    return null;
  },
  createEngine(ctx, settings) {
    return new VollmondEngine(ctx, settings);
  },
};
