/**
 * „Couch-Match“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { KinoCover } from './components/Cover';
import { KinoSettingsPanel } from './components/SettingsPanel';
import { kinoMeta, type KinoSettings } from './game-config';
import type { KinoPrivateState, KinoPublicState } from './types';

const KinoHostView = lazyView(() => import('./components/host/KinoHostView'), 'KinoHostView');
const KinoController = lazyView(() => import('./components/player/KinoController'), 'KinoController');

export const kinoModule: ClientGameModule<KinoPublicState, KinoPrivateState, KinoSettings> = {
  meta: kinoMeta,
  music: 'menu',
  Cover: KinoCover,
  HostView: KinoHostView,
  PlayerView: KinoController,
  SettingsPanel: KinoSettingsPanel,
  QuickSettings: KinoSettingsPanel,
  rules: [
    'Vorher wählt die Spielleitung, ob Filme, Serien oder beides – und welche Genres.',
    'Alle bekommen dieselben 25 Titel in eigener, zufälliger Reihenfolge aufs Handy. Nach rechts wischen (♥) = will ich sehen, nach links (✕) = lieber nicht.',
    'Sind alle durch, zeigt der Fernseher die Rangliste: oben steht, was die meisten sehen wollen – mit kurzer Beschreibung.',
    'Mit „Neue 25 Titel“ geht es mit einer frischen Auswahl weiter.',
  ],
  spectating: ({ public: p }, me) => p.phase === 'results' || !p.swipers.includes(me) || (p.progress[me] ?? 0) >= p.deck.length,
};
