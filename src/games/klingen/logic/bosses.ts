/**
 * Die 15 Bosse von Klingenrad: jeder mit eigener Mechanik.
 * Aussehen und Animationen stehen in components/bosses-draw.ts.
 */

export const BOSS_IDS = [
  'kaese',
  'pizza',
  'uhr',
  'igel',
  'kroete',
  'saturn',
  'geist',
  'kuerbis',
  'sonne',
  'bombe',
  'krake',
  'magnet',
  'mond',
  'donut',
  'drache',
] as const;
export type BossId = (typeof BOSS_IDS)[number];

export type SpinKind = 'wave' | 'stopgo' | 'tick' | 'jitter' | 'pulse';

export interface BossDef {
  id: BossId;
  name: string;
  emoji: string;
  /** kurzer Hinweis auf die Mechanik */
  hint: string;
  knives: number;
  obstacles: number;
  spin: SpinKind;
  /** Grundgeschwindigkeit (rad/s) */
  speed: number;
  /** wave: Stärke der Schwankung relativ zur Grundgeschwindigkeit (>1 = Richtungswechsel) */
  wave?: number;
  /** jedes steckende Messer macht das Rad um diesen Anteil schneller */
  speedUp?: number;
  /** Schutzschilde am Rand (prallen ab) */
  shields?: { count: number; half: number; speed: number };
  /** Monde kreisen durch die Wurfbahn */
  moons?: { count: number; speed: number };
  /** ein Fangarm blockiert regelmäßig den Wurf */
  tentacle?: { period: number; from: number; to: number };
  /** Messer pendeln im Rad hin und her */
  wobble?: number;
  /** Rad wird zeitweise unsichtbar */
  ghost?: boolean;
  /** nur der untere Teil ist beleuchtet */
  dark?: boolean;
  /** Zeitlimit pro Versuch in Sekunden */
  timeLimit?: number;
}

export const BOSSES: Record<BossId, BossDef> = {
  kaese: { id: 'kaese', name: 'Emmentaler Emil', emoji: '🧀', hint: 'Dreht ständig die Richtung!', knives: 8, obstacles: 1, spin: 'wave', speed: 1.8, wave: 1.7 },
  pizza: { id: 'pizza', name: 'Pizza Diavolo', emoji: '🍕', hint: 'Steht still – und schießt dann los!', knives: 9, obstacles: 2, spin: 'stopgo', speed: 2.1 },
  uhr: { id: 'uhr', name: 'Kuckucksuhr Kuno', emoji: '🕰️', hint: 'Springt im Takt – wirf zwischen den Ticks!', knives: 10, obstacles: 2, spin: 'tick', speed: 1 },
  igel: { id: 'igel', name: 'Stachelhans', emoji: '🦔', hint: 'Voller Stacheln – finde die Lücken!', knives: 6, obstacles: 9, spin: 'wave', speed: 1.1, wave: 0.4 },
  kroete: { id: 'kroete', name: 'Panzerkröte Petra', emoji: '🐢', hint: 'Steinschilde drehen gegenläufig – nicht treffen!', knives: 8, obstacles: 1, spin: 'wave', speed: 1.5, wave: 0.3, shields: { count: 2, half: 0.36, speed: -1.25 } },
  saturn: { id: 'saturn', name: 'Saturnus', emoji: '🪐', hint: 'Monde kreuzen deine Wurfbahn!', knives: 8, obstacles: 2, spin: 'wave', speed: 1.4, wave: 0.5, moons: { count: 2, speed: 1.5 } },
  geist: { id: 'geist', name: 'Gespensterrad Gustav', emoji: '👻', hint: 'Wird immer wieder unsichtbar!', knives: 8, obstacles: 3, spin: 'wave', speed: 1.7, wave: 0.6, ghost: true },
  kuerbis: { id: 'kuerbis', name: 'Kürbiskopf Kalle', emoji: '🎃', hint: 'Jedes Messer macht ihn wütender – und schneller!', knives: 9, obstacles: 1, spin: 'wave', speed: 1.3, wave: 0.2, speedUp: 0.14 },
  sonne: { id: 'sonne', name: 'Solaris', emoji: '☀️', hint: 'Pulsiert – mal langsam, mal rasend!', knives: 9, obstacles: 2, spin: 'pulse', speed: 2 },
  bombe: { id: 'bombe', name: 'Tick-Tack-Bombe', emoji: '💣', hint: 'Schnell! Nach 15 Sekunden knallt’s.', knives: 8, obstacles: 2, spin: 'wave', speed: 1.9, wave: 0.7, timeLimit: 15 },
  krake: { id: 'krake', name: 'Krakenkarl', emoji: '🐙', hint: 'Wenn der Fangarm kommt – warten!', knives: 8, obstacles: 2, spin: 'wave', speed: 1.6, wave: 0.5, tentacle: { period: 3.2, from: 1.9, to: 2.9 } },
  magnet: { id: 'magnet', name: 'Magnetomat', emoji: '🧲', hint: 'Die Messer im Rad wandern hin und her!', knives: 8, obstacles: 2, spin: 'wave', speed: 1.4, wave: 0.4, wobble: 0.3 },
  mond: { id: 'mond', name: 'Lunatico', emoji: '🌙', hint: 'Im Dunkeln siehst du nur unten etwas!', knives: 9, obstacles: 3, spin: 'wave', speed: 1.6, wave: 0.9, dark: true },
  donut: { id: 'donut', name: 'Doppeldonut', emoji: '🍩', hint: 'Wechselt völlig zufällig die Richtung!', knives: 9, obstacles: 1, spin: 'jitter', speed: 2.2 },
  drache: { id: 'drache', name: 'Feuerdrache Fafnir', emoji: '🐉', hint: 'Der Endgegner: Schild, Richtungswechsel und Wut!', knives: 10, obstacles: 2, spin: 'wave', speed: 1.6, wave: 1.5, speedUp: 0.06, shields: { count: 1, half: 0.42, speed: 1.6 } },
};

