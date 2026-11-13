import { FileUp, Trash2, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { SectionTitle } from '../../../components/ui/Controls';
import { Spinner } from '../../../components/ui/Feedback';
import { useToast } from '../../../components/ui/Toast';
import type { SettingsPanelProps } from '../../game-types';
import type { TheaterSettings } from '../game-config';
import type { ParseResult } from '../logic/docx-parser';
import { scriptApi } from '../script-api';
import type { ScriptSummary } from '../types';

/** Skript hochladen (.docx), prüfen, auswählen, löschen. */
export function TheaterSettingsPanel({ settings, onChange, disabled }: SettingsPanelProps<TheaterSettings>) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scripts, setScripts] = useState<ScriptSummary[] | null>(null);
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const reload = () =>
    scriptApi
      .list()
      .then(setScripts)
      .catch((e: Error) => toast(e.message, 'error'));
  useEffect(() => {
    void reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (file: File) => {
    try {
      // Word-Leser erst laden, wenn wirklich eine Datei kommt
      const { parseDocx } = await import('../logic/docx-parser');
      const result = parseDocx(new Uint8Array(await file.arrayBuffer()), file.name);
      if (result.lines.length === 0) throw new Error('In dieser Datei wurden keine Szenen oder Dialoge gefunden.');
      setPreview(result);
    } catch (e) {
      toast((e as Error).message || 'Die Datei konnte nicht gelesen werden.', 'error');
    }
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const { merged: _merged, ...upload } = preview;
      const script = await scriptApi.create(upload);
      onChange({ ...settings, scriptId: script.id });
      setPreview(null);
      toast('Skript gespeichert und ausgewählt.', 'success');
      await reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionTitle>Skript</SectionTitle>
      <p className="mb-4 text-sm font-semibold text-home-muted">
        Lade dein Theaterskript als Word-Datei hoch. Erkannt werden „Szene 1: Titel“, „Figuren: …“, Regieanweisungen in Klammern und Zeilen wie „Name: Text“. Seiten
        entsprechen dem Word-Dokument. Das Skript bleibt privat auf deinem Server.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = '';
        }}
      />
      {!preview && (
        <Button variant="primary" icon={<FileUp className="size-5" />} disabled={disabled} onClick={() => fileRef.current?.click()}>
          Skript hochladen (.docx)
        </Button>
      )}

      {preview && (
        <div className="rounded-3xl border-2 border-cyan bg-cyan/5 p-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Titel</span>
            <input value={preview.title} onChange={(e) => setPreview({ ...preview, title: e.target.value.slice(0, 120) })} className="home-input mt-1 w-full font-bold" />
          </label>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              ['Szenen', preview.scenes.length],
              ['Seiten', preview.pageCount],
              ['Zeilen', preview.lines.length],
              ['Rollen', preview.characters.length],
            ].map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-white p-2 shadow-sm">
                <div className="text-2xl font-black">{n}</div>
                <div className="text-xs font-bold text-home-muted">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm font-semibold">
            <span className="font-black">Szenen: </span>
            {preview.scenes.map((s) => `${s.number}${s.title ? ` ${s.title}` : ''} (S. ${s.page})`).join(' · ')}
          </div>
          <div className="mt-2 text-sm font-semibold">
            <span className="font-black">Rollen: </span>
            {preview.characters.join(', ')}
          </div>
          {Object.keys(preview.merged).length > 0 && (
            <div className="mt-2 text-sm font-semibold text-home-muted">
              <span className="font-black text-home-text">Schreibweisen korrigiert: </span>
              {Object.entries(preview.merged)
                .map(([a, b]) => `${a} → ${b}`)
                .join(', ')}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="primary" icon={<Check className="size-5" />} loading={saving} onClick={() => void save()}>
              Speichern &amp; auswählen
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Verwerfen
            </Button>
          </div>
        </div>
      )}

      <SectionTitle>Gespeicherte Skripte</SectionTitle>
      {!scripts && (
        <div className="grid h-16 place-items-center">
          <Spinner />
        </div>
      )}
      {scripts?.length === 0 && <p className="text-sm font-bold text-home-muted">Noch keine Skripte – lade oben eins hoch.</p>}
      <div className="flex flex-col gap-2">
        {scripts?.map((s) => {
          const active = s.id === settings.scriptId;
          return (
            <div key={s.id} className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-2.5 ${active ? 'border-cyan shadow' : 'border-home-line'}`}>
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" disabled={disabled} onClick={() => onChange({ ...settings, scriptId: s.id })}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-cyan bg-cyan text-white' : 'border-home-line'}`}>{active && <Check className="size-4" strokeWidth={3} />}</span>
                <span className="min-w-0">
                  <span className="block truncate font-black">{s.title}</span>
                  <span className="block text-xs font-bold text-home-muted">
                    {s.sceneCount} Szenen · {s.pageCount} Seiten · {s.characters.length} Rollen
                  </span>
                </span>
              </button>
              {confirmDelete === s.id ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    await scriptApi.remove(s.id).catch((e: Error) => toast(e.message, 'error'));
                    if (active) onChange({ ...settings, scriptId: '' });
                    setConfirmDelete(null);
                    void reload();
                  }}
                >
                  Löschen?
                </Button>
              ) : (
                <button className="grid size-9 place-items-center rounded-xl text-home-muted hover:bg-rose-50 hover:text-rose-500" aria-label={`${s.title} löschen`} onClick={() => setConfirmDelete(s.id)}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
