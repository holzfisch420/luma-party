/**
 * „Klingenrad“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { KlingenCover } from './components/Cover';
import { KlingenQuickSettings } from './components/SettingsPanel';
import { klingenMeta, type KlingenSettings } from './game-config';
import type { KlingenPrivateState, KlingenPublicState } from './types';

const KlingenHostView = lazyView(() => import('./components/host/KlingenHostView'), 'KlingenHostView');
const KlingenController = lazyView(() => import('./components/player/KlingenController'), 'KlingenController');

export const klingenModule: ClientGameModule<KlingenPublicState, KlingenPrivateState, KlingenSettings> = {
  meta: klingenMeta,
  music: 'klingen',
  Cover: KlingenCover,
  HostView: KlingenHostView,
  PlayerView: KlingenController,
  SettingsPanel: KlingenQuickSettings,
  QuickSettings: KlingenQuickSettings,
  rules: [
    'Ein Rad dreht sich. Tippe, um ein Messer zu werfen – triffst du ein Messer, das schon steckt, klirrt es.',
    'Einzeln: Alle spielen auf dem Handy dieselben Stufen. Jede dritte Stufe ist ein Boss – 15 verschiedene, jeder mit eigenem Trick (Schilde, Monde, Fangarm, Dunkelheit, Zeitbombe …). Wer in der Zeit die meisten Stufen schafft, gewinnt.',
    'Triffst du ein Messer, verlierst du ein Leben – die Stufe läuft aber weiter. Goldene Sterne im Rad treffen gibt Bonuspunkte.',
    'Ein Rad: Alle werfen per Handy ins große Rad auf dem Fernseher. Runde 1 hat jede Person 1 Messer, Runde 2 zwei und so weiter. Wer ein Messer trifft, ist raus – die letzte Person gewinnt.',
  ],
};
