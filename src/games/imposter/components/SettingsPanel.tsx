import { CategoryPicker } from '../../../components/words/CategoryPicker';
import { SectionTitle, SettingRow, Stepper, Toggle } from '../../../components/ui/Controls';
import type { SettingsPanelProps } from '../../game-types';
import type { ImposterSettings } from '../game-config';

export function ImposterSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<ImposterSettings>) {
  const set = (patch: Partial<ImposterSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spielablauf</SectionTitle>
        <SettingRow label="Runden" hint="Jede Runde: neues Wort, neuer Imposter">
          <Stepper value={settings.rounds} min={1} max={10} onChange={(rounds) => set({ rounds })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Hinweisrunden" hint="So oft sagt jede Person ein Wort">
          <Stepper value={settings.clueRounds} min={1} max={3} onChange={(clueRounds) => set({ clueRounds })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Diskussionszeit">
          <Stepper value={settings.discussSeconds} min={20} max={300} step={10} onChange={(discussSeconds) => set({ discussSeconds })} disabled={disabled} format={(v) => `${v} s`} />
        </SettingRow>
        <SettingRow label="Kategorie verraten" hint="Alle – auch der Imposter – sehen die Kategorie">
          <Toggle checked={settings.showCategory} onChange={(showCategory) => set({ showCategory })} disabled={disabled} label="Kategorie verraten" />
        </SettingRow>
      </div>
      <div className="py-3">
        <SectionTitle>Wörter</SectionTitle>
        <div className="py-2">
          <CategoryPicker settings={settings} onChange={onChange} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
