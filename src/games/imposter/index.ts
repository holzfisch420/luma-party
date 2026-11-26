/**
 * Imposter – Client-Modul.
 */
import { CategoryPicker } from '../../components/words/CategoryPicker';
import type { ClientGameModule } from '../game-types';
import { createElement } from 'react';
import { BookOpen, ListChecks, Play, SlidersHorizontal } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { ImposterCover } from './components/Cover';
import { ImposterSettingsPanel } from './components/SettingsPanel';
import { imposterMeta, type ImposterSettings } from './game-config';
import type { ImposterPrivateState, ImposterPublicState } from './types';

const ImposterTitleScreen = lazyView(() => import('./components/TitleScreen'), 'ImposterTitleScreen');
const ImposterHostView = lazyView(() => import('./components/host/ImposterHostView'), 'ImposterHostView');
const ImposterController = lazyView(() => import('./components/player/ImposterController'), 'ImposterController');

export const imposterModule: ClientGameModule<ImposterPublicState, ImposterPrivateState, ImposterSettings> = {
  meta: imposterMeta,
  music: 'imposter',
  Cover: ImposterCover,
  HostView: ImposterHostView,
  PlayerView: ImposterController,
  SettingsPanel: ImposterSettingsPanel,
  QuickSettings: CategoryPicker,
  rules: [
    'Alle sehen auf dem Handy dasselbe geheime Wort – nur der Imposter nicht (Karte gedrückt halten).',
    'Reihum sagt jede Person ein Wort, das passt. Der Imposter muss bluffen.',
    'Dann wird diskutiert und abgestimmt. Wird der Imposter enttarnt, darf er noch das Wort raten.',
  ],
  spectating: ({ public: p }, me) => !p.order.includes(me),
  TitleScreen: ImposterTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'cats', label: 'Kategorien', icon: ListChecks, action: { kind: 'view', view: 'cats' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'cats', title: 'Kategorien & Schwierigkeit', Content: (p) => createElement(CategoryPicker<ImposterSettings>, p) }],
  },
};
