/**
 * Montagsmaler – Client-Modul.
 * Registriert Kachel-Grafik, TV-Ansicht, Smartphone-Ansicht, Einstellungen und Rangliste beim Launcher.
 */
import type { ClientGameModule } from '../game-types';
import { createElement } from 'react';
import { BookOpen, ListChecks, NotebookPen, Play, SlidersHorizontal } from 'lucide-react';
import { WordManager } from '../../components/word-manager/WordManager';
import { lazyView } from '../lazy-view';
import { montagsmalerMeta, type MontagsmalerSettings } from './game-config';
import { MontagsmalerCover } from './components/Cover';
import { MontagsmalerSettingsPanel } from './components/SettingsPanel';
import { MontagsmalerQuickSettings } from './components/QuickSettings';
import { MontagsmalerResultsView } from './components/ResultsView';
import type { MontagsmalerPrivateState, MontagsmalerPublicState } from './types';

const MontagsmalerHostView = lazyView(() => import('./components/host/HostView'), 'MontagsmalerHostView');
const MontagsmalerTitleScreen = lazyView(() => import('./components/TitleScreen'), 'MontagsmalerTitleScreen');
const MontagsmalerPlayerView = lazyView(() => import('./components/player/PlayerView'), 'MontagsmalerPlayerView');

export const montagsmalerModule: ClientGameModule<MontagsmalerPublicState, MontagsmalerPrivateState, MontagsmalerSettings> = {
  meta: montagsmalerMeta,
  music: 'montagsmaler',
  Cover: MontagsmalerCover,
  HostView: MontagsmalerHostView,
  PlayerView: MontagsmalerPlayerView,
  SettingsPanel: MontagsmalerSettingsPanel,
  QuickSettings: MontagsmalerQuickSettings,
  ResultsView: MontagsmalerResultsView,
  rules: [
    'Eine Person zeichnet ein geheimes Wort auf dem Smartphone.',
    'Alle anderen raten über ihr Smartphone – die Zeichnung erscheint live auf dem TV.',
    'Je schneller du richtig rätst, desto mehr Punkte. Der Zeichner punktet mit.',
  ],
  spectating: ({ public: p }, me) => !p.scores.some((s) => s.playerId === me),
  TitleScreen: MontagsmalerTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'words', label: 'Wörter', icon: ListChecks, action: { kind: 'view', view: 'words' } },
      { id: 'own', label: 'Eigene Wörter', icon: NotebookPen, action: { kind: 'view', view: 'own' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [
      { id: 'words', title: 'Wörter: Kategorien & Schwierigkeit', Content: (p) => createElement(MontagsmalerQuickSettings, p) },
      { id: 'own', title: 'Eigene Wörter', Content: () => createElement(WordManager) },
    ],
  },
};
