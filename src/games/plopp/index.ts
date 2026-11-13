/**
 * „Plopp!“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { PloppCover } from './components/Cover';
import { PloppQuickSettings, PloppSettingsPanel } from './components/SettingsPanel';
import { ploppMeta, type PloppSettings } from './game-config';
import type { PloppPrivateState, PloppPublicState } from './types';

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
    'Irgendwann platzt der Fisch – wann, weiß niemand. Wer ihn dann hält, verliert ein Leben. Die letzte Person im Wasser gewinnt.',
  ],
};
