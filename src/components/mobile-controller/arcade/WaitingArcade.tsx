import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ui } from '../../../app/audio/sfx';
import { Flap } from './Flap';
import { Mines } from './Mines';
import { getBest, type ArcadeGame } from './scores';
import { Snake } from './Snake';

const TABS: { id: ArcadeGame; label: string; emoji: string; color: string }[] = [
  { id: 'flap', label: 'Flatterflug', emoji: '🐤', color: 'from-[#ff9a5a] to-[#d7517a]' },
  { id: 'snake', label: 'Schlange', emoji: '🐍', color: 'from-[#5ad17a] to-[#1f7a4d]' },
  { id: 'mines', label: 'Minensuche', emoji: '💣', color: 'from-[#7c8db5] to-[#3a4566]' },
];
const KEY = 'luma.arcade.tab';

const bestLabel = (id: ArcadeGame) => {
  const b = getBest(id);
  if (!b) return 'noch kein Rekord';
  return id === 'mines' ? `Rekord ${b} s` : `Rekord ${b}`;
};

/**
 * Kleine Spielhalle zum Zeitvertreib, solange noch gewählt wird.
 * In der Lobby nur eine Karte – gespielt wird im Vollbild, in dem nichts scrollt oder zoomt.
 */
export function WaitingArcade({ status, backLabel = 'Zurück' }: { status?: string; backLabel?: string }) {
  const [open, setOpen] = useState<ArcadeGame | null>(null);
  const start = (id: ArcadeGame) => {
    ui.open();
    setOpen(id);
  };
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => start(t.id)}
            className={`flex flex-col items-center gap-1 rounded-[22px] bg-gradient-to-b ${t.color} px-2 pb-2.5 pt-3 text-white shadow-[0_8px_18px_-8px_rgba(30,20,60,0.6)] transition active:scale-95`}
          >
            <span className="text-4xl leading-none drop-shadow">{t.emoji}</span>
            <span className="text-sm font-black">{t.label}</span>
            <span className="text-[10px] font-bold text-white/75">{bestLabel(t.id)}</span>
          </button>
        ))}
      </div>
      {open && createPortal(<ArcadeOverlay initial={open} status={status} backLabel={backLabel} onClose={() => setOpen(null)} />, document.body)}
    </>
  );
}

function ArcadeOverlay({ initial, status, backLabel, onClose }: { initial: ArcadeGame; status?: string; backLabel: string; onClose: () => void }) {
  const [tab, setTab] = useState<ArcadeGame>(initial);

  // Seite festhalten: kein Scrollen, kein Zoomen, kein Ziehen
  useEffect(() => {
    const html = document.documentElement;
    const prev = { body: document.body.style.overflow, html: html.style.overflow };
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', block);
    document.addEventListener('gesturechange', block);
    document.addEventListener('touchmove', block, { passive: false });
    // Doppeltipp-Zoom auf iOS verhindern
    let lastTouch = 0;
    const dbl = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouch < 350) e.preventDefault();
      lastTouch = now;
    };
    document.addEventListener('touchend', dbl, { passive: false });
    return () => {
      document.body.style.overflow = prev.body;
      html.style.overflow = prev.html;
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('gesturechange', block);
      document.removeEventListener('touchmove', block);
      document.removeEventListener('touchend', dbl);
    };
  }, []);

  const pick = (id: ArcadeGame) => {
    if (id === tab) return;
    ui.toggle();
    setTab(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignorieren */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex touch-none select-none flex-col overflow-hidden overscroll-none bg-gradient-to-b from-[#241b3d] to-[#120d22] px-3 text-white safe-pt safe-pb"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex shrink-0 items-center gap-2 pt-2">
        <div className="flex flex-1 gap-1 rounded-2xl bg-black/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex flex-1 flex-col items-center rounded-xl py-1.5 text-[11px] font-black transition-colors ${tab === t.id ? 'bg-white text-[#241b3d] shadow' : 'text-white/70'}`}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            ui.close();
            onClose();
          }}
          aria-label={backLabel}
          className="flex h-[52px] shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 px-3 text-[10px] font-black active:bg-white/30"
        >
          <X className="size-5" />
          {backLabel}
        </button>
      </div>
      {status && <div className="shrink-0 truncate pt-2 text-center text-xs font-bold text-white/60">{status}</div>}
      <div className="min-h-0 flex-1 py-3">
        {tab === 'flap' && <Flap />}
        {tab === 'snake' && <Snake />}
        {tab === 'mines' && <Mines />}
      </div>
    </div>
  );
}
