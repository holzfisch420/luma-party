import { ChevronDown, ChevronUp, Eye, EyeOff, Settings2, Square } from 'lucide-react';
import { useState } from 'react';
import { haptics } from '../../../../app/haptics';
import { getSocket } from '../../../../app/session/socket';
import type { PlayerViewProps } from '../../../game-types';
import { HIDE_LABEL, lineText, sceneOf, speaks } from '../../logic/view';
import { useScript } from '../../script-cache';
import type { HideMode, TheaterPublicState } from '../../types';

const NEXT_HIDE: Record<HideMode, HideMode> = { none: 'prev', prev: 'next', next: 'both', both: 'none' };

/** Handy: Zeile für Zeile blättern, Szene/Seite wählen, Nachbarzeilen ausblenden. */
export function TheaterController({ room, me, state, sendAction }: PlayerViewProps<TheaterPublicState, null>) {
  const pub = state.public;
  const script = useScript(pub.scriptId);
  const [more, setMore] = useState(false);
  const canEnd = room.controllerId === me.id && !room.hostHasControl;

  if (!script) {
    return <div className="stage grid h-dvh place-items-center font-stage text-2xl text-[#c9973b]">Skript wird geladen …</div>;
  }

  const line = script.lines[pub.index]!;
  const scene = sceneOf(script, pub.index);
  const pages = Array.from({ length: script.pageCount }, (_, i) => i + 1);
  const atStart = pub.index === 0;
  const atEnd = pub.index === script.lines.length - 1;
  const move = (delta: 1 | -1) => {
    haptics.play('medium');
    sendAction('move', { delta });
  };
  const selectCls = 'h-12 w-full appearance-none rounded-2xl border border-[#c9973b]/30 bg-black/30 px-3 text-base font-semibold text-[#f3dfb8] outline-none focus:border-[#c9973b]';

  return (
    <div className="stage flex h-dvh flex-col gap-3 overflow-hidden px-4 pb-4 safe-pt safe-pb">
      {/* Szene & Seite */}
      <div className="flex items-center gap-2 pt-1">
        <div className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.25em] text-[#c9973b]/80">{script.title}</div>
        <button onClick={() => setMore((m) => !m)} className="grid size-9 place-items-center rounded-full text-[#f3dfb8]/80" aria-label="Mehr Optionen" aria-expanded={more}>
          <Settings2 className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="min-w-0">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3dfb8]/50">Szene</span>
          <select value={scene?.number ?? ''} onChange={(e) => sendAction('scene', { number: Number(e.target.value) })} className={selectCls} aria-label="Szene wählen">
            {script.scenes.map((s) => (
              <option key={s.number} value={s.number} className="bg-[#1d1013]">
                {s.number}
                {s.title ? ` · ${s.title}` : ''} (S. {s.page})
              </option>
            ))}
          </select>
        </label>
        <label className="w-24">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3dfb8]/50">Seite</span>
          <select value={line.page} onChange={(e) => sendAction('page', { page: Number(e.target.value) })} className={selectCls} aria-label="Seite wählen">
            {pages.map((p) => (
              <option key={p} value={p} className="bg-[#1d1013]">
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* aktuelle Zeile (kurz) */}
      <div className={`rounded-2xl border px-4 py-2.5 ${speaks(line, pub.focus) ? 'border-[#c9973b] bg-[#c9973b]/15' : 'border-white/10 bg-white/5'}`}>
        <div className="font-stage text-sm font-extrabold uppercase tracking-[0.12em] text-[#e9b85b]">{line.character ?? (line.kind === 'cast' ? 'Figuren' : 'Regieanweisung')}</div>
        <div className="line-clamp-2 text-sm text-[#fbf5ec]/80">{lineText(line)}</div>
      </div>

      {/* große Tasten */}
      <button
        onClick={() => move(-1)}
        disabled={atStart}
        className="flex min-h-0 flex-[2] flex-col items-center justify-center rounded-3xl bg-white/10 text-[#f3dfb8] shadow-[0_5px_0_rgba(0,0,0,0.35)] transition active:translate-y-1 active:shadow-none disabled:opacity-30"
        aria-label="Nach oben – vorherige Zeile"
      >
        <ChevronUp className="size-14" strokeWidth={2.5} />
        <span className="text-lg font-bold">Nach oben</span>
      </button>
      <button
        onClick={() => {
          haptics.play('light');
          sendAction('hide', { mode: NEXT_HIDE[pub.hide] });
        }}
        className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5 text-base font-bold transition ${pub.hide === 'none' ? 'bg-white/10 text-[#f3dfb8]' : 'bg-[#c9973b] text-[#1d1013]'}`}
        aria-label={`Ausblenden: ${HIDE_LABEL[pub.hide]} – tippen zum Wechseln`}
      >
        {pub.hide === 'none' ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        {HIDE_LABEL[pub.hide]}
        <span className="flex gap-1" aria-hidden>
          {(['prev', 'next'] as const).map((k) => (
            <span key={k} className={`h-2.5 w-6 rounded-full ${pub.hide === k || pub.hide === 'both' ? 'bg-[#1d1013]' : pub.hide === 'none' ? 'bg-white/25' : 'bg-[#1d1013]/25'}`} />
          ))}
        </span>
      </button>
      <button
        onClick={() => move(1)}
        disabled={atEnd}
        className="flex min-h-0 flex-[3] flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-[#a32638] to-[#7a1022] text-white shadow-[0_6px_0_#4a0812] transition active:translate-y-1 active:shadow-none disabled:opacity-30"
        aria-label="Nach unten – nächste Zeile"
      >
        <span className="text-lg font-bold">Nach unten</span>
        <ChevronDown className="size-16" strokeWidth={2.5} />
      </button>
      {more && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/60 p-3 safe-pb" onClick={() => setMore(false)}>
        <div className="flex max-h-[85dvh] w-full flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-[#1d1013] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <span className="font-stage text-xl font-extrabold text-[#f3dfb8]">Optionen</span>
            <button onClick={() => setMore(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">Fertig</button>
          </div>
          <button
            onClick={() => sendAction('skipDirections', { on: !pub.skipDirections })}
            className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-left font-semibold"
          >
            Regieanweisungen überspringen
            <span className={`relative h-6 w-11 rounded-full transition ${pub.skipDirections ? 'bg-[#c9973b]' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${pub.skipDirections ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </button>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f3dfb8]/50">Meine Rolle(n) hervorheben</div>
            <div className="flex flex-wrap gap-1.5">
              {script.characters.map((c) => {
                const on = pub.focus.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => sendAction('focus', { characters: on ? pub.focus.filter((x) => x !== c) : [...pub.focus, c] })}
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${on ? 'border-[#c9973b] bg-[#c9973b] text-[#1d1013]' : 'border-white/15 text-[#f3dfb8]/80'}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          {canEnd && (
            <button onClick={() => getSocket().emit('room:backToLauncher')} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 font-semibold">
              <Square className="size-4" /> Probe beenden
            </button>
          )}
        </div>
        </div>
      )}

    </div>
  );
}
