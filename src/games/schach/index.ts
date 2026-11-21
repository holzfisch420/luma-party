/**
 * „Schach“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { SchachCover } from './components/Cover';
import { SchachSettingsPanel } from './components/SettingsPanel';
import { schachMeta, type SchachSettings } from './game-config';
import type { SchachPublicState } from './types';

const SchachHostView = lazyView(() => import('./components/host/SchachHostView'), 'SchachHostView');
const SchachController = lazyView(() => import('./components/player/SchachController'), 'SchachController');

export const schachModule: ClientGameModule<SchachPublicState, null, SchachSettings> = {
  meta: schachMeta,
  music: 'wort',
  Cover: SchachCover,
  HostView: SchachHostView,
  PlayerView: SchachController,
  SettingsPanel: SchachSettingsPanel,
  QuickSettings: SchachSettingsPanel,
  rules: [
    'Die ersten zwei Personen im Raum spielen gegeneinander, alle anderen schauen zu (und dürfen Emotes schicken).',
    'Auf dem Handy eine Figur antippen – die erlaubten Felder werden markiert – dann das Zielfeld antippen.',
    'Mit Schachuhr: Wer keine Zeit mehr hat, verliert. Remis anbieten und Aufgeben geht auf dem Handy.',
    'Sieg 3 Punkte, Remis 1 Punkt. Rochade, en passant und Umwandlung funktionieren wie gewohnt.',
  ],
  spectating: ({ public: p }, me) => p.players.w !== me && p.players.b !== me,
};
