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
  Cover: PanzerCover,
  HostView: PanzerHostView,
  PlayerView: PanzerController,
  SettingsPanel: PanzerSettingsPanel,
  ResultsView: PanzerResultsView,
  rules: [
    'Handy quer halten: links Joystick zum Fahren, rechts A = Feuer, B = Power-up, X = Turbo, Y = Hupe.',
    'Kugeln prallen von Wänden ab – auch auf dich selbst zurück!',
    'Fahr über Kisten, um Power-ups einzusammeln. Der letzte Panzer gewinnt die Runde.',
  ],
};
