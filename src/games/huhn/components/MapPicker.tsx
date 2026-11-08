import { Chip } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { HuhnSettings } from '../game-config';
import { DIFFICULTY_LABEL, MAP_IDS, MAPS } from '../maps';

type MapId = (typeof MAP_IDS)[number];

/** Strecken-Auswahl mit Schwierigkeit – im Startbildschirm und in den Einstellungen */
export function HuhnMapPicker({ settings, onChange, disabled }: SettingsPanelProps<HuhnSettings>) {
  const all = settings.maps.length === 0;
  const selected = (id: string) => all || (settings.maps as string[]).includes(id);
  const toggle = (id: MapId) => {
    const current: MapId[] = all ? [...MAP_IDS] : [...settings.maps];
    const next = current.includes(id) ? current.filter((m) => m !== id) : [...current, id];
    if (next.length === 0) return;
    onChange({ ...settings, maps: next.length === MAP_IDS.length ? [] : next });
  };
  const pick = (maxDiff: number, minDiff = 1) => onChange({ ...settings, maps: MAPS.filter((m) => m.difficulty >= minDiff && m.difficulty <= maxDiff).map((m) => m.id as MapId) });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[15px] font-extrabold">Strecken</div>
        <div className="flex gap-1.5 text-xs font-black">
          {(
            [
              ['Leicht', 1, 2],
              ['Mittel', 2, 4],
              ['Schwer', 4, 5],
              ['Alle', 1, 5],
            ] as const
          ).map(([label, min, max]) => (
            <button key={label} disabled={disabled} onClick={() => (label === 'Alle' ? onChange({ ...settings, maps: [] }) : pick(max, min))} className="rounded-full px-2.5 py-1 text-cyan-dark hover:bg-cyan/10 disabled:opacity-40">
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {MAPS.map((m) => (
          <Chip key={m.id} active={selected(m.id)} disabled={disabled} onClick={() => toggle(m.id as MapId)}>
            {m.name} <span className="opacity-70">{'★'.repeat(m.difficulty)}</span>
          </Chip>
        ))}
      </div>
      <p className="text-xs font-bold text-home-muted">
        {MAPS.filter((m) => selected(m.id))
          .map((m) => `${m.name}: ${DIFFICULTY_LABEL[m.difficulty]}`)
          .join(' · ')}
      </p>
    </div>
  );
}
