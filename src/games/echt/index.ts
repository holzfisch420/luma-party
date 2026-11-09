/**
 * „Echt jetzt?“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { EchtCover } from './components/Cover';
import { EchtHostView } from './components/host/EchtHostView';
import { EchtController } from './components/player/EchtController';
import { EchtQuickSettings, EchtSettingsPanel } from './components/SettingsPanel';
import { echtMeta, type EchtSettings } from './game-config';
import type { EchtPrivateState, EchtPublicState } from './types';

export const echtModule: ClientGameModule<EchtPublicState, EchtPrivateState, EchtSettings> = {
  meta: echtMeta,
  Cover: EchtCover,
  HostView: EchtHostView,
  PlayerView: EchtController,
  SettingsPanel: EchtSettingsPanel,
  QuickSettings: EchtQuickSettings,
  rules: [
    'Reihum ist eine Person dran und ergänzt einen persönlichen Satz ehrlich – zum Beispiel „Mein heimliches Talent ist BLUBB“.',
    'Alle anderen schreiben eine Fälschung, die nach dieser Person klingt. Dann stimmen alle ab: Welche Antwort ist echt?',
    'Richtig geraten: +1 für dich und die Person, die dran ist. Jede Person, die auf deine Fälschung reinfällt: +1. Genau dieselbe Antwort: +2.',
  ],
};
