import { SectionTitle, Segmented, SettingRow, Stepper } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { HuhnSettings } from '../game-config';
import { HuhnMapPicker } from './MapPicker';

export function HuhnSettingsPanel(props: SettingsPanelProps<HuhnSettings>) {
  const { settings, onChange, disabled } = props;
  const set = (patch: Partial<HuhnSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spielablauf</SectionTitle>
        <SettingRow label="Runden" hint="Jede Runde eine neue Strecke">
          <Stepper value={settings.rounds} min={1} max={10} onChange={(rounds) => set({ rounds })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Reihenfolge" hint="Der Reihe nach = von leicht nach schwer">
          <Segmented
            layoutId="hj-order"
            value={settings.mapMode}
            onChange={(mapMode) => set({ mapMode })}
            disabled={disabled}
            options={[
              { value: 'rotation', label: 'Der Reihe nach' },
              { value: 'random', label: 'Zufall' },
            ]}
          />
        </SettingRow>
      </div>
      <div className="pt-3">
        <HuhnMapPicker {...props} />
      </div>
    </div>
  );
}
