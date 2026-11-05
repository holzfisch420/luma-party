import { AnimatePresence, motion } from 'framer-motion';
import { Check, ListPlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { WORD_CATEGORIES, WORD_DIFFICULTIES, type WordEntry, type WordList } from '../../shared/types/words';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Controls';
import { Spinner } from '../ui/Feedback';
import { useToast } from '../ui/Toast';
import { parseBulkInput, useWordLists, wordApi } from './word-api';

const selectCls =
  'h-11 rounded-2xl border border-white/10 bg-white/[0.07] px-3 text-sm text-white outline-none focus:border-white/40 [&>option]:bg-ink-800';
const inputCls =
  'h-11 min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-white/40';

/**
 * Verwaltung eigener Wortlisten: Listen anlegen/umbenennen/löschen,
 * Wörter einzeln oder gesammelt hinzufügen, bearbeiten, löschen und Kategorien zuweisen.
 * Die Listen werden serverseitig dauerhaft gespeichert und stehen allen Räumen zur Verfügung.
 */
export function WordManager({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const { lists, error, setLists } = useWordLists(version);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<WordList | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setVersion((v) => v + 1);
    onChanged?.();
  };

  useEffect(() => {
    if (lists && !activeId && lists[0]) setActiveId(lists[0].id);
    if (lists && activeId && !lists.some((l) => l.id === activeId)) setActiveId(lists[0]?.id ?? null);
  }, [lists, activeId]);

  useEffect(() => {
    if (!activeId) return setActive(null);
    setLoading(true);
    wordApi
      .get(activeId)
      .then(setActive)
      .catch((e: Error) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [activeId, toast]);

  const createList = async () => {
    try {
      const list = await wordApi.create(`Meine Wörter ${(lists?.length ?? 0) + 1}`);
      const { words, ...rest } = list;
      setLists((prev) => [...(prev ?? []), { ...rest, wordCount: words.length }]);
      setActiveId(list.id);
      setActive(list);
      refresh();
      toast('Neue Wortliste erstellt.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const update = (list: WordList) => {
    setActive(list);
    setLists((prev) => prev?.map((l) => (l.id === list.id ? { ...l, name: list.name, wordCount: list.words.length } : l)) ?? prev);
    onChanged?.();
  };

  const removed = (id: string) => {
    const rest = (lists ?? []).filter((l) => l.id !== id);
    setLists(rest);
    setActiveId(rest[0]?.id ?? null);
    onChanged?.();
  };

  if (error) return <div className="rounded-2xl bg-rose-500/10 p-4 text-rose-200">Wortlisten konnten nicht geladen werden: {error}</div>;
  if (!lists) return <div className="grid h-40 place-items-center"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveId(l.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              l.id === activeId ? 'bg-white text-black' : 'bg-white/[0.07] text-white/75 hover:bg-white/15'
            }`}
          >
            {l.name}
            <span className={`rounded-full px-1.5 text-xs ${l.id === activeId ? 'bg-black/10' : 'bg-white/10'}`}>{l.wordCount}</span>
          </button>
        ))}
        <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={createList} className="shrink-0">
          Neue Liste
        </Button>
      </div>

      {lists.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <ListPlus className="size-10 text-white/40" />
          <div>
            <div className="text-lg font-semibold">Noch keine eigenen Wörter</div>
            <div className="text-sm text-white/50">Lege eine Liste an und füge eure Insider-Wörter hinzu.</div>
          </div>
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={createList}>
            Erste Wortliste erstellen
          </Button>
        </div>
      )}

      {loading && !active && <div className="grid h-24 place-items-center"><Spinner /></div>}
      {active && <ListEditor key={active.id} list={active} onUpdate={update} onDeleted={() => removed(active.id)} />}
    </div>
  );
}

function ListEditor({ list, onUpdate, onDeleted }: { list: WordList; onUpdate: (l: WordList) => void; onDeleted: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(list.name);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [word, setWord] = useState('');
  const [bulk, setBulk] = useState('');
  const [category, setCategory] = useState<string>('Sonstiges');
  const [difficulty, setDifficulty] = useState<string>('mittel');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const words = [...list.words].reverse();
    return q ? words.filter((w) => w.word.toLowerCase().includes(q) || w.category.toLowerCase().includes(q)) : words;
  }, [list.words, query]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const words = mode === 'single' ? (word.trim() ? [{ word: word.trim(), category, difficulty }] : []) : parseBulkInput(bulk, category).map((w) => ({ ...w, difficulty }));
    if (words.length === 0) return;
    void run(async () => {
      const res = await wordApi.addWords(list.id, words);
      onUpdate(res.list);
      setWord('');
      setBulk('');
      toast(
        res.skipped ? `${res.added} hinzugefügt, ${res.skipped} übersprungen (doppelt/leer).` : `${res.added} ${res.added === 1 ? 'Wort' : 'Wörter'} hinzugefügt.`,
        res.added ? 'success' : 'info',
      );
    });
  };

  const saveName = () => {
    if (name.trim() === list.name || !name.trim()) return setName(list.name);
    void run(async () => onUpdate(await wordApi.rename(list.id, name)));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          maxLength={40}
          aria-label="Name der Wortliste"
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none focus:underline decoration-white/30 underline-offset-4"
        />
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Liste wirklich löschen?</span>
            <Button size="sm" variant="danger" onClick={() => run(async () => { await wordApi.remove(list.id); onDeleted(); toast('Wortliste gelöscht.', 'success'); })}>
              Löschen
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
            Liste löschen
          </Button>
        )}
      </div>

      <form onSubmit={add} className="glass flex flex-col gap-3 rounded-3xl p-4">
        <Segmented
          layoutId="word-add-mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'single', label: 'Einzelnes Wort' },
            { value: 'bulk', label: 'Mehrere Wörter' },
          ]}
        />
        {mode === 'single' ? (
          <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={32} placeholder="z. B. Kühlschrank" className={inputCls} />
        ) : (
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={5}
            placeholder={'Ein Wort pro Zeile, z. B.\nKühlschrank\nRakete\nDinosaurier; Tiere\nSchneemann'}
            className="min-h-32 resize-y rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-[15px] outline-none placeholder:text-white/35 focus:border-white/40"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls} aria-label="Kategorie">
            {WORD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectCls} aria-label="Schwierigkeit">
            {WORD_DIFFICULTIES.map((d) => <option key={d} value={d}>{d[0]!.toUpperCase() + d.slice(1)}</option>)}
          </select>
          <Button type="submit" variant="primary" icon={<Plus className="size-4" />} loading={busy} className="ml-auto">
            Hinzufügen
          </Button>
        </div>
        {mode === 'bulk' && <p className="text-xs text-white/45">Tipp: „Wort; Kategorie“ weist eine eigene Kategorie zu. Doppelte Wörter werden übersprungen.</p>}
      </form>

      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-white/60">{list.words.length} Wörter</div>
        {list.words.length > 8 && (
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen …" className={`${inputCls} h-9 w-48 pl-9 text-sm`} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {filtered.map((w) => (
            <WordRow key={w.id} entry={w} listId={list.id} onUpdate={onUpdate} />
          ))}
        </AnimatePresence>
        {list.words.length === 0 && <div className="py-6 text-center text-sm text-white/40">Diese Liste ist noch leer.</div>}
      </div>
    </div>
  );
}

function WordRow({ entry, listId, onUpdate }: { entry: WordEntry; listId: string; onUpdate: (l: WordList) => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(entry.word);

  const patch = async (p: Partial<{ word: string; category: string; difficulty: string }>) => {
    try {
      onUpdate(await wordApi.updateWord(listId, entry.id, p));
      return true;
    } catch (e) {
      toast((e as Error).message, 'error');
      return false;
    }
  };

  const save = async () => {
    if (value.trim() && value.trim() !== entry.word) {
      if (!(await patch({ word: value }))) return;
    } else setValue(entry.word);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 rounded-2xl bg-white/[0.04] px-3 py-2"
    >
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') { setValue(entry.word); setEditing(false); }
          }}
          maxLength={32}
          className={`${inputCls} h-9 flex-1`}
        />
      ) : (
        <button className="min-w-0 flex-1 truncate text-left font-medium" onClick={() => setEditing(true)} title="Bearbeiten">
          {entry.word}
        </button>
      )}
      <select value={entry.category} onChange={(e) => void patch({ category: e.target.value })} className={`${selectCls} h-9 text-xs`} aria-label="Kategorie">
        {WORD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={entry.difficulty} onChange={(e) => void patch({ difficulty: e.target.value })} className={`${selectCls} hidden h-9 text-xs sm:block`} aria-label="Schwierigkeit">
        {WORD_DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      {editing ? (
        <>
          <button onClick={() => void save()} className="grid size-9 place-items-center rounded-xl bg-white text-black" aria-label="Speichern"><Check className="size-4" /></button>
          <button onClick={() => { setValue(entry.word); setEditing(false); }} className="grid size-9 place-items-center rounded-xl bg-white/10" aria-label="Abbrechen"><X className="size-4" /></button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="grid size-9 place-items-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white" aria-label={`${entry.word} bearbeiten`}><Pencil className="size-4" /></button>
          <button
            onClick={async () => {
              try { onUpdate(await wordApi.removeWord(listId, entry.id)); } catch (e) { toast((e as Error).message, 'error'); }
            }}
            className="grid size-9 place-items-center rounded-xl text-white/50 hover:bg-rose-500/20 hover:text-rose-200"
            aria-label={`${entry.word} löschen`}
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    </motion.div>
  );
}
