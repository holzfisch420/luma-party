import { LogOut, MonitorX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { GameResults } from '../../components/game/GameResults';
import { QuitButton } from '../../components/game/QuitButton';
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
      <div className="home-bg flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <MonitorX className="size-12 text-home-muted" />
        <div>
          <h1 className="text-2xl font-black">Sitzung beendet</h1>
          <p className="mt-2 font-bold text-home-muted">{ended}</p>
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
      {room.phase === 'playing' && <PlayerGame room={room} me={me} canControl={canControl} />}
      {room.phase === 'results' && room.results && <PlayerResults room={room} meId={me.id} canControl={canControl} onLeave={leave} onError={(m) => toast(m, 'error')} />}
    </>
  );
}

function PlayerGame({ room, me, canControl }: { room: RoomSnapshot; me: PublicPlayer; canControl: boolean }) {
  const game = useSession((s) => s.game);
  const module = getClientGame(room.activeGameId);
  if (!module) return <div className="p-8 text-center font-bold text-home-muted">Dieses Spiel wird auf dem Smartphone nicht unterstützt.</div>;
  if (!game || game.gameId !== module.meta.id) {
    return (
      <div className="home-bg grid min-h-dvh place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  const View = module.PlayerView;
  return (
    <div className="min-h-dvh">
      <View room={room} me={me} state={game as never} sendAction={sendGameAction} />
      {/* nur der Spielleiter darf das laufende Spiel beenden */}
      {canControl && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center safe-pt">
          <QuitButton size="sm" compact className="pointer-events-auto mt-1" onQuit={() => getSocket().emit('room:backToLauncher')} />
        </div>
      )}
    </div>
  );
}

function PlayerResults({ room, meId, canControl, onLeave, onError }: { room: RoomSnapshot; meId: string; canControl: boolean; onLeave: () => void; onError: (m: string) => void }) {
  const results = room.results!;
  const ResultsView = getClientGame(results.gameId)?.ResultsView;
  const restart = () => emitWithAck('room:restartGame').catch((e: Error) => onError(e.message));
  const back = () => getSocket().emit('room:backToLauncher');
  if (ResultsView) {
    return <ResultsView room={room} results={results} device="player" meId={meId} canControl={canControl} onRestart={restart} onBack={back} />;
  }
  return (
    <div className="home-bg min-h-dvh px-5 py-8 safe-pt">
      <GameResults compact meId={meId} results={results} gameName={getGameMeta(results.gameId)?.name ?? 'Spiel'} canControl={canControl} onRestart={restart} onBack={back} />
      <Button variant="ghost" className="mx-auto mt-6 flex" icon={<LogOut className="size-4" />} onClick={onLeave}>
        Raum verlassen
      </Button>
    </div>
  );
}
