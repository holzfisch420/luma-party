/**
 * „Plopp!“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { PloppCover } from './components/Cover';
import { PloppHostView } from './components/host/PloppHostView';
import { PloppController } from './components/player/PloppController';
import { PloppQuickSettings, PloppSettingsPanel } from './components/SettingsPanel';
import { ploppMeta, type PloppSettings } from './game-config';
import type { PloppPrivateState, PloppPublicState } from './types';

export const ploppModule: ClientGameModule<PloppPublicState, PloppPrivateState, PloppSettings> = {
  meta: ploppMeta,
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
