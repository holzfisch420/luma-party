import { motion } from 'framer-motion';
import { Tv } from 'lucide-react';
import { getGameMeta } from '../../games/game-catalog';
import type { RoomSnapshot } from '../../shared/types/room';

/** andere Handys, während das Spielmenü offen ist */
export function LookAtTv({ room }: { room: RoomSnapshot }) {
  const meta = room.menu ? getGameMeta(room.menu.gameId) : undefined;
  if (!meta) return null;
  const t = meta.theme;
  const lead = !room.hostHasControl && room.controllerId ? room.players.find((p) => p.id === room.controllerId)?.name : null;
  return (
    <div className="relative overflow-hidden rounded-[28px] p-6 text-center text-white shadow-xl" style={{ background: `linear-gradient(150deg, ${t.from}, ${t.via ?? t.from} 55%, ${t.to})` }}>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity }} className="mx-auto grid size-20 place-items-center rounded-3xl bg-white/20">
        <Tv className="size-11" />
      </motion.div>
      <div className="mt-3 text-2xl font-black">Schau zum Fernseher!</div>
      <div className="mt-1 text-lg font-bold text-white/85">{meta.name}</div>
      <div className="mt-2 text-sm font-semibold text-white/70">{lead ? `${lead} wählt mit dem Handy, wie gespielt wird.` : 'Am Fernseher wird gerade eingestellt.'}</div>
    </div>
  );
}
