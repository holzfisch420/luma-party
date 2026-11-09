import { Library } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Chip, SectionTitle, SettingRow, Stepper } from '../../../components/ui/Controls';
import { Modal } from '../../../components/ui/Modal';
import { statementApi, type StatementListSummary } from '../statement-api';
import { StatementManager } from './StatementManager';
import type { SettingsPanelProps } from '../../game-types';
import { SET_LABELS, STATEMENT_SETS, type EchtSettings, type StatementSet } from '../game-config';
import { STATEMENTS } from '../statements';

/** Satz-Sammlungen + Sätze pro Person – auch im Startbildschirm */
export function EchtQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<EchtSettings>) {
  const set = (patch: Partial<EchtSettings>) => onChange({ ...settings, ...patch });
  const [lists, setLists] = useState<StatementListSummary[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const reload = () => statementApi.list().then(setLists).catch(() => setLists([]));
  useEffect(() => {
    void reload();
  }, []);
  // mindestens eine Quelle muss gewählt bleiben
  const sources = (sets: StatementSet[], ids: string[]) => sets.length + ids.filter((id) => lists.some((l) => l.id === id)).length;
  const toggle = (s: StatementSet) => {
    const next = settings.sets.includes(s) ? settings.sets.filter((x) => x !== s) : [...settings.sets, s];
    if (sources(next, settings.customListIds)) set({ sets: next });
  };
  const toggleList = (id: string) => {
    const next = settings.customListIds.includes(id) ? settings.customListIds.filter((x) => x !== id) : [...settings.customListIds, id];
    if (sources(settings.sets, next)) set({ customListIds: next });
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
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[15px] font-extrabold">Eigene Sätze</div>
          <Button size="sm" variant="ghost" icon={<Library className="size-4" />} onClick={() => setManagerOpen(true)}>
            Verwalten
          </Button>
        </div>
        {lists.length === 0 ? (
          <p className="text-xs font-bold text-home-muted">Noch keine – über „Verwalten“ eigene Sätze eintippen oder einfügen.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lists.map((l) => (
              <Chip key={l.id} active={settings.customListIds.includes(l.id)} disabled={disabled} onClick={() => toggleList(l.id)}>
                {l.name} <span className="opacity-60">{l.count}</span>
              </Chip>
            ))}
          </div>
        )}
      </div>
      <Modal open={managerOpen} onClose={() => setManagerOpen(false)} title="Eigene Sätze" subtitle="Eine Zeile pro Satz – BLUBB markiert die Lücke." width="max-w-2xl">
        <StatementManager onChanged={() => void reload()} />
      </Modal>
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
