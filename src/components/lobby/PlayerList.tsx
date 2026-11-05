import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Gamepad2, UserX, WifiOff } from 'lucide-react';
import type { PublicPlayer } from '../../shared/types/room';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerListProps {
  players: PublicPlayer[];
  controllerId: string | null;
  hostHasControl?: boolean;
  meId?: string;
  onKick?: (id: string) => void;
  layout?: 'row' | 'grid';
}

/** Spielerübersicht mit Verbindungsstatus und Auswahl-Berechtigung. */
export function PlayerList({ players, controllerId, hostHasControl, meId, onKick, layout = 'row' }: PlayerListProps) {
  return (
    <div className={layout === 'row' ? 'flex flex-wrap items-center gap-3' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
      <AnimatePresence initial={false} mode="popLayout">
        {players.map((p) => {
          const isController = p.id === controllerId;
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.6, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`group relative flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 ${p.id === meId ? 'bg-white/15' : 'bg-white/[0.06]'} ${!p.isConnected ? 'opacity-60' : ''}`}
            >
              <PlayerAvatar name={p.name} color={p.avatarColor} size="sm" dimmed={!p.isConnected} />
              <span className="max-w-[10rem] truncate text-[15px] font-medium">{p.name}</span>
              {isController && (
                <span
                  title={hostHasControl ? 'Auswahlberechtigt (Host hat übernommen)' : 'Darf das Spiel auswählen'}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${hostHasControl ? 'bg-white/10 text-white/40' : 'bg-amber-300/20 text-amber-200'}`}
                >
                  <Gamepad2 className="size-3" /> Wahl
                </span>
              )}
              {!p.isConnected && <WifiOff className="size-3.5 text-amber-300" aria-label="getrennt" />}
              {onKick && (
                <button
                  onClick={() => onKick(p.id)}
                  className="absolute -right-1 -top-1 hidden size-6 place-items-center rounded-full bg-rose-500 text-white shadow group-hover:grid"
                  aria-label={`${p.name} entfernen`}
                  title="Aus dem Raum entfernen"
                >
                  <UserX className="size-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function HostBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
      <Crown className="size-3.5 text-amber-300" /> Host: Hauptbildschirm
    </span>
  );
}
