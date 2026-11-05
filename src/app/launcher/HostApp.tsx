import { AnimatePresence, motion } from 'framer-motion';
import { MonitorX, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { GameResults } from '../../components/game/GameResults';
import { Button } from '../../components/ui/Button';
import { LoadingScreen, ReconnectBanner } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { getGameMeta } from '../../games/game-catalog';
import { HostGameScreen } from '../game-screen/HostGameScreen';
import { useNoticeToasts } from '../session/hooks';
import { useHostConnection } from '../session/host-connection';
import { useSession } from '../session/session-store';
import { emitWithAck, getSocket } from '../session/socket';
import { HostMenu } from './HostMenu';
import { HostTopBar } from './HostTopBar';
import { LauncherScreen } from './LauncherScreen';

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
      <div className="app-backdrop flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <MonitorX className="size-14 text-white/50" />
        <div>
          <h1 className="text-3xl font-semibold">Sitzung beendet</h1>
          <p className="mt-2 text-white/60">{ended}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="lg" onClick={() => void resume()}>Hier fortsetzen</Button>
          <Button size="lg" icon={<RefreshCw className="size-5" />} onClick={() => void newRoom()}>Neuer Raum</Button>
        </div>
      </div>
    );
  }
  if (!room) return <LoadingScreen label={error ?? 'Raum wird erstellt …'} />;

  const meta = room.results ? getGameMeta(room.results.gameId) : undefined;

  return (
    <div className="app-backdrop flex h-dvh flex-col overflow-hidden">
      <ReconnectBanner status={status} />
      <HostTopBar room={room} status={status} onMenu={() => setMenuOpen(true)} compact={room.phase === 'playing'} />
      <AnimatePresence mode="wait">
        <motion.div
          key={room.phase}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {room.phase === 'lobby' && <LauncherScreen room={room} modalOpen={menuOpen} />}
          {room.phase === 'playing' && <HostGameScreen room={room} />}
          {room.phase === 'results' && room.results && (
            <div className="flex flex-1 items-start justify-center overflow-y-auto px-8 py-6">
              <GameResults
                results={room.results}
                gameName={meta?.name ?? 'Spiel'}
                canControl
                onRestart={() => emitWithAck('room:restartGame').catch((e: Error) => toast(e.message, 'error'))}
                onBack={() => getSocket().emit('room:backToLauncher')}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <HostMenu room={room} open={menuOpen} onClose={() => setMenuOpen(false)} onNewRoom={() => void newRoom()} />
    </div>
  );
}
