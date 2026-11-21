import { Chip, Segmented, SettingRow } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import { useEffect, useState } from 'react';
import { GENRE_IDS, GENRES } from '../data/genres';
import { DECK_SIZE, type KinoSettings } from '../game-config';

export function KinoSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<KinoSettings>) {
  const set = (patch: Partial<KinoSettings>) => onChange({ ...settings, ...patch });
  // Datenbank erst bei Bedarf laden (hält den Start der App schlank)
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    void import('../data/catalog').then(({ filterMedia }) => alive && setCount(filterMedia(settings.type, settings.genres).length));
    return () => {
      alive = false;
    };
  }, [settings.type, settings.genres]);
  return (
    <div className="flex flex-col">
      <SettingRow label="Was schauen wir?">
        <Segmented
          layoutId="kino-type"
          value={settings.type}
          options={[
            { value: 'beide', label: 'Beides' },
            { value: 'film', label: 'Filme' },
            { value: 'serie', label: 'Serien' },
          ]}
          onChange={(type) => set({ type })}
          disabled={disabled}
        />
      </SettingRow>
      <SettingRow label="Genres" hint={settings.genres.length ? 'Nur Titel mit mindestens einem dieser Genres' : 'Keins gewählt = alle Genres'}>
        <div className="flex flex-wrap gap-1.5">
          {GENRE_IDS.map((g) => (
            <Chip
              key={g}
              active={settings.genres.includes(g)}
              disabled={disabled}
              onClick={() => set({ genres: settings.genres.includes(g) ? settings.genres.filter((x) => x !== g) : [...settings.genres, g] })}
            >
              {GENRES[g].emoji} {GENRES[g].label}
            </Chip>
          ))}
        </div>
      </SettingRow>
      {count !== null && (
        <div className={`px-1 pt-2 text-sm font-bold ${count < 5 ? 'text-rose-600' : 'text-home-muted'}`}>
          {count} passende Titel{count >= DECK_SIZE ? ` – davon kommen ${DECK_SIZE} zufällig dran` : count < 5 ? ' – zu wenige, bitte mehr Genres wählen' : ' – alle kommen dran'}
        </div>
      )}
    </div>
  );
}
