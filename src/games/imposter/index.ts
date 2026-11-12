/**
 * Imposter – Client-Modul.
 */
import { CategoryPicker } from '../../components/words/CategoryPicker';
import type { ClientGameModule } from '../game-types';
import { ImposterCover } from './components/Cover';
import { ImposterHostView } from './components/host/ImposterHostView';
import { ImposterController } from './components/player/ImposterController';
import { ImposterSettingsPanel } from './components/SettingsPanel';
import { imposterMeta, type ImposterSettings } from './game-config';
import type { ImposterPrivateState, ImposterPublicState } from './types';

export const imposterModule: ClientGameModule<ImposterPublicState, ImposterPrivateState, ImposterSettings> = {
  meta: imposterMeta,
  music: 'imposter',
  Cover: ImposterCover,
  HostView: ImposterHostView,
  PlayerView: ImposterController,
  SettingsPanel: ImposterSettingsPanel,
  QuickSettings: CategoryPicker,
  rules: [
    'Alle sehen auf dem Handy dasselbe geheime Wort – nur der Imposter nicht (Karte gedrückt halten).',
    'Reihum sagt jede Person ein Wort, das passt. Der Imposter muss bluffen.',
    'Dann wird diskutiert und abgestimmt. Wird der Imposter enttarnt, darf er noch das Wort raten.',
  ],
};
