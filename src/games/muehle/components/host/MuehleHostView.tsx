import { AnimatePresence, motion } from 'framer-motion';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { HostViewProps } from '../../../game-types';
import { countOn, phaseOf, type Side } from '../../logic/rules';
import type { MuehlePublicState } from '../../types';
import { MillBoard, Stone } from '../MillBoard';
import { colorName, END_TEXT, nameOf, statusText, useMillSounds } from '../shared';

/** Fernseher: Holzbrett in der Mitte, links/rechts die beiden Seiten mit ihren Vorräten */
export function MuehleHostView({ room, state }: HostViewProps<MuehlePublicState>) {
  const pub = state.public;
  const s = pub.state;
  useMillSounds(pub);
  const over = !!(s.winner || s.draw);

  const side = (c: Side) => {
    const id = pub.players[c];
    const p = room.players.find((x) => x.id === id);
    const active = !over && s.turn === c;
    return (
      <div className={`flex w-[22vw] flex-col items-center gap-4 rounded-[32px] px-5 py-6 transition-all ${active ? 'bg-white/15 ring-4 ring-[#e8b84a]' : 'bg-black/20'}`}>
        <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#888'} avatar={p?.avatar} size="xl" dimmed={p ? !p.isConnected : true} />
        <div className="text-center">
          <div className="text-3xl font-black">{nameOf(room, id)}</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-lg font-bold text-white/70">
            <Stone side={c} size={1.1} /> {colorName(c)}
          </div>
        </div>
        {/* Vorrat */}
        <div className="flex min-h-20 flex-wrap justify-center gap-1 text-[2.2rem]">
          {Array.from({ length: s.hand[c] }).map((_, i) => (
            <motion.span key={i} layout initial={false}>
              <Stone side={c} size={1} />
            </motion.span>
          ))}
        </div>
        <div className="grid w-full grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-black/25 py-2">
            <div className="text-3xl font-black">{countOn(s, c)}</div>
            <div className="text-xs font-black uppercase tracking-widest text-white/60">auf dem Brett</div>
          </div>
          <div className="rounded-2xl bg-black/25 py-2">
            <div className="text-3xl font-black text-[#ffd23f]">{pub.mills[c]}</div>
            <div className="text-xs font-black uppercase tracking-widest text-white/60">Mühlen</div>
          </div>
        </div>
        {active && <div className="rounded-full bg-[#e8b84a] px-4 py-1 text-lg font-black text-[#3d2414]">{s.mustRemove ? 'nimmt weg …' : phaseOf(s, c) === 'place' ? 'setzt …' : 'zieht …'}</div>}
      </div>
    );
  };

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#5a3a22,#24150b)] text-white">
      <div className="absolute left-[3vw] top-5 text-5xl font-black tracking-tight text-[#f3d9a4] [text-shadow:0_3px_0_#24150b]">Mühle</div>
      <motion.div key={statusText(room, pub)} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-3 rounded-full bg-black/35 px-6 py-2 text-2xl font-black">
        {statusText(room, pub)}
      </motion.div>
      <div className="flex items-center gap-[3vw]">
        {side('w')}
        <div className="relative h-[80vh] w-[80vh]">
          <MillBoard board={s.board} last={s.last} className="size-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]" />
          <AnimatePresence>
            {over && (
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl bg-[#24150b]/95 px-12 py-7 text-center shadow-2xl">
                <div className="text-5xl font-black">{s.winner ? `${nameOf(room, pub.players[s.winner])} gewinnt!` : 'Remis'}</div>
                {pub.endReason && <div className="text-2xl font-bold text-[#e8b84a]">{END_TEXT[pub.endReason]}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {side('b')}
      </div>
    </div>
  );
}
