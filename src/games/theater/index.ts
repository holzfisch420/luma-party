/**
 * Textprobe – Client-Modul (Kachel-Grafik, Bühnen-Ansicht, Handy-Steuerung, Skript-Upload).
 */
import type { ClientGameModule } from '../game-types';
import { lazyView } from '../lazy-view';
import { theaterMeta, type TheaterSettings } from './game-config';
import { TheaterCover } from './components/Cover';
import { TheaterSettingsPanel } from './components/SettingsPanel';
import './script-cache';
import type { TheaterPublicState } from './types';

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
};
