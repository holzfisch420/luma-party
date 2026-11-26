/**
 * „Echt jetzt?“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { createElement } from 'react';
import { BookOpen, Play, SlidersHorizontal, Layers } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { EchtCover } from './components/Cover';
import { EchtQuickSettings, EchtSettingsPanel } from './components/SettingsPanel';
import { echtMeta, type EchtSettings } from './game-config';
import type { EchtPrivateState, EchtPublicState } from './types';

const EchtTitleScreen = lazyView(() => import('./components/TitleScreen'), 'EchtTitleScreen');
const EchtHostView = lazyView(() => import('./components/host/EchtHostView'), 'EchtHostView');
const EchtController = lazyView(() => import('./components/player/EchtController'), 'EchtController');

export const echtModule: ClientGameModule<EchtPublicState, EchtPrivateState, EchtSettings> = {
  meta: echtMeta,
  music: 'echt',
  Cover: EchtCover,
  HostView: EchtHostView,
  PlayerView: EchtController,
  SettingsPanel: EchtSettingsPanel,
  QuickSettings: EchtQuickSettings,
  rules: [
    'Reihum ist eine Person dran und ergänzt einen persönlichen Satz ehrlich – zum Beispiel „Mein heimliches Talent ist BLUBB“.',
    'Alle anderen schreiben eine Fälschung, die nach dieser Person klingt. Dann stimmen alle ab: Welche Antwort ist echt?',
    'Richtig geraten: +1 für dich und die Person, die dran ist. Jede Person, die auf deine Fälschung reinfällt: +1. Genau dieselbe Antwort: +2.',
  ],
  spectating: ({ public: p }, me) => !(me in p.scores),
  TitleScreen: EchtTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'sets', label: 'Aussagen', icon: Layers, action: { kind: 'view', view: 'sets' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'sets', title: 'Aussagen-Sets & eigene Sätze', Content: (p) => createElement(EchtQuickSettings, p) }],
  },
};
