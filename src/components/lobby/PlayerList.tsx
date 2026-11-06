import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, UserX, WifiOff } from 'lucide-react';
import type { PublicPlayer } from '../../shared/types/room';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerListProps {
  players: PublicPlayer[];
  controllerId: string | null;
  hostHasControl?: boolean;
  meId?: string;
  onKick?: (id: string) => void;
}

/** Spielerübersicht mit Verbindungsstatus und Auswahl-Berechtigung (Launcher-Stil). */
export function PlayerList({ players, controllerId, hostHasControl, meId, onKick }: PlayerListProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <AnimatePresence initial={false} mode="popLayout">
        {players.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={`group relative flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 shadow-sm ${p.id === meId ? 'border-cyan bg-cyan/10' : 'border-home-line bg-white'} ${!p.isConnected ? 'opacity-60' : ''}`}
          >
            <PlayerAvatar name={p.name} color={p.avatarColor} avatar={p.avatar} size="sm" dimmed={!p.isConnected} />
            <span className="max-w-[10rem] truncate text-[15px] font-extrabold">{p.name}</span>
            {p.id === controllerId && (
              <span
                title={hostHasControl ? 'Host hat die Auswahl übernommen' : 'Darf das Spiel auswählen'}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${hostHasControl ? 'bg-home-line text-home-muted' : 'bg-amber-100 text-amber-700'}`}
              >
                <Gamepad2 className="size-3" /> Wahl
              </span>
            )}
            {!p.isConnected && <WifiOff className="size-3.5 text-amber-500" aria-label="getrennt" />}
            {onKick && (
              <button
                onClick={() => onKick(p.id)}
                className="absolute -right-1.5 -top-1.5 hidden size-6 place-items-center rounded-full bg-rose-500 text-white shadow group-hover:grid"
                aria-label={`${p.name} entfernen`}
                title="Aus dem Raum entfernen"
              >
                <UserX className="size-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
