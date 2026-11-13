/**
 * „Wortknacker“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { WortCover } from './components/Cover';
import { WortQuickSettings } from './components/SettingsPanel';
import { wortMeta, type WortSettings } from './game-config';
import type { WortPrivateState, WortPublicState } from './types';

const WortHostView = lazyView(() => import('./components/host/WortHostView'), 'WortHostView');
const WortController = lazyView(() => import('./components/player/WortController'), 'WortController');

export const wortModule: ClientGameModule<WortPublicState, WortPrivateState, WortSettings> = {
  meta: wortMeta,
  music: 'wort',
  Cover: WortCover,
  HostView: WortHostView,
  PlayerView: WortController,
  SettingsPanel: WortQuickSettings,
  QuickSettings: WortQuickSettings,
  rules: [
    'Alle raten gleichzeitig dasselbe geheime Wort mit 5 Buchstaben – jede Person hat 6 Versuche auf dem Handy.',
    'Grün: Buchstabe stimmt an dieser Stelle. Gelb: kommt vor, aber woanders. Grau: kommt nicht vor. Umlaute zählen als eigener Buchstabe.',
    'Nur echte Wörter zählen als Versuch. Der Fernseher zeigt nur die Farben der anderen, die Buchstaben erst bei der Auflösung.',
    'Punkte: im 1. Versuch 6, im 6. Versuch 1 – plus 2 für die schnellste und 1 für die zweitschnellste Person.',
  ],
};
