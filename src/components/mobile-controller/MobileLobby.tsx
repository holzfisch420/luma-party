import { BookOpen, Gamepad2, LogOut, MonitorOff, Tv, UserRound } from 'lucide-react';
import { getAuthToken } from '../../app/account/account-store';
import { AccountPanel } from '../avatar/AccountPanel';
import { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../../app/session/session-store';
import { emitWithAck, getSocket } from '../../app/session/socket';
import { getClientGame, listLauncherGames } from '../../games/game-registry';
import type { PublicPlayer, RoomSnapshot } from '../../shared/types/room';
import { GameSettingsSheet } from '../launcher/GameSettingsSheet';
import { HomeGrid } from '../launcher/HomeGrid';
import { HomeTile } from '../launcher/HomeTile';
import { LaunchPanel } from '../launcher/LaunchPanel';
import { TileArt } from '../launcher/TileArt';
import { PlayerAvatar } from '../lobby/PlayerAvatar';
import { PlayerList } from '../lobby/PlayerList';
import { Button } from '../ui/Button';
import { ConnectionStatusBadge } from '../ui/Feedback';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { WordManager } from '../word-manager/WordManager';

const GAMES = listLauncherGames();

/** Lobby auf dem Handy – wie ein zweiter Bildschirm des Home-Menüs. */
export function MobileLobby({ room, me, status, onLeave }: { room: RoomSnapshot; me: PublicPlayer; status: ConnectionStatus; onLeave: () => void }) {
  const toast = useToast();
  const [wordsOpen, setWordsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const canSelect = room.controllerId === me.id && !room.hostHasControl;
  const controller = room.players.find((p) => p.id === room.controllerId);
  const selected = GAMES.find((g) => g.id === room.selectedGameId) ?? GAMES[0]!;
  const connected = room.players.filter((p) => p.isConnected).length;

  useEffect(() => {
    if (!canSelect) setLaunchOpen(false);
  }, [canSelect]);

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
    <div className="home-bg min-h-dvh px-5 pb-10 safe-pt">
      <header className="flex items-center justify-between py-3">
        <div className="home-tile rounded-full px-4 py-1.5 text-sm font-black tracking-[0.2em] text-cyan-dark">{room.code}</div>
        <div className="flex items-center gap-2">
          <ConnectionStatusBadge status={status} compact />
          <button onClick={onLeave} className="home-tile flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold text-home-muted" aria-label="Raum verlassen">
            <LogOut className="size-4" /> Verlassen
          </button>
        </div>
      </header>

      <div className="mt-3 flex items-center gap-4">
        <button onClick={() => setAccountOpen(true)} aria-label="Avatar bearbeiten" className="relative">
          <PlayerAvatar name={me.name} color={me.avatarColor} avatar={me.avatar} size="xl" />
          <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-cyan text-white shadow">
            <UserRound className="size-4" />
          </span>
        </button>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-home-muted">Du bist dabei!</div>
          <div className="truncate text-3xl font-black tracking-tight">{me.name}</div>
          <button onClick={() => setAccountOpen(true)} className="mt-1 text-sm font-extrabold text-cyan-dark">
            {me.hasAccount ? 'Avatar bearbeiten' : 'Konto & eigenen Avatar erstellen'}
          </button>
        </div>
      </div>

      {!room.hostConnected && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          <MonitorOff className="size-5 shrink-0" /> Der Fernseher ist gerade nicht verbunden.
        </div>
      )}

      <section className="mt-8">
        {canSelect ? (
          <>
            <div className="mb-10 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-600">
              <Gamepad2 className="size-4" /> Du wählst das Spiel – tippen, dann nochmal tippen
            </div>
            <HomeGrid
              items={GAMES.map((g) => ({ id: g.id, label: g.name, art: <TileArt meta={g} focused={g.id === selected.id} />, actionLabel: g.status === 'coming-soon' ? 'Bald' : 'Start' }))}
              focusedId={selected.id}
              onFocus={(id) => getSocket().emit('room:selectGame', { gameId: id })}
              onActivate={() => setLaunchOpen(true)}
              columns={3}
              rows={2}
              keyboard={false}
              showArrows={false}
            />
          </>
        ) : (
          <div className="home-panel flex items-center gap-4 rounded-[28px] p-4">
            <div className="w-28 shrink-0">
              <HomeTile label={selected.name} art={<TileArt meta={selected} focused />} focused={false} showBubble={false} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black">{selected.name}</div>
              <div className="mt-1 flex items-start gap-2 text-sm font-bold text-home-muted">
                <Tv className="mt-0.5 size-4 shrink-0" />
                {room.hostHasControl || !controller ? 'Das Spiel wird am Fernseher gewählt.' : `${controller.name} wählt das Spiel aus …`}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-home-muted">{room.players.length} im Raum</div>
        <PlayerList players={room.players} controllerId={room.controllerId} hostHasControl={room.hostHasControl} meId={me.id} />
      </section>

      <Button variant="secondary" className="mt-8 w-full" icon={<BookOpen className="size-4" />} onClick={() => setWordsOpen(true)}>
        Eigene Wörter verwalten
      </Button>
      <Modal open={accountOpen} onClose={() => setAccountOpen(false)} title="Mein Konto & Avatar" subtitle="Dein Avatar erscheint in der Lobby, im Spiel und auf dem Fernseher.">
        <AccountPanel
          onChanged={(kind) => {
            const token = getAuthToken();
            if (kind !== 'signed-out' && token) {
              getSocket().emit('player:refreshProfile', { authToken: token });
              // nach dem Registrieren bleibt der Editor offen, damit der Avatar gebaut werden kann
              if (kind !== 'registered') setAccountOpen(false);
            }
          }}
        />
      </Modal>
      <Modal open={wordsOpen} onClose={() => setWordsOpen(false)} title="Eigene Wörter" subtitle="Für den Modus „Eigene Wörter“ oder „Mix“.">
        <WordManager />
      </Modal>

      <LaunchPanel
        meta={launchOpen ? selected : null}
        room={room}
        canEdit={canSelect}
        connectedPlayers={connected}
        canStart={canSelect}
        starting={starting}
        keyboard={!settingsOpen}
        onStart={() => void start()}
        onSettings={() => setSettingsOpen(true)}
        onClose={() => setLaunchOpen(false)}
      />
      {getClientGame(selected.id)?.SettingsPanel && (
        <GameSettingsSheet room={room} gameId={selected.id} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
