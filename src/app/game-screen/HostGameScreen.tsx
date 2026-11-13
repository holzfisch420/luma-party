import { MoreHorizontal } from 'lucide-react';
import { Suspense } from 'react';
import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { Spinner } from '../../components/ui/Feedback';
import { QuitButton } from '../../components/game/QuitButton';
import { getSocket } from '../session/socket';
import { useSession } from '../session/session-store';
import { useMusic } from '../audio/music';

/**
 * Rendert die TV-Ansicht des aktiven Spiels bildschirmfüllend – im eigenen Stil des Spiels.
 * Der Launcher steuert nur einen kleinen, unauffälligen Menü-Knopf bei.
 */
export function HostGameScreen({ room, onMenu }: { room: RoomSnapshot; onMenu: () => void }) {
  const game = useSession((s) => s.game);
  const module = getClientGame(room.activeGameId);
  const ready = module && game && game.gameId === module.meta.id;
  const View = module?.HostView;
  useMusic(module?.music ?? null, 1, 0);
  return (
    <div className="relative h-dvh overflow-hidden">
      {!module && <div className="grid h-full place-items-center font-bold text-home-muted">Dieses Spiel kann hier nicht angezeigt werden.</div>}
      {module && !ready && (
        <div className="grid h-full place-items-center">
          <Spinner className="size-8" />
        </div>
      )}
      {ready && View && (
        <Suspense fallback={<div className="grid h-full place-items-center"><Spinner className="size-8" /></div>}>
          <View room={room} state={game as never} />
        </Suspense>
      )}
      {/* klein in der Ecke, damit nichts vom Spiel verdeckt wird */}
      <QuitButton size="sm" className="absolute right-10 top-1 z-30 opacity-60 transition hover:opacity-100 focus-within:opacity-100" onQuit={() => getSocket().emit('room:backToLauncher')} />
      <button
        onClick={onMenu}
        aria-label="Menü"
        title="Menü"
        className="absolute right-1 top-1 z-30 grid size-8 place-items-center rounded-full bg-black/25 text-white/80 opacity-60 backdrop-blur transition hover:opacity-100"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </div>
  );
}
