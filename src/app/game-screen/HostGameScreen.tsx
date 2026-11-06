import { MoreHorizontal } from 'lucide-react';
import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { Spinner } from '../../components/ui/Feedback';
import { useSession } from '../session/session-store';

/**
 * Rendert die TV-Ansicht des aktiven Spiels bildschirmfüllend – im eigenen Stil des Spiels.
 * Der Launcher steuert nur einen kleinen, unauffälligen Menü-Knopf bei.
 */
export function HostGameScreen({ room, onMenu }: { room: RoomSnapshot; onMenu: () => void }) {
  const game = useSession((s) => s.game);
  const module = getClientGame(room.activeGameId);
  const ready = module && game && game.gameId === module.meta.id;
  const View = module?.HostView;
  return (
    <div className="relative h-dvh overflow-hidden">
      {!module && <div className="grid h-full place-items-center font-bold text-home-muted">Dieses Spiel kann hier nicht angezeigt werden.</div>}
      {module && !ready && (
        <div className="grid h-full place-items-center">
          <Spinner className="size-8" />
        </div>
      )}
      {ready && View && <View room={room} state={game as never} />}
      <button
        onClick={onMenu}
        aria-label="Menü"
        title="Menü"
        className="absolute right-2 top-1.5 z-30 grid size-9 place-items-center rounded-full bg-black/10 text-black/40 backdrop-blur transition hover:bg-black/20 hover:text-black/70"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  );
}
