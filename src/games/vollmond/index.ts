/**
 * „Vollmond“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { BookOpen, Play, Users } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { VollmondCover } from './components/Cover';
import { VollmondQuickSettings } from './components/SettingsPanel';
import { vollmondMeta, type VollmondSettings } from './game-config';
import type { VollmondPrivateState, VollmondPublicState } from './types';

const VollmondTitleScreen = lazyView(() => import('./components/TitleScreen'), 'VollmondTitleScreen');
const VollmondHostView = lazyView(() => import('./components/host/VollmondHostView'), 'VollmondHostView');
const VollmondController = lazyView(() => import('./components/player/VollmondController'), 'VollmondController');

export const vollmondModule: ClientGameModule<VollmondPublicState, VollmondPrivateState, VollmondSettings> = {
  meta: vollmondMeta,
  music: 'vollmond-night',
  Cover: VollmondCover,
  HostView: VollmondHostView,
  PlayerView: VollmondController,
  SettingsPanel: VollmondQuickSettings,
  QuickSettings: VollmondQuickSettings,
  rules: [
    'Jede Person bekommt heimlich eine Rolle aufs Handy – zum Ansehen gedrückt halten. Werwölfe kennen sich gegenseitig.',
    'Nachts schauen alle nur aufs eigene Handy: Die Werwölfe wählen ein Opfer, die Seherin prüft eine Person, der Leibwächter beschützt jemanden, die Hexe kann heilen oder vergiften. Alle anderen tippen zur Tarnung auch etwas an.',
    'Tagsüber wird diskutiert – wer lügt, wer ist verdächtig? Danach stimmt das Dorf ab, wer verbannt wird. Stirbt der Jäger, nimmt er jemanden mit.',
    'Das Dorf gewinnt, wenn alle Werwölfe weg sind. Die Werwölfe gewinnen, sobald sie mindestens so viele sind wie der Rest. Tote schweigen!',
  ],
  spectating: ({ public: p }, me) => !p.order.includes(me) || !p.alive.includes(me),
  TitleScreen: VollmondTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'roles', label: 'Rollen', icon: Users, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'settings', title: 'Rollen & Ablauf' }],
  },
};
