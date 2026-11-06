import { BookOpen, Library } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Chip, SectionTitle, Segmented, SettingRow, Stepper, Toggle } from '../../../components/ui/Controls';
import { Modal } from '../../../components/ui/Modal';
import { WordManager } from '../../../components/word-manager/WordManager';
import { useWordLists } from '../../../components/word-manager/word-api';
import { WORD_CATEGORIES, WORD_DIFFICULTIES, type WordCategory, type WordDifficulty } from '../../../shared/types/words';
import type { SettingsPanelProps } from '../../game-types';
import { DEFAULT_SCORING, WORD_MODE_LABELS, WORD_MODES, type MontagsmalerSettings } from '../game-config';
import { DEFAULT_WORDS } from '../words/default-words';

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function MontagsmalerSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<MontagsmalerSettings>) {
  const [version, setVersion] = useState(0);
  const { lists } = useWordLists(version);
  const [managerOpen, setManagerOpen] = useState(false);
  const set = (patch: Partial<MontagsmalerSettings>) => onChange({ ...settings, ...patch });
  const usesCustom = settings.wordMode !== 'standard';

  // Anzahl verfügbarer Standardwörter mit aktuellen Filtern
  const standardCount =
    settings.wordMode === 'custom'
      ? 0
      : DEFAULT_WORDS.filter((w) => settings.categories.includes(w.category) && settings.difficulties.includes(w.difficulty)).length;
  const customCount = usesCustom ? (lists ?? []).filter((l) => settings.customListIds.includes(l.id)).reduce((n, l) => n + l.wordCount, 0) : 0;

  return (
    <div className="divide-y divide-home-line/70">
      <div className="pb-2">
        <SectionTitle>Spielablauf</SectionTitle>
        <SettingRow label="Runden" hint="Jede Person zeichnet einmal pro Runde">
          <Stepper value={settings.rounds} min={1} max={10} onChange={(rounds) => set({ rounds })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Zeichenzeit">
          <Stepper value={settings.drawTimeSeconds} min={30} max={240} step={10} onChange={(drawTimeSeconds) => set({ drawTimeSeconds })} disabled={disabled} format={(v) => `${v} s`} />
        </SettingRow>
        <SettingRow label="Wortauswahl" hint="Zeichner wählt aus mehreren Wörtern">
          <Segmented
            layoutId="mm-choices"
            value={settings.wordChoices}
            onChange={(wordChoices) => set({ wordChoices })}
            disabled={disabled}
            options={[
              { value: 1, label: 'Zufall' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Buchstaben-Hinweise" hint="Im Laufe der Zeit werden Buchstaben aufgedeckt">
          <Toggle checked={settings.hints} onChange={(hints) => set({ hints })} disabled={disabled} label="Hinweise" />
        </SettingRow>
        <SettingRow label="Kategorie anzeigen">
          <Toggle checked={settings.showCategory} onChange={(showCategory) => set({ showCategory })} disabled={disabled} label="Kategorie anzeigen" />
        </SettingRow>
      </div>

      <div className="py-2">
        <SectionTitle>Wörter</SectionTitle>
        <div className="py-3">
          <Segmented
            layoutId="mm-wordmode"
            value={settings.wordMode}
            onChange={(wordMode) => set({ wordMode })}
            disabled={disabled}
            options={WORD_MODES.map((m) => ({ value: m, label: WORD_MODE_LABELS[m].label }))}
          />
          <p className="mt-2 text-xs font-bold text-home-muted">
            {WORD_MODE_LABELS[settings.wordMode].hint} · verfügbar: <strong className="text-home-text">{standardCount + customCount}</strong> Wörter
          </p>
        </div>

        {usesCustom && (
          <div className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[15px] font-extrabold">Eigene Wortlisten</div>
              <Button size="sm" variant="ghost" icon={<Library className="size-4" />} onClick={() => setManagerOpen(true)}>
                Verwalten
              </Button>
            </div>
            {lists && lists.length === 0 && <p className="text-sm font-bold text-home-muted">Noch keine Listen – lege über „Verwalten“ eine an.</p>}
            <div className="flex flex-wrap gap-2">
              {(lists ?? []).map((l) => (
                <Chip key={l.id} active={settings.customListIds.includes(l.id)} disabled={disabled} onClick={() => set({ customListIds: toggleIn(settings.customListIds, l.id) })}>
                  {l.name} · {l.wordCount}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[15px] font-extrabold">Kategorien</div>
            <button
              className="text-xs font-black text-cyan-dark hover:text-cyan disabled:opacity-40"
              disabled={disabled}
              onClick={() => set({ categories: settings.categories.length === WORD_CATEGORIES.length ? [WORD_CATEGORIES[0]] : [...WORD_CATEGORIES] })}
            >
              {settings.categories.length === WORD_CATEGORIES.length ? 'Nur eine' : 'Alle'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {WORD_CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={settings.categories.includes(c)}
                disabled={disabled}
                onClick={() => {
                  const next = toggleIn<WordCategory>(settings.categories, c);
                  if (next.length) set({ categories: next });
                }}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>
        <div className="py-3">
          <div className="mb-2 text-[15px] font-extrabold">Schwierigkeit</div>
          <div className="flex flex-wrap gap-2">
            {WORD_DIFFICULTIES.map((d) => (
              <Chip
                key={d}
                active={settings.difficulties.includes(d)}
                disabled={disabled}
                onClick={() => {
                  const next = toggleIn<WordDifficulty>(settings.difficulties, d);
                  if (next.length) set({ difficulties: next });
                }}
              >
                {d[0]!.toUpperCase() + d.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <SectionTitle>Punkte</SectionTitle>
        <SettingRow label="Erster richtiger Rater" hint={`Jeder weitere erhält ${settings.scoring.pointsDecrement} weniger (min. ${settings.scoring.minGuessPoints})`}>
          <Stepper value={settings.scoring.firstGuessPoints} min={50} max={500} step={10} onChange={(v) => set({ scoring: { ...settings.scoring, firstGuessPoints: v } })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Zeichner pro Treffer">
          <Stepper value={settings.scoring.drawerPointsPerGuess} min={0} max={200} step={5} onChange={(v) => set({ scoring: { ...settings.scoring, drawerPointsPerGuess: v } })} disabled={disabled} />
        </SettingRow>
        <SettingRow label="Zeitbonus" hint="Bis zu +50 Punkte für schnelle Antworten">
          <Toggle
            checked={settings.scoring.timeBonusMax > 0}
            onChange={(on) => set({ scoring: { ...settings.scoring, timeBonusMax: on ? DEFAULT_SCORING.timeBonusMax : 0 } })}
            disabled={disabled}
            label="Zeitbonus"
          />
        </SettingRow>
      </div>

      <Modal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title={<span className="flex items-center gap-2"><BookOpen className="size-6" /> Eigene Wörter</span>}
        subtitle="Listen werden dauerhaft auf dem Server gespeichert."
        width="max-w-3xl"
      >
        <WordManager onChanged={() => setVersion((v) => v + 1)} />
      </Modal>
    </div>
  );
}
