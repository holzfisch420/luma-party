/**
 * Hühnerjagd – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { createElement } from 'react';
import { BookOpen, Map as MapIcon, Play, SlidersHorizontal } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { HuhnCover } from './components/Cover';
import { HuhnMapPicker } from './components/MapPicker';
import { HuhnSettingsPanel } from './components/SettingsPanel';
import { huhnMeta, type HuhnSettings } from './game-config';
import type { HuhnPrivateState, HuhnPublicState } from './types';

const HuhnTitleScreen = lazyView(() => import('./components/TitleScreen'), 'HuhnTitleScreen');
const HuhnHostView = lazyView(() => import('./components/host/HuhnHostView'), 'HuhnHostView');
const HuhnController = lazyView(() => import('./components/player/HuhnController'), 'HuhnController');

export const huhnModule: ClientGameModule<HuhnPublicState, HuhnPrivateState, HuhnSettings> = {
  meta: huhnMeta,
  music: 'huhn',
  Cover: HuhnCover,
  HostView: HuhnHostView,
  PlayerView: HuhnController,
  SettingsPanel: HuhnSettingsPanel,
  QuickSettings: HuhnMapPicker,
  rules: [
    'Alle Hühner laufen im selben Level. Knopf auf dem Handy = Schwerkraft umdrehen (Boden ↔ Decke).',
    'Wer in eine Lücke fällt, einem Polizisten in die Arme läuft oder hinten von der Polizei eingeholt wird, ist raus.',
    'Hühner rempeln sich gegenseitig – wer zuletzt noch frei ist, gewinnt die Runde.',
  ],
  spectating: ({ public: p }, me) => { const r = p.players.find((x) => x.playerId === me); return p.phase === 'run' && (!r || !r.inRound || !r.alive); },
  TitleScreen: HuhnTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'maps', label: 'Karten', icon: MapIcon, action: { kind: 'view', view: 'maps' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'maps', title: 'Karten', Content: (p) => createElement(HuhnMapPicker, p) }],
  },
};
