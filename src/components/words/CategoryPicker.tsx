import { Chip } from '../ui/Controls';
import { WORD_CATEGORIES, WORD_DIFFICULTIES, type WordCategory, type WordDifficulty } from '../../shared/types/words';
import type { SettingsPanelProps } from '../../games/game-types';
import { DEFAULT_WORDS } from '../../games/montagsmaler/words/default-words';

export interface WordFilterSettings {
  categories: WordCategory[];
  difficulties: WordDifficulty[];
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const DIFF_LABEL: Record<WordDifficulty, string> = { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' };

/** Kategorien und Schwierigkeit aus dem gemeinsamen Wörterpool – für alle Wort-Spiele */
export function CategoryPicker<S extends WordFilterSettings>({ settings, onChange, disabled, tone = 'home' }: SettingsPanelProps<S> & { tone?: 'home' | 'dark' }) {
  const set = (patch: Partial<WordFilterSettings>) => onChange({ ...settings, ...patch });
  const all = settings.categories.length === WORD_CATEGORIES.length;
  const count = (c: WordCategory) => DEFAULT_WORDS.filter((w) => w.category === c && settings.difficulties.includes(w.difficulty)).length;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-[15px] font-extrabold">Kategorien</div>
          <button
            className={`text-xs font-black disabled:opacity-40 ${tone === 'dark' ? 'text-violet-300 hover:text-violet-200' : 'text-cyan-dark hover:text-cyan'}`}
            disabled={disabled}
            onClick={() => set({ categories: all ? [WORD_CATEGORIES[0]] : [...WORD_CATEGORIES] })}
          >
            {all ? 'Nur eine' : 'Alle'}
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
              {c} <span className="opacity-50">{count(c)}</span>
            </Chip>
          ))}
        </div>
      </div>
      <div>
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
              {DIFF_LABEL[d]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
