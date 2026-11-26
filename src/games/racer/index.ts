/**
 * Kurvenrausch – Client-Modul. Die 3D-Ansicht (Three.js) wird erst geladen, wenn das Spiel läuft.
 */
import { createElement, lazy, Suspense } from 'react';
import type { ClientGameModule, HostViewProps } from '../game-types';
import { RacerCover } from './components/Cover';
import { BookOpen, Flag, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { RacerSettingsPanel } from './components/SettingsPanel';
import { RacerQuickSettings } from './components/TrackPicker';
import { racerMeta, type RacerSettings } from './game-config';
import type { RacerPrivateState, RacerPublicState } from './types';

const RacerTitleScreen = lazyView(() => import('./components/TitleScreen'), 'RacerTitleScreen');
const RacerController = lazyView(() => import('./components/player/RacerController'), 'RacerController');
const LazyHost = lazy(() => import('./components/host/RacerHostView').then((m) => ({ default: m.RacerHostView })));

function RacerHost(props: HostViewProps<RacerPublicState>) {
  return createElement(Suspense, { fallback: createElement('div', { className: 'grid h-dvh place-items-center bg-black font-sans text-2xl font-black text-white' }, 'Strecke wird geladen …') }, createElement(LazyHost, props));
}

export const racerModule: ClientGameModule<RacerPublicState, RacerPrivateState, RacerSettings> = {
  meta: racerMeta,
  music: 'racer',
  Cover: RacerCover,
  HostView: RacerHost,
  PlayerView: RacerController,
  SettingsPanel: RacerSettingsPanel,
  QuickSettings: RacerQuickSettings,
  rules: [
    'Handy quer halten. Lenken durch Neigen wie ein Lenkrad – oder umschalten auf Joystick mit Gas und Bremse.',
    'Alle Checkpoints in der richtigen Reihenfolge durchfahren. Ohne Bande kann man runterfallen – „Reset“ bringt dich zum letzten Checkpoint.',
    'Punkte je Platz (10, 8, 6, 5, 4, 3, 2, 1). Strecken wählt der Spielleiter oder der Fernseher im Startbildschirm.',
  ],
  spectating: ({ public: p }, me) => { const r = p.players.find((x) => x.playerId === me); return p.phase === 'race' && (!r || !r.inRace || r.finished || r.dnf); },
  TitleScreen: RacerTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Rennen starten', icon: Flag, action: { kind: 'start' } },
      { id: 'tracks', label: 'Strecken', icon: MapIcon, action: { kind: 'view', view: 'tracks' } },
      { id: 'settings', label: 'Einstellungen', icon: SlidersHorizontal, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'tracks', title: 'Strecken', Content: (p) => createElement(RacerQuickSettings, p) }],
  },
};
