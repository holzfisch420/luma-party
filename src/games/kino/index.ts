/**
 * „Couch-Match“ – Client-Modul.
 */
import type { ClientGameModule } from '../game-types';
import { BookOpen, Clapperboard, Film, ListChecks, Tv } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { KinoCover } from './components/Cover';
import { KinoSettingsPanel } from './components/SettingsPanel';
import { kinoMeta, type KinoSettings } from './game-config';
import type { KinoPrivateState, KinoPublicState } from './types';

const KinoTitleScreen = lazyView(() => import('./components/TitleScreen'), 'KinoTitleScreen');
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
  TitleScreen: KinoTitleScreen,
  menu: {
    items: [
      { id: 'film', label: 'Filme', icon: Film, action: { kind: 'start', patch: { type: 'film' } } },
      { id: 'serie', label: 'Serien', icon: Tv, action: { kind: 'start', patch: { type: 'serie' } } },
      { id: 'beide', label: 'Beides', icon: Clapperboard, action: { kind: 'start', patch: { type: 'beide' } } },
      { id: 'genres', label: 'Genres', icon: ListChecks, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'settings', title: 'Genres & Auswahl' }],
  },
};
