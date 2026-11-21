import { Segmented, SettingRow } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import { TIME_CONTROLS, TIME_LABELS, type SchachSettings } from '../game-config';

export function SchachSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<SchachSettings>) {
  const set = (patch: Partial<SchachSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="flex flex-col">
      <SettingRow label="Bedenkzeit" hint="Minuten pro Person + Sekunden Zuschlag pro Zug">
        <div className="grid grid-cols-3 gap-1.5">
          {TIME_CONTROLS.map((t) => (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => set({ time: t })}
              className={`rounded-xl border-2 px-2 py-1.5 text-xs font-black ${settings.time === t ? 'border-cyan bg-cyan text-white' : 'border-home-line bg-white text-home-muted'}`}
            >
              {TIME_LABELS[t]}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Farben" hint="Die ersten zwei Personen im Raum spielen, alle anderen schauen zu">
        <Segmented
          layoutId="schach-colors"
          value={settings.colors}
          options={[
            { value: 'random', label: 'Zufällig' },
            { value: 'first-white', label: 'Erste:r hat Weiß' },
          ]}
          onChange={(colors) => set({ colors })}
          disabled={disabled}
        />
      </SettingRow>
    </div>
  );
}
