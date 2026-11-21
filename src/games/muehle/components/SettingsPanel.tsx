import { Segmented, SettingRow, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { MuehleSettings } from '../game-config';

export function MuehleSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<MuehleSettings>) {
  const set = (patch: Partial<MuehleSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="flex flex-col">
      <SettingRow label="Springen" hint="Mit nur noch drei Steinen darf man auf jeden freien Punkt springen">
        <Toggle checked={settings.flying} onChange={(flying) => set({ flying })} disabled={disabled} />
      </SettingRow>
      <SettingRow label="Farben" hint="Die ersten zwei Personen im Raum spielen, Weiß beginnt">
        <Segmented
          layoutId="muehle-colors"
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
