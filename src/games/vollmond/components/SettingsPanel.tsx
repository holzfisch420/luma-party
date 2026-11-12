import { Chip, SettingRow, Stepper, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import { ROLE_INFO, SPECIAL_MIN_PLAYERS, SPECIAL_ROLES, type SpecialRole, type VollmondSettings } from '../game-config';

export function VollmondQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<VollmondSettings>) {
  const set = (patch: Partial<VollmondSettings>) => onChange({ ...settings, ...patch });
  const toggle = (r: SpecialRole) => set({ specials: settings.specials.includes(r) ? settings.specials.filter((x) => x !== r) : [...settings.specials, r] });
  return (
    <div className="flex flex-col gap-1">
      <div>
        <div className="mb-2 text-[15px] font-extrabold">Sonderrollen</div>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_ROLES.map((r) => (
            <Chip key={r} active={settings.specials.includes(r)} disabled={disabled} onClick={() => toggle(r)}>
              {ROLE_INFO[r].emoji} {ROLE_INFO[r].name} <span className="opacity-60">ab {SPECIAL_MIN_PLAYERS[r]}</span>
            </Chip>
          ))}
        </div>
      </div>
      <SettingRow label="Werwölfe" hint="Automatisch: 1 bis 6 Personen, 2 bis 9, 3 bis 13, sonst 4">
        <Stepper value={settings.wolves} min={0} max={4} onChange={(wolves) => set({ wolves })} disabled={disabled} format={(v) => (v === 0 ? 'Auto' : String(v))} />
      </SettingRow>
      <SettingRow label="Diskussionszeit">
        <Stepper value={settings.talkSeconds} min={60} max={600} step={30} onChange={(talkSeconds) => set({ talkSeconds })} disabled={disabled} format={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`} />
      </SettingRow>
      <SettingRow label="Rolle von Toten zeigen" hint="Aus = noch mehr Rätselraten">
        <Toggle checked={settings.revealDead} onChange={(revealDead) => set({ revealDead })} disabled={disabled} label="Rolle von Toten zeigen" />
      </SettingRow>
    </div>
  );
}
