import { SectionTitle, Segmented, SettingRow, Stepper, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { RacerSettings } from '../game-config';
import { RacerQuickSettings } from './TrackPicker';

export function RacerSettingsPanel(props: SettingsPanelProps<RacerSettings>) {
  const { settings, onChange, disabled } = props;
  const set = (patch: Partial<RacerSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Rennen</SectionTitle>
        <SettingRow label="Anzahl Rennen">
          <Stepper value={settings.races} min={1} max={8} onChange={(races) => set({ races })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Reihenfolge" hint="Der Reihe nach = von leicht nach schwer">
          <Segmented
            layoutId="kr-order"
            value={settings.trackMode}
            onChange={(trackMode) => set({ trackMode })}
            disabled={disabled}
            options={[
              { value: 'rotation', label: 'Der Reihe nach' },
              { value: 'random', label: 'Zufall' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Zusammenstöße" hint="Autos rempeln sich gegenseitig">
          <Toggle checked={settings.collisions} onChange={(collisions) => set({ collisions })} disabled={disabled} label="Zusammenstöße" />
        </SettingRow>
      </div>
      <div className="pt-3">
        <RacerQuickSettings {...props} />
      </div>
    </div>
  );
}
