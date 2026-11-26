/**
 * „Plopp!“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { createElement } from 'react';
import { BookOpen, ListChecks, Play, SlidersHorizontal } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { PloppCover } from './components/Cover';
import { PloppQuickSettings, PloppSettingsPanel } from './components/SettingsPanel';
import { ploppMeta, type PloppSettings } from './game-config';
import type { PloppPrivateState, PloppPublicState } from './types';

const PloppTitleScreen = lazyView(() => import('./components/TitleScreen'), 'PloppTitleScreen');
const PloppHostView = lazyView(() => import('./components/host/PloppHostView'), 'PloppHostView');
const PloppController = lazyView(() => import('./components/player/PloppController'), 'PloppController');

export const ploppModule: ClientGameModule<PloppPublicState, PloppPrivateState, PloppSettings> = {
  meta: ploppMeta,
  music: 'plopp',
  Cover: PloppCover,
  HostView: PloppHostView,
  PlayerView: PloppController,
  SettingsPanel: PloppSettingsPanel,
  QuickSettings: PloppQuickSettings,
  rules: [
    'Alle sehen dieselbe Aufgabe, zum Beispiel „Ein Tier“ oder „Eine Stadt mit Z“.',
    'Wer den Kugelfisch hat, tippt eine passende Antwort aufs Handy – stimmt sie, wandert der Fisch zur nächsten Person. Jede Antwort gilt nur einmal pro Runde.',
    'Tippfehler werden automatisch korrigiert („Tigger“ → „Tiger“). Kennt das Spiel eine Antwort nicht, stimmen die anderen ab.',
    'Jede Person hat ihre eigene geheime Zündschnur – sie brennt nur, solange DU den Fisch hältst. Wessen Schnur zuerst abbrennt, bei dem platzt er: ein Leben weniger. Die letzte Person im Wasser gewinnt.',
    'Der Fernseher liest jede gültige Antwort laut vor.',
  ],
  spectating: ({ public: p }, me) => !p.order.includes(me) || (p.lives[me] ?? 0) <= 0,
  TitleScreen: PloppTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'packs', label: 'Kategorien', icon: ListChecks, action: { kind: 'view', view: 'packs' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'packs', title: 'Kategorien', Content: (p) => createElement(PloppQuickSettings, p) }],
  },
};
