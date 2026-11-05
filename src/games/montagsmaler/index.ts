/**
 * Montagsmaler – Client-Modul.
 * Registriert Cover, TV-Ansicht, Smartphone-Ansicht und Einstellungen beim Launcher.
 */
import type { ClientGameModule } from '../game-types';
import { montagsmalerMeta, type MontagsmalerSettings } from './game-config';
import { MontagsmalerCover } from './components/Cover';
import { MontagsmalerHostView } from './components/host/HostView';
import { MontagsmalerPlayerView } from './components/player/PlayerView';
import { MontagsmalerSettingsPanel } from './components/SettingsPanel';
import type { MontagsmalerPrivateState, MontagsmalerPublicState } from './types';

export const montagsmalerModule: ClientGameModule<MontagsmalerPublicState, MontagsmalerPrivateState, MontagsmalerSettings> = {
  meta: montagsmalerMeta,
  Cover: MontagsmalerCover,
  HostView: MontagsmalerHostView,
  PlayerView: MontagsmalerPlayerView,
  SettingsPanel: MontagsmalerSettingsPanel,
  rules: [
    'Eine Person zeichnet ein geheimes Wort auf dem Smartphone.',
    'Alle anderen raten über ihr Smartphone – die Zeichnung erscheint live auf dem TV.',
    'Je schneller du richtig rätst, desto mehr Punkte. Der Zeichner punktet mit.',
  ],
};
