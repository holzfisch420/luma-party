import { Segmented, SettingRow, Stepper } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { KlingenSettings } from '../game-config';

export function KlingenQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<KlingenSettings>) {
  const set = (patch: Partial<KlingenSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="flex flex-col">
      <SettingRow label="Modus" hint={settings.mode === 'solo' ? 'Alle spielen auf dem eigenen Handy dieselben Stufen – die meisten Stufen gewinnen' : 'Alle werfen ins gleiche Rad auf dem Fernseher – jede Runde ein Messer mehr'}>
        <Segmented
          layoutId="klingen-mode"
          value={settings.mode}
          options={[
            { value: 'solo', label: 'Einzeln' },
            { value: 'shared', label: 'Ein Rad' },
          ]}
          onChange={(mode) => set({ mode })}
          disabled={disabled}
        />
      </SettingRow>
      {settings.mode === 'solo' && (
        <>
          <SettingRow label="Leben" hint="So oft darfst du ein Messer treffen">
            <Stepper value={settings.lives} min={1} max={3} onChange={(lives) => set({ lives })} disabled={disabled} />
          </SettingRow>
          <SettingRow label="Spielzeit">
            <Stepper value={settings.minutes} min={1} max={8} onChange={(minutes) => set({ minutes })} disabled={disabled} format={(v) => `${v} min`} />
          </SettingRow>
        </>
      )}
    </div>
  );
}
