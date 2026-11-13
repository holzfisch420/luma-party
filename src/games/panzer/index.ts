/**
 * Kettenchaos – Client-Modul (Kachel-Grafik, TV-Arena, Handy-Gamepad, Einstellungen, Rangliste).
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { panzerMeta, type PanzerSettings } from './game-config';
import { PanzerCover } from './components/Cover';
import { PanzerResultsView } from './components/ResultsView';
import { PanzerSettingsPanel } from './components/SettingsPanel';
import type { PanzerPrivateState, PanzerPublicState } from './types';

const PanzerHostView = lazyView(() => import('./components/host/PanzerHostView'), 'PanzerHostView');
const PanzerController = lazyView(() => import('./components/player/PanzerController'), 'PanzerController');

export const panzerModule: ClientGameModule<PanzerPublicState, PanzerPrivateState, PanzerSettings> = {
  meta: panzerMeta,
  music: 'panzer',
  Cover: PanzerCover,
  HostView: PanzerHostView,
  PlayerView: PanzerController,
  SettingsPanel: PanzerSettingsPanel,
  ResultsView: PanzerResultsView,
  rules: [
    'Fahrknopf halten = sofort vorwärts, loslassen = auf der Stelle drehen, kurz tippen = Drehrichtung wechseln.',
    'Feuer-Knopf schießt (max. 3 Kugeln gleichzeitig), Item-Knopf setzt das eingesammelte Power-up ein. Kugeln prallen nicht ab.',
    'Fahr über Kisten, um Power-ups einzusammeln. Der letzte Panzer gewinnt die Runde.',
  ],
};
