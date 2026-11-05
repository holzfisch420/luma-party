import { LogOut, MonitorX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GameResults } from '../../components/game/GameResults';
import { MobileJoinScreen } from '../../components/mobile-controller/MobileJoinScreen';
import { MobileLobby } from '../../components/mobile-controller/MobileLobby';
import { Button } from '../../components/ui/Button';
import { LoadingScreen, ReconnectBanner, Spinner } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { getGameMeta } from '../../games/game-catalog';
import { getClientGame } from '../../games/game-registry';
import { sendGameAction, useNoticeToasts } from '../session/hooks';
import { usePlayerConnection } from '../session/player-connection';
import { useSession } from '../session/session-store';
import { emitWithAck, getSocket } from '../session/socket';
import type { PublicPlayer, RoomSnapshot } from '../../shared/types/room';

/** Smartphone-Controller. */
export function PlayerApp() {
  const [params] = useSearchParams();
  const { state, session, join, leave, forget, resumeError } = usePlayerConnection();
  const room = useSession((s) => s.room);
  const status = useSession((s) => s.status);
  const ended = useSession((s) => s.ended);
  const toast = useToast();
  useNoticeToasts();

  if (ended && !room) {
    return (
      <div className="app-backdrop flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <MonitorX className="size-12 text-white/50" />
        <div>
          <h1 className="text-2xl font-semibold">Sitzung beendet</h1>
          <p className="mt-2 text-white/60">{ended}</p>
        </div>
        <Button variant="primary" size="lg" onClick={forget}>Neu beitreten</Button>
      </div>
    );
  }

  if (state === 'checking') return <LoadingScreen label="Verbinde mit deinem Raum …" />;
  if (state === 'needs-join' || !session) {
    return <MobileJoinScreen initialCode={params.get('code') ?? ''} onJoin={join} notice={resumeError} />;
  }
  const me = room?.players.find((p) => p.id === session.playerId);
  if (!room || !me) return <LoadingScreen label="Synchronisiere …" />;

  const canControl = room.controllerId === me.id && !room.hostHasControl;

  return (
    <>
      <ReconnectBanner status={status} />
      {room.phase === 'lobby' && <MobileLobby room={room} me={me} status={status} onLeave={leave} />}
      {room.phase === 'playing' && <PlayerGame room={room} me={me} />}
      {room.phase === 'results' && room.results && (
        <div className="app-backdrop min-h-dvh px-5 py-8 safe-pt">
          <GameResults
            compact
            meId={me.id}
            results={room.results}
            gameName={getGameMeta(room.results.gameId)?.name ?? 'Spiel'}
            canControl={canControl}
            onRestart={() => emitWithAck('room:restartGame').catch((e: Error) => toast(e.message, 'error'))}
            onBack={() => getSocket().emit('room:backToLauncher')}
          />
          <Button variant="ghost" className="mx-auto mt-6 flex" icon={<LogOut className="size-4" />} onClick={leave}>
            Raum verlassen
          </Button>
        </div>
      )}
    </>
  );
}

function PlayerGame({ room, me }: { room: RoomSnapshot; me: PublicPlayer }) {
  const game = useSession((s) => s.game);
  const module = getClientGame(room.activeGameId);
  if (!module) return <div className="p-8 text-center text-white/60">Dieses Spiel wird auf dem Smartphone nicht unterstützt.</div>;
  if (!game || game.gameId !== module.meta.id) {
    return (
      <div className="app-backdrop grid min-h-dvh place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  const View = module.PlayerView;
  return (
    <div className="app-backdrop min-h-dvh">
      <View room={room} me={me} state={game as never} sendAction={sendGameAction} />
    </div>
  );
}
