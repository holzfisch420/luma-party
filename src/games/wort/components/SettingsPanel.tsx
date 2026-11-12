import { SettingRow, Stepper } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { WortSettings } from '../game-config';

export function WortQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<WortSettings>) {
  const set = (patch: Partial<WortSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="flex flex-col">
      <SettingRow label="Wörter" hint="So viele Runden werden gespielt">
        <Stepper value={settings.rounds} min={1} max={10} onChange={(rounds) => set({ rounds })} disabled={disabled} />
      </SettingRow>
      <SettingRow label="Zeit pro Wort">
        <Stepper value={settings.seconds} min={60} max={600} step={30} onChange={(seconds) => set({ seconds })} disabled={disabled} format={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`} />
      </SettingRow>
    </div>
  );
}
