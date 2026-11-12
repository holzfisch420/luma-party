import { BookOpen, HelpCircle, Maximize, QrCode as QrIcon, Settings, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppTileArt } from '../../components/launcher/AppTileArt';
import { GameSettingsSheet } from '../../components/launcher/GameSettingsSheet';
import { HomeDock, type DockItem } from '../../components/launcher/HomeDock';
import { HomeGrid, type GridItem } from '../../components/launcher/HomeGrid';
import { LaunchPanel } from '../../components/launcher/LaunchPanel';
import { TileArt } from '../../components/launcher/TileArt';
import { JoinInstructions, QrCode, QrZoom, useJoinUrl } from '../../components/lobby/JoinInstructions';
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
import { useMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';

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
  const [qrZoom, setQrZoom] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [starting, setStarting] = useState(false);
  const joinUrl = useJoinUrl(room.code);
  const connected = room.players.filter((p) => p.isConnected).length;
  useMusic('menu');

  // Klang, wenn jemand dazukommt oder geht
  const lastCount = useRef(connected);
  useEffect(() => {
    if (connected > lastCount.current) playSfx('join');
    else if (connected < lastCount.current) playSfx('leave', { vol: 0.6 });
    lastCount.current = connected;
  }, [connected]);

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
    playSfx('start');
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
  const keyboard = !launchMeta && !settingsOpen && !sheet && !menuOpen && !qrZoom;

  const controllerName = !room.hostHasControl && room.controllerId ? room.players.find((p) => p.id === room.controllerId)?.name : null;
  const qrCorner = (
    <div className="flex h-full items-center gap-3 py-[1.2vh]">
      <button onClick={() => setQrZoom(true)} className="home-tile relative aspect-square h-full cursor-zoom-in rounded-[22%] p-[0.7vh]" title="QR-Code scannen zum Mitspielen – klicken zum Vergrößern" aria-label="QR-Code vergrößern">
        <QrCode text={joinUrl} className="size-full rounded-[16%] p-[6%]" />
        <span className="absolute -right-2 -top-2 grid min-w-7 place-items-center rounded-full border-2 border-white bg-[#ff8a1f] px-1.5 py-0.5 text-xs font-black text-white shadow-md" title="verbundene Spieler">
          {connected}
        </span>
      </button>
      <button onClick={() => setSheet('join')} className="flex flex-col items-start leading-none text-home-text" aria-label={`Raumcode ${room.code}`}>
        <span className="text-[clamp(0.55rem,0.75vw,0.8rem)] font-black uppercase tracking-[0.2em] text-home-muted">Raum</span>
        <span className="mt-1 text-[clamp(1.1rem,1.8vw,2rem)] font-black tracking-[0.08em] text-cyan-dark">{room.code}</span>
      </button>
    </div>
  );
  const statusCorner = (
    <div className="flex flex-col items-end gap-1">
      <Clock />
      {status !== 'connected' && <ConnectionStatusBadge status={status} />}
      {controllerName && <div className="text-xs font-bold text-home-muted">{controllerName} wählt per Handy</div>}
    </div>
  );

  return (
    <div className="home-bg relative flex h-dvh flex-col overflow-hidden">
      {/* weiche Hintergrundformen */}
      <div className="home-shape left-[6%] top-[38%] h-40 w-64 rotate-[-18deg]" />
      <div className="home-shape right-[8%] top-[8%] h-56 w-56 rotate-12" />
      <div className="home-shape bottom-[16%] right-[30%] h-24 w-72 rotate-[8deg]" />

      {/* Aufbau wie das Wii-U-Menü: oben links QR-Code (statt Mii), Seitenpunkte oben mittig,
          5 × 3 quadratische Kacheln, Symbolleiste über die ganze Breite unten */}
      <main className="relative z-10 flex min-h-0 w-full flex-1 px-[2vw] pb-[1vh]">
        <HomeGrid items={gridItems} focusedId={focusedId} onFocus={focus} onActivate={activate} keyboard={keyboard} fill corner={qrCorner} cornerRight={statusCorner} onGridWidth={setGridWidth} />
      </main>

      {/* Symbolleiste: gleichmäßig verteilt von Rasterkante zu Rasterkante */}
      <footer className="relative z-10 mx-auto w-full px-[2vw] pb-[2vh]" style={gridWidth ? { maxWidth: `calc(${gridWidth}px + 4vw)` } : undefined}>
        <HomeDock items={dock} spread />
      </footer>
      <QrZoom open={qrZoom} onClose={() => setQrZoom(false)} text={joinUrl} code={room.code} />

      <LaunchPanel
        meta={launchMeta}
        room={room}
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
          <li><b className="font-black text-cyan-dark">1.</b> Alle scannen den QR-Code oben links und geben ihren Namen ein.</li>
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

/** Uhr und Datum oben rechts (wie in einem Konsolen-Menü) */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right leading-none text-home-text">
      <div className="text-[clamp(1.6rem,2.4vw,2.6rem)] font-black tabular-nums tracking-tight">{now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="mt-1 text-[clamp(0.7rem,0.9vw,0.95rem)] font-extrabold uppercase tracking-[0.18em] text-home-muted">{now.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' })}</div>
    </div>
  );
}
