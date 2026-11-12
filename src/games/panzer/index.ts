/**
 * Kettenchaos – Client-Modul (Kachel-Grafik, TV-Arena, Handy-Gamepad, Einstellungen, Rangliste).
 */
import type { ClientGameModule } from '../game-types';
import { panzerMeta, type PanzerSettings } from './game-config';
import { PanzerCover } from './components/Cover';
import { PanzerHostView } from './components/host/PanzerHostView';
import { PanzerController } from './components/player/PanzerController';
import { PanzerResultsView } from './components/ResultsView';
import { PanzerSettingsPanel } from './components/SettingsPanel';
import type { PanzerPrivateState, PanzerPublicState } from './types';

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
