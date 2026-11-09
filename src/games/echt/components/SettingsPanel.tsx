import { Chip, SectionTitle, SettingRow, Stepper } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import { SET_LABELS, STATEMENT_SETS, type EchtSettings, type StatementSet } from '../game-config';
import { STATEMENTS } from '../statements';

/** Satz-Sammlungen + Sätze pro Person – auch im Startbildschirm */
export function EchtQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<EchtSettings>) {
  const set = (patch: Partial<EchtSettings>) => onChange({ ...settings, ...patch });
  const toggle = (s: StatementSet) => {
    const next = settings.sets.includes(s) ? settings.sets.filter((x) => x !== s) : [...settings.sets, s];
    if (next.length) set({ sets: next });
  };
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-2 text-[15px] font-extrabold">Sätze</div>
        <div className="flex flex-wrap gap-2">
          {STATEMENT_SETS.map((s) => (
            <Chip key={s} active={settings.sets.includes(s)} disabled={disabled} onClick={() => toggle(s)}>
              {SET_LABELS[s].label} <span className="opacity-60">{STATEMENTS[s].length}</span>
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs font-bold text-home-muted">{settings.sets.map((s) => SET_LABELS[s].hint).join(' · ')}</p>
      </div>
      <SettingRow label="Sätze pro Person" hint="So oft ist jede Person hintereinander dran">
        <Stepper value={settings.perTurn} min={1} max={3} onChange={(perTurn) => set({ perTurn })} disabled={disabled} />
      </SettingRow>
    </div>
  );
}

export function EchtSettingsPanel(props: SettingsPanelProps<EchtSettings>) {
  const { settings, onChange, disabled } = props;
  const set = (patch: Partial<EchtSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spielablauf</SectionTitle>
        <SettingRow label="Runden" hint="Wie oft jede Person insgesamt dran ist">
          <Stepper value={settings.rounds} min={1} max={3} onChange={(rounds) => set({ rounds })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Schreibzeit">
          <Stepper value={settings.writeSeconds} min={30} max={240} step={15} onChange={(writeSeconds) => set({ writeSeconds })} disabled={disabled} format={(v) => `${v} s`} />
        </SettingRow>
      </div>
      <div className="pt-3">
        <EchtQuickSettings {...props} />
      </div>
    </div>
  );
}
