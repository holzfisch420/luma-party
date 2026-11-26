/**
 * Textprobe – Client-Modul (Kachel-Grafik, Bühnen-Ansicht, Handy-Steuerung, Skript-Upload).
 */
import type { ClientGameModule } from '../game-types';
import { BookOpen, Play, ScrollText } from 'lucide-react';
import { lazyView } from '../lazy-view';
import { theaterMeta, type TheaterSettings } from './game-config';
import { TheaterCover } from './components/Cover';
import { TheaterSettingsPanel } from './components/SettingsPanel';
import './script-cache';
import type { TheaterPublicState } from './types';

const TheaterTitleScreen = lazyView(() => import('./components/TitleScreen'), 'TheaterTitleScreen');
const TheaterHostView = lazyView(() => import('./components/host/TheaterHostView'), 'TheaterHostView');
const TheaterController = lazyView(() => import('./components/player/TheaterController'), 'TheaterController');

export const theaterModule: ClientGameModule<TheaterPublicState, null, TheaterSettings> = {
  meta: theaterMeta,
  music: 'theater',
  Cover: TheaterCover,
  HostView: TheaterHostView,
  PlayerView: TheaterController,
  SettingsPanel: TheaterSettingsPanel,
  rules: [
    'In den Einstellungen das Skript (.docx) hochladen und auswählen.',
    'Auf dem Handy Szene oder Seite wählen und mit „Nach oben“ / „Nach unten“ Zeile für Zeile blättern.',
    'Mit der Ausblenden-Taste die Zeile davor, danach oder beide verstecken – so übst du deinen Text.',
  ],
  TitleScreen: TheaterTitleScreen,
  menu: {
    items: [
      { id: 'play', label: 'Probe beginnen', icon: Play, action: { kind: 'start' } },
      { id: 'script', label: 'Skript', icon: ScrollText, action: { kind: 'view', view: 'settings' } },
      { id: 'rules', label: 'Regeln', icon: BookOpen, action: { kind: 'view', view: 'rules' } },
    ],
    views: [{ id: 'settings', title: 'Skript wählen' }],
  },
};
