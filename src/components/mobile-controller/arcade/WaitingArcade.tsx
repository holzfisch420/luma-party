import { useRef, useState } from 'react';
import { ui } from '../../../app/audio/sfx';
import { Flap } from './Flap';
import { Mines } from './Mines';
import type { ArcadeGame } from './scores';
import { Snake } from './Snake';

const TABS: { id: ArcadeGame; label: string; emoji: string }[] = [
  { id: 'flap', label: 'Flatterflug', emoji: '🐤' },
  { id: 'snake', label: 'Schlange', emoji: '🐍' },
  { id: 'mines', label: 'Minensuche', emoji: '💣' },
];
const KEY = 'luma.arcade.tab';

function initialTab(): ArcadeGame {
  try {
    const v = localStorage.getItem(KEY);
    if (v && TABS.some((t) => t.id === v)) return v as ArcadeGame;
  } catch {
    /* ignorieren */
  }
  return 'flap';
}

/** Kleine Spielhalle zum Zeitvertreib, solange am Fernseher noch gewählt wird. */
export function WaitingArcade() {
  const [tab, setTab] = useState<ArcadeGame>(initialTab);
  const box = useRef<HTMLDivElement>(null);
  const pick = (id: ArcadeGame) => {
    // Spielfläche ganz ins Bild holen
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div ref={box} className="scroll-mt-3 rounded-[28px] bg-gradient-to-b from-[#241b3d] to-[#151027] p-3 shadow-xl ring-1 ring-black/10">
      <div className="mb-3 flex gap-1 rounded-2xl bg-black/30 p-1">
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
      {tab === 'flap' && <Flap />}
      {tab === 'snake' && <Snake />}
      {tab === 'mines' && <Mines />}
    </div>
  );
}
