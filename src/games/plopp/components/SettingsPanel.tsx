import { Chip, SectionTitle, Segmented, SettingRow, Stepper, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import { FUSE_RANGES, FUSES, type PloppSettings } from '../game-config';
import { PROMPT_COUNTS } from '../prompt-counts';
import { PACK_LABELS, PROMPT_PACKS, type PromptPack } from '../prompt-types';

const COUNTS: Record<string, number> = PROMPT_COUNTS;

/** Kategorien + Leben – auch im Startbildschirm */
export function PloppQuickSettings({ settings, onChange, disabled }: SettingsPanelProps<PloppSettings>) {
  const set = (patch: Partial<PloppSettings>) => onChange({ ...settings, ...patch });
  const toggle = (pack: PromptPack) => {
    const next = settings.packs.includes(pack) ? settings.packs.filter((p) => p !== pack) : [...settings.packs, pack];
    if (next.length) set({ packs: next });
  };
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-2 text-[15px] font-extrabold">Kategorien</div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_PACKS.map((p) => (
            <Chip key={p} active={settings.packs.includes(p)} disabled={disabled} onClick={() => toggle(p)}>
              {PACK_LABELS[p].emoji} {PACK_LABELS[p].label} <span className="opacity-60">{COUNTS[p] ?? 0}</span>
            </Chip>
          ))}
        </div>
      </div>
      <SettingRow label="Leben" hint="So oft darf der Fisch bei dir platzen">
        <Stepper value={settings.lives} min={1} max={3} onChange={(lives) => set({ lives })} disabled={disabled} />
      </SettingRow>
    </div>
  );
}

export function PloppSettingsPanel(props: SettingsPanelProps<PloppSettings>) {
  const { settings, onChange, disabled } = props;
  const set = (patch: Partial<PloppSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spielablauf</SectionTitle>
        <SettingRow label="Zündschnur" hint="Wie lange es ungefähr dauert, bis der Fisch platzt – genau weiß es niemand">
          <Segmented layoutId="plopp-fuse" value={settings.fuse} options={FUSES.map((f) => ({ value: f, label: FUSE_RANGES[f].label.split(' ')[0] }))} onChange={(fuse) => set({ fuse })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Buchstaben-Aufgaben" hint="Zum Beispiel „Ein Tier mit B“">
          <Toggle checked={settings.letters} onChange={(letters) => set({ letters })} disabled={disabled} label="Buchstaben-Aufgaben" />
        </SettingRow>
        <SettingRow label="Unbekannte Antworten abstimmen" hint="Kennt das Spiel eine Antwort nicht, entscheiden die anderen per Daumen – sonst wird sie abgelehnt">
          <Toggle checked={settings.vote} onChange={(vote) => set({ vote })} disabled={disabled} label="Abstimmung" />
        </SettingRow>
      </div>
      <div className="pt-3">
        <PloppQuickSettings {...props} />
      </div>
    </div>
  );
}
