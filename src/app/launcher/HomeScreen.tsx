import { BookOpen, HelpCircle, Maximize, QrCode as QrIcon, Settings, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppTileArt } from '../../components/launcher/AppTileArt';
import { GameSettingsSheet } from '../../components/launcher/GameSettingsSheet';
import { HomeDock, type DockItem } from '../../components/launcher/HomeDock';
import { HomeGrid, type GridItem } from '../../components/launcher/HomeGrid';
import { LaunchPanel } from '../../components/launcher/LaunchPanel';
import { TileArt } from '../../components/launcher/TileArt';
import { JoinInstructions, QrCode, useJoinUrl } from '../../components/lobby/JoinInstructions';
import { PlayerAvatar } from '../../components/lobby/PlayerAvatar';
import { PlayerList } from '../../components/lobby/PlayerList';
import { SettingRow, Toggle } from '../../components/ui/Controls';
import { ConnectionStatusBadge } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { WordManager } from '../../components/word-manager/WordManager';
import { getClientGame, listLauncherGames } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import type { ConnectionStatus } from '../session/session-store';
import { emitWithAck, getSocket } from '../session/socket';

const GAMES = listLauncherGames();
const APP_WORDS = 'app:words';
const APP_JOIN = 'app:join';
const APP_HELP = 'app:help';
type Sheet = 'players' | 'words' | 'join' | 'help' | null;

