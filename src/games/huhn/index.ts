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
    'Alle Hühner laufen im selben Level. Knopf auf dem Handy = Schwerkraft umdrehen (Boden ↔ Decke).',
    'Wer in eine Lücke fällt, einem Polizisten in die Arme läuft oder hinten von der Polizei eingeholt wird, ist raus.',
    'Hühner rempeln sich gegenseitig – wer zuletzt noch frei ist, gewinnt die Runde.',
  ],
};
