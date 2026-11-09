import { Chip, SettingRow, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { RacerSettings } from '../game-config';
import { DIFFICULTY_LABEL, TRACK_IDS, TRACKS } from '../tracks';

type TrackId = (typeof TRACK_IDS)[number];

/** Strecken + Ansicht – im Startbildschirm (TV oder Handy des Spielleiters) */
export function RacerQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<RacerSettings>) {
  const all = settings.tracks.length === 0;
  const selected = (id: string) => all || (settings.tracks as string[]).includes(id);
  const toggle = (id: TrackId) => {
    const current: TrackId[] = all ? [...TRACK_IDS] : [...settings.tracks];
    const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
    if (!next.length) return;
    onChange({ ...settings, tracks: next.length === TRACK_IDS.length ? [] : next });
  };
  const only = (id: TrackId) => onChange({ ...settings, tracks: [id] });
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[15px] font-extrabold">Strecken</div>
          <button disabled={disabled} onClick={() => onChange({ ...settings, tracks: [] })} className="text-xs font-black text-cyan-dark disabled:opacity-40">
            Alle
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <Chip key={t.id} active={selected(t.id)} disabled={disabled} onClick={() => toggle(t.id as TrackId)}>
              {t.name} <span className="opacity-70">{'★'.repeat(t.difficulty)}</span>
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs font-bold text-home-muted">
          Antippen wählt ab/an ·{' '}
          {TRACKS.filter((t) => selected(t.id))
            .map((t) => `${t.name} (${DIFFICULTY_LABEL[t.difficulty]})`)
            .join(', ')}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRACKS.map((t) => (
            <button key={t.id} disabled={disabled} onClick={() => only(t.id as TrackId)} className="rounded-full border border-home-line px-2.5 py-0.5 text-[11px] font-black text-home-muted hover:text-home-text disabled:opacity-40">
              nur {t.name}
            </button>
          ))}
        </div>
      </div>
      <SettingRow label="Splitscreen" hint="Jede Person bekommt ihre eigene Ansicht – aus: eine gemeinsame Kamera (schneller)">
        <Toggle checked={settings.view === 'split'} onChange={(on) => onChange({ ...settings, view: on ? 'split' : 'shared' })} disabled={disabled} label="Splitscreen" />
      </SettingRow>
    </div>
  );
}
