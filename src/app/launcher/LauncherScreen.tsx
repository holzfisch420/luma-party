import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Gamepad2, Play, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GameCarousel } from '../../components/launcher/GameCarousel';
import { GameInfo } from '../../components/launcher/GameInfo';
import { GameSettingsSheet } from '../../components/launcher/GameSettingsSheet';
import { JoinInstructions } from '../../components/lobby/JoinInstructions';
import { PlayerList } from '../../components/lobby/PlayerList';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { getClientGame, listLauncherGames } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { emitWithAck, getSocket } from '../session/socket';

const GAMES = listLauncherGames();

export function LauncherScreen({ room, modalOpen }: { room: RoomSnapshot; modalOpen: boolean }) {
  const toast = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const selected = GAMES.find((g) => g.id === room.selectedGameId) ?? GAMES[0]!;
  const index = GAMES.indexOf(selected);
  const module = getClientGame(selected.id);
  const connected = room.players.filter((p) => p.isConnected).length;
  const controller = room.players.find((p) => p.id === room.controllerId);
  const available = selected.status !== 'coming-soon' && !!module;
  const enoughPlayers = connected >= selected.minPlayers;

  const select = useCallback((id: string) => getSocket().emit('room:selectGame', { gameId: id }), []);
  const move = useCallback(
    (delta: number) => {
      const next = GAMES[Math.min(GAMES.length - 1, Math.max(0, index + delta))];
      if (next && next.id !== selected.id) select(next.id);
    },
    [index, select, selected.id],
  );

  const start = useCallback(async () => {
    if (!available) return toast(`${selected.name} ist bald verfügbar.`, 'info');
    setStarting(true);
    try {
      await emitWithAck('room:startGame');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setStarting(false);
    }
  }, [available, selected.name, toast]);

  // Steuerung per Tastatur / TV-Fernbedienung
  useEffect(() => {
    if (settingsOpen || modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void start();
      } else if (e.key.toLowerCase() === 'e' && module?.SettingsPanel) setSettingsOpen(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, start, settingsOpen, modalOpen, module]);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <section className="relative">
        <GameCarousel games={GAMES} selectedId={selected.id} onSelect={select} onActivate={() => void start()} cardRatio={0.44} />
        <button onClick={() => move(-1)} disabled={index === 0} aria-label="Vorheriges Spiel" className="absolute left-6 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 disabled:opacity-0">
          <ChevronLeft className="size-6" />
        </button>
        <button onClick={() => move(1)} disabled={index === GAMES.length - 1} aria-label="Nächstes Spiel" className="absolute right-6 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 disabled:opacity-0">
          <ChevronRight className="size-6" />
        </button>
        <div className="mt-2 flex justify-center gap-2" aria-hidden>
          {GAMES.map((g) => (
            <motion.span key={g.id} animate={{ width: g.id === selected.id ? 28 : 8, opacity: g.id === selected.id ? 1 : 0.35 }} className="h-2 rounded-full bg-white" />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 flex w-full max-w-[1500px] flex-1 flex-col gap-8 px-8 pb-8 lg:flex-row lg:items-start lg:px-12">
        <div className="flex-1">
          <GameInfo meta={selected} />
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="xl"
              icon={<Play className="size-6 fill-current" />}
              onClick={() => void start()}
              loading={starting}
              disabled={!available || !enoughPlayers}
            >
              {available ? 'Spiel starten' : 'Bald verfügbar'}
            </Button>
            {module?.SettingsPanel && (
              <Button variant="secondary" size="xl" icon={<SlidersHorizontal className="size-5" />} onClick={() => setSettingsOpen(true)}>
                Einstellungen
              </Button>
            )}
          </div>
          <div className="mt-4 text-sm text-white/45">
            {available && !enoughPlayers
              ? `Noch ${selected.minPlayers - connected} Spieler nötig – tretet über euer Smartphone bei.`
              : '← → Spiel wählen · Enter starten · E Einstellungen'}
          </div>
        </div>

        <div className="glass flex w-full flex-col gap-5 rounded-[32px] p-6 lg:w-[520px]">
          <JoinInstructions code={room.code} />
          <div className="h-px bg-white/10" />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Lobby · {room.players.length} Spieler</span>
              {controller && (
                <span className="flex items-center gap-1.5 text-xs text-white/50">
                  <Gamepad2 className="size-3.5" />
                  {room.hostHasControl ? 'Auswahl am Bildschirm' : `${controller.name} wählt per Smartphone`}
                </span>
              )}
            </div>
            {room.players.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 py-6 text-center text-white/45">Warte auf Spieler …</div>
            ) : (
              <PlayerList
                players={room.players}
                controllerId={room.controllerId}
                hostHasControl={room.hostHasControl}
                onKick={(playerId) => getSocket().emit('room:kickPlayer', { playerId })}
              />
            )}
          </div>
        </div>
      </section>

      <GameSettingsSheet room={room} gameId={selected.id} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
