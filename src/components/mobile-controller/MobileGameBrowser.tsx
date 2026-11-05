import { Play, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getClientGame, listLauncherGames } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { emitWithAck, getSocket } from '../../app/session/socket';
import { GameCard } from '../launcher/GameCard';
import { GameInfo } from '../launcher/GameInfo';
import { GameSettingsSheet } from '../launcher/GameSettingsSheet';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

const GAMES = listLauncherGames();

/** Spielauswahl auf dem Smartphone des berechtigten Spielers – synchron zum TV. */
export function MobileGameBrowser({ room }: { room: RoomSnapshot }) {
  const toast = useToast();
  const scroller = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const selected = GAMES.find((g) => g.id === room.selectedGameId) ?? GAMES[0]!;
  const module = getClientGame(selected.id);
  const available = selected.status !== 'coming-soon' && !!module;
  const connected = room.players.filter((p) => p.isConnected).length;

  // Auswahl von außen (z. B. TV) → Karte in die Mitte scrollen
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-game="${selected.id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selected.id]);

  const start = async () => {
    setStarting(true);
    try {
      await emitWithAck('room:startGame');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div ref={scroller} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[12%] py-2">
        {GAMES.map((g) => (
          <div key={g.id} data-game={g.id} className="w-[76%] shrink-0 snap-center transition-transform duration-300" style={{ transform: g.id === selected.id ? 'scale(1)' : 'scale(0.9)' }}>
            <GameCard meta={g} focused={g.id === selected.id} onClick={() => getSocket().emit('room:selectGame', { gameId: g.id })} />
          </div>
        ))}
      </div>
      <GameInfo meta={selected} size="md" />
      <div className="flex gap-3">
        <Button variant="primary" size="lg" className="flex-1" icon={<Play className="size-5 fill-current" />} disabled={!available || connected < selected.minPlayers} loading={starting} onClick={() => void start()}>
          {available ? 'Starten' : 'Bald verfügbar'}
        </Button>
        {module?.SettingsPanel && (
          <Button size="lg" icon={<SlidersHorizontal className="size-5" />} onClick={() => setSettingsOpen(true)} aria-label="Einstellungen" className="!px-5" />
        )}
      </div>
      {available && connected < selected.minPlayers && (
        <p className="text-center text-sm text-white/50">Mindestens {selected.minPlayers} Spieler benötigt.</p>
      )}
      <GameSettingsSheet room={room} gameId={selected.id} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
