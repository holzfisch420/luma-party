import { ArrowLeft, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Feedback';
import { useToast } from '../../../components/ui/Toast';
import { countLines, statementApi, type StatementListSummary } from '../statement-api';

interface Draft {
  id: string | null;
  name: string;
  text: string;
}

/** Eigene Satz-Sammlungen anlegen, bearbeiten, löschen (eine Zeile pro Satz, BLUBB = Lücke). */
export function StatementManager({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [lists, setLists] = useState<StatementListSummary[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    statementApi
      .list()
      .then(setLists)
      .catch((e: Error) => {
        setLists([]);
        toast(e.message, 'error');
      });
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edit = async (id: string) => {
    setBusy(true);
    try {
      const l = await statementApi.get(id);
      setDraft({ id: l.id, name: l.name, text: l.statements.map((s) => s.replace(/___/g, 'BLUBB')).join('\n') });
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const lines = draft.text.split('\n');
      const res = draft.id ? await statementApi.update(draft.id, draft.name, lines) : await statementApi.create(draft.name, lines);
      toast(`${res.list.statements.length} ${res.list.statements.length === 1 ? 'Satz' : 'Sätze'} gespeichert${res.invalid ? ` · ${res.invalid} ohne BLUBB übersprungen` : ''}.`, 'success');
      setDraft(null);
      await reload();
      onChanged?.();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (l: StatementListSummary) => {
    if (!window.confirm(`„${l.name}“ wirklich löschen?`)) return;
    try {
      await statementApi.remove(l.id);
      await reload();
      onChanged?.();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  if (draft) {
    const { valid, invalid } = countLines(draft.text);
    return (
      <div className="flex flex-col gap-3">
        <button onClick={() => setDraft(null)} className="flex items-center gap-1.5 self-start text-sm font-extrabold text-home-muted hover:text-home-text">
          <ArrowLeft className="size-4" /> Zurück zur Übersicht
        </button>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Name der Sammlung</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={60} placeholder="z. B. Unsere Sätze" className="home-input font-bold" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Sätze – einer pro Zeile</span>
          <textarea
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            rows={12}
            placeholder={'Mein heimliches Talent ist BLUBB.\nMein LieblingsBLUBB ist der BLUBB.\nAuf eine einsame Insel würde ich BLUBB mitnehmen.'}
            className="home-input min-h-56 resize-y font-semibold leading-relaxed"
          />
        </label>
        <p className="text-sm font-bold text-home-muted">
          <strong className="text-home-text">BLUBB</strong> markiert die Lücke – auch mehrmals oder mitten im Wort. Die Antwort steht dann an jeder Stelle.
          <br />
          {valid} {valid === 1 ? 'Satz' : 'Sätze'}
          {invalid > 0 && <span className="text-rose-500"> · {invalid} ohne BLUBB (werden übersprungen)</span>}
        </p>
        <Button variant="primary" size="lg" icon={<Save className="size-5" />} loading={busy} disabled={!draft.name.trim() || valid === 0} onClick={() => void save()}>
          Speichern
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-home-muted">Eigene Sätze werden privat gespeichert – mit Konto auf allen deinen Geräten, sonst auf diesem Gerät.</p>
      {lists === null ? (
        <div className="grid h-24 place-items-center">
          <Spinner />
        </div>
      ) : lists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-home-line px-4 py-6 text-center font-bold text-home-muted">Noch keine eigene Sammlung.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lists.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-home-line bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{l.name}</div>
                <div className="text-xs font-bold text-home-muted">{l.count} {l.count === 1 ? 'Satz' : 'Sätze'}</div>
              </div>
              <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => void edit(l.id)} disabled={busy}>
                Bearbeiten
              </Button>
              <Button size="sm" variant="ghost" icon={<Trash2 className="size-4 text-rose-500" />} onClick={() => void remove(l)} aria-label={`${l.name} löschen`} />
            </div>
          ))}
        </div>
      )}
      <Button variant="primary" icon={<Plus className="size-5" />} onClick={() => setDraft({ id: null, name: '', text: '' })}>
        Neue Sammlung
      </Button>
    </div>
  );
}