/** Hauptbildschirm im Home-Menü-Stil: Kachelraster, Sprechblase, Icon-Leiste. */
export function HomeScreen({ room, status, onOpenMenu, menuOpen }: { room: RoomSnapshot; status: ConnectionStatus; onOpenMenu: () => void; menuOpen: boolean }) {
  const toast = useToast();
  const [focusedId, setFocusedId] = useState<string>(room.selectedGameId);
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [starting, setStarting] = useState(false);
  const joinUrl = useJoinUrl(room.code);
  const connected = room.players.filter((p) => p.isConnected).length;

  // Auswahl vom Smartphone übernehmen
  useEffect(() => {
    setFocusedId(room.selectedGameId);
  }, [room.selectedGameId]);

  const items: GridItem[] = useMemo(
    () => [
      ...GAMES.map((g) => ({
        id: g.id,
        label: g.name,
        art: <TileArt meta={g} focused={false} />,
        actionLabel: g.status === 'coming-soon' ? 'Bald' : 'Start',
      })),
      { id: APP_JOIN, label: 'Mitspielen', art: <AppTileArt icon={QrIcon} color="#3fbf5a" label="Beitreten" />, actionLabel: 'Öffnen' },
      { id: APP_WORDS, label: 'Eigene Wörter', art: <AppTileArt icon={BookOpen} color="#ff9a1f" label="Wörter" />, actionLabel: 'Öffnen' },
      { id: APP_HELP, label: "So geht's", art: <AppTileArt icon={HelpCircle} color="#36a9f0" label="Hilfe" />, actionLabel: 'Öffnen' },
    ],
    [],
  );
  // Kachel-Grafiken mit Fokuszustand
  const gridItems = items.map((i) => {
    const meta = GAMES.find((g) => g.id === i.id);
    return meta ? { ...i, art: <TileArt meta={meta} focused={i.id === focusedId} /> } : i;
  });

  const focus = useCallback((id: string) => {
    setFocusedId(id);
    if (GAMES.some((g) => g.id === id)) getSocket().emit('room:selectGame', { gameId: id });
  }, []);

  const activate = useCallback((id: string) => {
    if (id === APP_WORDS) return setSheet('words');
    if (id === APP_JOIN) return setSheet('join');
    if (id === APP_HELP) return setSheet('help');
    setLaunchId(id);
  }, []);

  const start = async () => {
    setStarting(true);
    try {
      await emitWithAck('room:startGame');
      setLaunchId(null);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setStarting(false);
    }
  };

  const dock: DockItem[] = [
    { id: 'players', label: 'Spieler', icon: Users, color: '#3fbf5a', onClick: () => setSheet('players') },
    { id: 'join', label: 'Beitreten', icon: QrIcon, color: '#1fb3d4', onClick: () => setSheet('join') },
    { id: 'words', label: 'Eigene Wörter', icon: BookOpen, color: '#ff9a1f', onClick: () => setSheet('words') },
    {
      id: 'fullscreen',
      label: 'Vollbild',
      icon: Maximize,
      color: '#f0474f',
      onClick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()),
    },
    { id: 'help', label: 'Hilfe', icon: HelpCircle, color: '#36a9f0', onClick: () => setSheet('help') },
    { id: 'settings', label: 'Einstellungen', icon: Settings, color: '#8a939d', onClick: onOpenMenu },
  ];

  const launchMeta = GAMES.find((g) => g.id === launchId) ?? null;
  const keyboard = !launchMeta && !settingsOpen && !sheet && !menuOpen;

  return (
    <div className="home-bg relative flex h-dvh flex-col overflow-hidden">
      {/* weiche Hintergrundformen */}
      <div className="home-shape left-[6%] top-[38%] h-40 w-64 rotate-[-18deg]" />
      <div className="home-shape right-[8%] top-[8%] h-56 w-56 rotate-12" />
      <div className="home-shape bottom-[16%] right-[30%] h-24 w-72 rotate-[8deg]" />

      {/* Kopfzeile */}
      <header className="relative z-10 flex items-start justify-between gap-6 px-[3vw] pt-[2.5vh]">
        <button onClick={() => setSheet('join')} className="home-tile relative flex size-[clamp(5.5rem,9vw,8.5rem)] flex-col items-center justify-center rounded-[26%] text-home-text" aria-label={`Raumcode ${room.code}`}>
          <span className="text-[clamp(0.6rem,0.8vw,0.85rem)] font-black uppercase tracking-[0.2em] text-home-muted">Raum</span>
          <span className="text-[clamp(1.5rem,2.6vw,2.6rem)] font-black leading-none tracking-[0.08em] text-cyan-dark">{room.code}</span>
          <span className="absolute -right-2.5 -top-2.5 grid min-w-9 place-items-center rounded-full border-2 border-white bg-[#ff8a1f] px-2 py-1 text-sm font-black text-white shadow-md" title="verbundene Spieler">
            {connected}
          </span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden -space-x-2 sm:flex">
            {room.players.slice(0, 8).map((p) => (
              <div key={p.id} title={p.name}>
                <PlayerAvatar name={p.name} color={p.avatarColor} size="md" dimmed={!p.isConnected} />
              </div>
            ))}
          </div>
          <button onClick={() => setSheet('join')} className="home-tile flex items-center gap-3 rounded-[22px] py-2 pl-2 pr-4 text-left">
            <QrCode text={joinUrl} className="size-[clamp(4rem,6vw,6rem)] rounded-[14px] p-1.5" />
            <div className="hidden md:block">
              <div className="text-sm font-black text-home-text">Handy-Kamera drauf!</div>
              <div className="text-xs font-bold text-home-muted">oder Code {room.code} eingeben</div>
            </div>
          </button>
        </div>
      </header>

      {/* Kachelraster */}
      <main className="relative z-10 mx-auto flex w-full min-h-0 flex-1 items-center justify-center px-[6vw]">
        <div className="w-full" style={{ maxWidth: 'min(80vw, calc((100dvh - 21rem) * 1.66))' }}>
          <HomeGrid items={gridItems} focusedId={focusedId} onFocus={focus} onActivate={activate} keyboard={keyboard} />
        </div>
      </main>

      {/* Icon-Leiste */}
      <footer className="relative z-10 flex items-end justify-between px-[3vw] pb-[2.5vh]">
        <ConnectionStatusBadge status={status} compact />
        <HomeDock items={dock} />
        <div className="w-28 text-right text-xs font-bold leading-tight text-home-muted">
          {!room.hostHasControl && room.controllerId
            ? `${room.players.find((p) => p.id === room.controllerId)?.name ?? ''} wählt per Handy`
            : 'Auswahl am Bildschirm'}
        </div>
      </footer>

      <LaunchPanel
        meta={launchMeta}
        connectedPlayers={connected}
        canStart
        starting={starting}
        keyboard={!settingsOpen}
        onStart={() => void start()}
        onSettings={() => setSettingsOpen(true)}
        onClose={() => setLaunchId(null)}
      />
      {launchMeta && getClientGame(launchMeta.id)?.SettingsPanel && (
        <GameSettingsSheet room={room} gameId={launchMeta.id} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}

      <Modal open={sheet === 'players'} onClose={() => setSheet(null)} title="Spieler" subtitle={`${connected} verbunden · Raum ${room.code}`}>
        {room.players.length === 0 ? (
          <p className="py-6 text-center font-bold text-home-muted">Noch niemand da – scannt den QR-Code!</p>
        ) : (
          <PlayerList players={room.players} controllerId={room.controllerId} hostHasControl={room.hostHasControl} onKick={(playerId) => getSocket().emit('room:kickPlayer', { playerId })} />
        )}
        <div className="mt-5 border-t border-home-line/70 pt-2">
          <SettingRow label="Spielauswahl nur am Bildschirm" hint="Sonst darf die zuerst beigetretene Person per Handy wählen (Abzeichen „Wahl“).">
            <Toggle checked={room.hostHasControl} onChange={(enabled) => getSocket().emit('room:setHostControl', { enabled })} label="Host-Steuerung" />
          </SettingRow>
        </div>
      </Modal>
      <Modal open={sheet === 'join'} onClose={() => setSheet(null)} title="Mitspielen" subtitle="Alle Handys werden zu Controllern.">
        <JoinInstructions code={room.code} />
      </Modal>
      <Modal open={sheet === 'words'} onClose={() => setSheet(null)} title="Eigene Wörter" subtitle="In den Spieleinstellungen unter „Eigene Wörter“ oder „Mix“ auswählbar." width="max-w-3xl">
        <WordManager />
      </Modal>
      <Modal open={sheet === 'help'} onClose={() => setSheet(null)} title="So geht's">
        <ol className="space-y-3 text-[15px] font-semibold">
          <li><b className="font-black text-cyan-dark">1.</b> Alle scannen den QR-Code oben rechts und geben ihren Namen ein.</li>
          <li><b className="font-black text-cyan-dark">2.</b> Mit den Pfeiltasten (oder Maus) ein Spiel wählen – die Sprechblase zeigt den Namen.</li>
          <li><b className="font-black text-cyan-dark">3.</b> Enter oder nochmal klicken öffnet das Spiel, „Start“ legt los.</li>
          <li><b className="font-black text-cyan-dark">4.</b> Die zuerst beigetretene Person kann das Spiel auch auf ihrem Handy auswählen.</li>
        </ol>
        {GAMES.filter((g) => getClientGame(g.id)?.rules).map((g) => (
          <div key={g.id} className="mt-6 rounded-2xl border border-home-line bg-white p-4">
            <div className="font-black">{g.name}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-home-muted">
              {getClientGame(g.id)!.rules!.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        ))}
      </Modal>
    </div>
  );
}
