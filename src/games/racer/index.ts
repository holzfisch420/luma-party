/**
 * Kurvenrausch – Client-Modul. Die 3D-Ansicht (Three.js) wird erst geladen, wenn das Spiel läuft.
 */
import { createElement, lazy, Suspense } from 'react';
import type { ClientGameModule, HostViewProps } from '../game-types';
import { RacerCover } from './components/Cover';
import { lazyView } from '../lazy-view';
import { RacerSettingsPanel } from './components/SettingsPanel';
import { RacerQuickSettings } from './components/TrackPicker';
import { racerMeta, type RacerSettings } from './game-config';
import type { RacerPrivateState, RacerPublicState } from './types';

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
};
