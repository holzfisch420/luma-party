/**
 * Hühnerjagd – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { HuhnCover } from './components/Cover';
import { HuhnHostView } from './components/host/HuhnHostView';
import { HuhnMapPicker } from './components/MapPicker';
import { HuhnController } from './components/player/HuhnController';
import { HuhnSettingsPanel } from './components/SettingsPanel';
import { huhnMeta, type HuhnSettings } from './game-config';
import type { HuhnPrivateState, HuhnPublicState } from './types';

export const huhnModule: ClientGameModule<HuhnPublicState, HuhnPrivateState, HuhnSettings> = {
  meta: huhnMeta,
  Cover: HuhnCover,
  HostView: HuhnHostView,
  PlayerView: HuhnController,
  SettingsPanel: HuhnSettingsPanel,
  QuickSettings: HuhnMapPicker,
  rules: [
    'Jedes Huhn rennt auf seiner eigenen Spur – alle bekommen dieselben Hindernisse.',
    'Knopf auf dem Handy drücken = springen, länger halten = höher springen.',
    'Unter dem Helikopter-Scheinwerfer nicht springen! Wer zuletzt noch frei ist, gewinnt die Runde.',
  ],
};
