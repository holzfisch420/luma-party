/**
 * Textprobe – Client-Modul (Kachel-Grafik, Bühnen-Ansicht, Handy-Steuerung, Skript-Upload).
 */
import type { ClientGameModule } from '../game-types';
import { theaterMeta, type TheaterSettings } from './game-config';
import { TheaterCover } from './components/Cover';
import { TheaterHostView } from './components/host/TheaterHostView';
import { TheaterController } from './components/player/TheaterController';
import { TheaterSettingsPanel } from './components/SettingsPanel';
import './script-cache';
import type { TheaterPublicState } from './types';

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
