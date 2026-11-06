import { Chip, SectionTitle, Segmented, SettingRow, Stepper } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { PanzerSettings } from '../game-config';
import { MAPS } from '../maps';

export function PanzerSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<PanzerSettings>) {
  const set = (patch: Partial<PanzerSettings>) => onChange({ ...settings, ...patch });
  const active = settings.maps.length ? settings.maps : MAPS.map((m) => m.id);
  const toggleMap = (id: string) => {
    const next = active.includes(id) ? active.filter((m) => m !== id) : [...active, id];
    if (next.length === 0) return;
    set({ maps: next.length === MAPS.length ? [] : next });
  };
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spiel</SectionTitle>
        <SettingRow label="Siege zum Gewinnen" hint="Wer zuerst so viele Runden gewinnt, ist Champion">
          <Stepper value={settings.winScore} min={1} max={15} onChange={(winScore) => set({ winScore })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Power-ups">
          <Segmented
            layoutId="pz-powerups"
            value={settings.powerups}
            onChange={(powerups) => set({ powerups })}
            disabled={disabled}
            options={[
              { value: 'off', label: 'Aus' },
              { value: 'few', label: 'Wenig' },
              { value: 'normal', label: 'Normal' },
              { value: 'many', label: 'Viel' },
            ]}
          />
        </SettingRow>
      </div>
      <div className="pt-2">
        <SectionTitle>Arenen</SectionTitle>
        <SettingRow label="Reihenfolge">
          <Segmented
            layoutId="pz-mapmode"
            value={settings.mapMode}
            onChange={(mapMode) => set({ mapMode })}
            disabled={disabled}
            options={[
              { value: 'random', label: 'Zufall' },
              { value: 'rotation', label: 'Der Reihe nach' },
            ]}
          />
        </SettingRow>
        <div className="flex flex-wrap gap-2 py-3">
          {MAPS.map((m) => (
            <Chip key={m.id} active={active.includes(m.id)} disabled={disabled} onClick={() => toggleMap(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
        <p className="text-xs font-bold text-home-muted">{active.length} von {MAPS.length} Arenen aktiv</p>
      </div>
    </div>
  );
}
