import { Maximize, MoreHorizontal, Users } from 'lucide-react';
import type { ConnectionStatus } from '../session/session-store';
import type { RoomSnapshot } from '../../shared/types/room';
import { RoomCodeDisplay } from '../../components/lobby/RoomCodeDisplay';
import { ConnectionStatusBadge } from '../../components/ui/Feedback';
import { Logo } from '../../components/ui/Logo';
import { IconButton } from '../../components/ui/Button';

export function HostTopBar({ room, status, onMenu, compact }: { room: RoomSnapshot; status: ConnectionStatus; onMenu: () => void; compact?: boolean }) {
  const connected = room.players.filter((p) => p.isConnected).length;
  return (
    <header className={`relative z-20 flex items-center justify-between gap-6 px-8 ${compact ? 'py-4' : 'py-6'} lg:px-12`}>
      <Logo size={compact ? 'sm' : 'md'} />
      <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
        <RoomCodeDisplay code={room.code} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-sm font-semibold" aria-label={`${connected} Spieler verbunden`}>
          <Users className="size-4 text-white/60" />
          <span className="tabular-nums">{connected}</span>
          <span className="hidden text-white/50 sm:inline">{connected === 1 ? 'Spieler' : 'Spieler'}</span>
        </div>
        <ConnectionStatusBadge status={status} compact />
        <IconButton
          label="Vollbild"
          variant="ghost"
          size="sm"
          icon={<Maximize className="size-4" />}
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
          className="hidden sm:inline-flex"
        />
        <IconButton label="Menü" variant="secondary" size="sm" icon={<MoreHorizontal className="size-5" />} onClick={onMenu} />
      </div>
    </header>
  );
}
