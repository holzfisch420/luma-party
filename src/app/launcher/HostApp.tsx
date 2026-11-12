import { AnimatePresence, motion } from 'framer-motion';
import { MonitorX, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { GameResults } from '../../components/game/GameResults';
import { Button } from '../../components/ui/Button';
import { LoadingScreen, ReconnectBanner } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { getGameMeta } from '../../games/game-catalog';
import { getClientGame } from '../../games/game-registry';
import { HostGameScreen } from '../game-screen/HostGameScreen';
import { useNoticeToasts } from '../session/hooks';
import { useHostConnection } from '../session/host-connection';
import { useSession } from '../session/session-store';
import { emitWithAck, getSocket } from '../session/socket';
import { HomeScreen } from './HomeScreen';
import { HostMenu } from './HostMenu';
import { useEffect } from 'react';
import { useMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';

/** Musik und Fanfare für die Rangliste */
function ResultsSound() {
  useMusic('results');
  useEffect(() => playSfx('fanfare'), []);
  return null;
}

/** Hauptbildschirm (TV / Beamer / Desktop). */
export function HostApp() {
  const { error, ended, resume, newRoom } = useHostConnection();
  const room = useSession((s) => s.room);
  const status = useSession((s) => s.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const toast = useToast();
  useNoticeToasts();

  if (ended && !room) {
    return (
      <div className="home-bg flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <MonitorX className="size-14 text-home-muted" />
        <div>
          <h1 className="text-3xl font-black">Sitzung beendet</h1>
          <p className="mt-2 font-bold text-home-muted">{ended}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="lg" onClick={() => void resume()}>Hier fortsetzen</Button>
          <Button size="lg" icon={<RefreshCw className="size-5" />} onClick={() => void newRoom()}>Neuer Raum</Button>
        </div>
      </div>
    );
  }
  if (!room) return <LoadingScreen label={error ?? 'Raum wird erstellt …'} />;

  const results = room.results;
  const resultsModule = results ? getClientGame(results.gameId) : undefined;
  const ResultsView = resultsModule?.ResultsView;
  const restart = () => emitWithAck('room:restartGame').catch((e: Error) => toast(e.message, 'error'));
  const back = () => getSocket().emit('room:backToLauncher');

  return (
    <>
      <ReconnectBanner status={status} />
      <AnimatePresence mode="wait">
        <motion.div
          key={room.phase}
          initial={{ opacity: 0, scale: room.phase === 'lobby' ? 1.04 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: room.phase === 'lobby' ? 0.96 : 1.04 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {room.phase === 'lobby' && <HomeScreen room={room} status={status} onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />}
          {room.phase === 'playing' && <HostGameScreen room={room} onMenu={() => setMenuOpen(true)} />}
          {room.phase === 'results' && <ResultsSound />}
          {room.phase === 'results' && results && (
            ResultsView ? (
              <ResultsView room={room} results={results} device="host" canControl onRestart={restart} onBack={back} />
            ) : (
              <div className="h-dvh overflow-y-auto">
                <GameResults results={results} gameName={getGameMeta(results.gameId)?.name ?? 'Spiel'} canControl onRestart={restart} onBack={back} />
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
      <HostMenu room={room} open={menuOpen} onClose={() => setMenuOpen(false)} onNewRoom={() => void newRoom()} />
    </>
  );
}
