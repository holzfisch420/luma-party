import { motion } from 'framer-motion';
import type { TitleScreenProps } from '../../games/game-types';
import { TileArt } from '../launcher/TileArt';
import { BlockedHint } from './primitives';

/** schlichter Titelbildschirm für Spiele ohne eigenen */
export function DefaultTitleScreen({ meta, items, focus, setFocus, activate, blocked }: TitleScreenProps) {
  const t = meta.theme;
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[6vw] text-white" style={{ background: `linear-gradient(150deg, ${t.from}, ${t.via ?? t.from} 55%, ${t.to})` }}>
      <div className="w-[28vw] overflow-hidden rounded-[22%] shadow-2xl">
        <div className="aspect-square">
          <TileArt meta={meta} focused />
        </div>
      </div>
      <div className="flex w-[34vw] flex-col gap-3">
        <h1 className="text-7xl font-black tracking-tight drop-shadow-lg">{meta.name}</h1>
        <p className="mb-4 text-2xl font-bold text-white/80">{meta.tagline}</p>
        {items.map((it, i) => (
          <motion.button
            key={it.id}
            onMouseEnter={() => setFocus(i)}
            onClick={() => activate(i)}
            animate={{ scale: focus === i ? 1.05 : 1 }}
            className={`rounded-2xl px-6 py-3 text-left text-2xl font-black ${focus === i ? 'bg-white text-black' : 'bg-black/25'}`}
          >
            {it.label}
          </motion.button>
        ))}
        <BlockedHint blocked={blocked} />
      </div>
    </div>
  );
}
