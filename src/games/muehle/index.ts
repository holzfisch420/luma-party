/**
 * „Mühle“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { BookOpen, Play, SlidersHorizontal } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { MuehleCover } from './components/Cover';
import { MuehleSettingsPanel } from './components/SettingsPanel';
import { muehleMeta, type MuehleSettings } from './game-config';
import type { MuehlePublicState } from './types';

const MuehleTitleScreen = lazyView(() => import('./components/TitleScreen'), 'MuehleTitleScreen');
const MuehleHostView = lazyView(() => import('./components/host/MuehleHostView'), 'MuehleHostView');
const MuehleController = lazyView(() => import('./components/player/MuehleController'), 'MuehleController');

export const muehleModule: ClientGameModule<MuehlePublicState, null, MuehleSettings> = {
  meta: muehleMeta,
  music: 'wort',
  Cover: MuehleCover,
  HostView: MuehleHostView,
  PlayerView: MuehleController,
  SettingsPanel: MuehleSettingsPanel,
  QuickSettings: MuehleSettingsPanel,
  rules: [
    'Zu zweit: Die ersten zwei Personen im Raum spielen, alle anderen schauen zu. Weiß beginnt.',
    'Erst setzt ihr abwechselnd je 9 Steine auf freie Punkte, danach zieht ihr sie entlang der Linien auf einen freien Nachbarpunkt.',
    'Drei eigene Steine in einer Linie = Mühle: Du nimmst einen gegnerischen Stein weg (Steine in einer Mühle nur, wenn es keine anderen gibt).',
    'Mit nur noch drei Steinen darfst du springen. Wer nur noch zwei Steine hat oder nicht mehr ziehen kann, verliert.',
  ],
  spectating: ({ public: p }, me) => p.players.w !== me && p.players.b !== me,
  TitleScreen: MuehleTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Spielen', icon: Play, action: { kind: 'start' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
  },
};
