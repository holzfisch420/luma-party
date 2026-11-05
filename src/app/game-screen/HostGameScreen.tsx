import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { Spinner } from '../../components/ui/Feedback';
import { useSession } from '../session/session-store';

/** Rendert die TV-Ansicht des aktiven Spiels – generisch über die Registry. */
export function HostGameScreen({ room }: { room: RoomSnapshot }) {
  const game = useSession((s) => s.game);
  const module = getClientGame(room.activeGameId);
  if (!module) return <div className="grid flex-1 place-items-center text-white/60">Dieses Spiel kann hier nicht angezeigt werden.</div>;
  if (!game || game.gameId !== module.meta.id) {
    return (
      <div className="grid flex-1 place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  const View = module.HostView;
  return (
    <main className="flex min-h-0 flex-1 flex-col px-8 pb-6 lg:px-12">
      <View room={room} state={game as never} />
    </main>
  );
}
