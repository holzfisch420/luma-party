import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { ui } from '../../app/audio/sfx';
import { createPortal } from 'react-dom';
import { getClientGame } from '../../games/game-registry';
import type { GameMeta } from '../../shared/types/game';
import type { RoomSnapshot } from '../../shared/types/room';
import { Button } from '../ui/Button';
import { useGameSettings } from './GameSettingsSheet';
import { GameMetaChips } from './GameInfo';
import { TileArt } from './TileArt';

interface LaunchPanelProps {
  meta: GameMeta | null;
  room: RoomSnapshot;
  /** darf die Person Einstellungen ändern? */
  canEdit?: boolean;
  connectedPlayers: number;
  canStart: boolean;
  starting?: boolean;
  onStart: () => void;
  onSettings: () => void;
  onClose: () => void;
  /** Tastatur aktiv (aus, solange z. B. Einstellungen offen sind) */
  keyboard?: boolean;
}

/** Startbildschirm eines Spiels – erscheint nach Auswahl einer Kachel. */
export function LaunchPanel({ meta, room, canEdit = true, connectedPlayers, canStart, starting, onStart, onSettings, onClose, keyboard = true }: LaunchPanelProps) {
  const module = meta ? getClientGame(meta.id) : undefined;
  const available = !!meta && meta.status !== 'coming-soon' && !!module;
  const enough = !!meta && connectedPlayers >= meta.minPlayers;

  // Klang beim Öffnen
  useEffect(() => {
    if (meta) ui.open();
  }, [meta?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!meta || !keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      // ein offenes Fenster (z. B. eigene Sätze) bekommt die Tasten zuerst
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopImmediatePropagation();
        ui.back();
        onClose();
      } else if (e.key === 'Enter' && available && enough && canStart) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onStart();
      } else if (e.key.toLowerCase() === 'e' && module?.SettingsPanel) onSettings();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [meta, keyboard, available, enough, canStart, onClose, onStart, onSettings, module]);

  return createPortal(
    <AnimatePresence>
      {meta && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center font-sans sm:items-center sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Hintergrund in den Farben des Spiels */}
          <motion.div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: `radial-gradient(80% 70% at 30% 40%, color-mix(in srgb, ${meta.theme.from} 55%, transparent), transparent 70%), radial-gradient(70% 60% at 80% 70%, color-mix(in srgb, ${meta.theme.to} 50%, transparent), transparent 70%), rgba(223,229,234,0.55)` }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 50, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-y-auto rounded-t-[36px] border border-white bg-white text-home-text shadow-[0_40px_100px_-30px_rgba(40,50,70,0.65)] sm:flex-row sm:rounded-[40px]"
          >
            {/* linke Seite: Titelbild auf Spielfarben */}
            <div
              className="relative flex shrink-0 items-center justify-center overflow-hidden p-8 sm:w-[42%] sm:p-12"
              style={{ background: `linear-gradient(150deg, ${meta.theme.from}, ${meta.theme.via ?? meta.theme.from} 55%, ${meta.theme.to})` }}
            >
              <div className="absolute -left-1/4 -top-1/4 size-[80%] rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-1/3 -right-1/4 size-[90%] rounded-full bg-black/15 blur-2xl" />
              <motion.div
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.05 }}
                className="relative w-32 sm:w-full"
              >
                <div className="tile-glow" />
                <div className="relative aspect-square rounded-[24%] bg-white/90 p-[5%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
                  <div className="relative size-full overflow-hidden rounded-[20%]">
                    <TileArt meta={meta} focused />
                    <div className="tile-sheen" />
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-6 sm:p-10">
              <div>
                <h2 className="text-4xl font-black tracking-tight sm:text-7xl" style={{ backgroundImage: `linear-gradient(120deg, ${meta.theme.from}, ${meta.theme.accent})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                  {meta.name}
                </h2>
                <p className="mt-1 text-lg font-extrabold sm:text-2xl" style={{ color: meta.theme.accent }}>
                  {meta.tagline}
                </p>
              </div>
              <p className="text-base font-semibold text-home-muted sm:text-lg">{meta.description}</p>
              <GameMetaChips meta={meta} />
              {module?.QuickSettings && <QuickSettingsBox room={room} gameId={meta.id} disabled={!canEdit} />}
              <div className="mt-2 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="xl"
                  className={available && enough && canStart ? 'pulse-glow' : ''}
                  icon={<Play className="size-6 fill-current" />}
                  disabled={!available || !enough || !canStart}
                  loading={starting}
                  onClick={onStart}
                >
                  {available ? 'Start' : 'Bald verfügbar'}
                </Button>
                {module?.SettingsPanel && (
                  <Button size="xl" icon={<SlidersHorizontal className="size-5" />} onClick={onSettings}>
                    Einstellungen
                  </Button>
                )}
                <Button variant="ghost" size="xl" icon={<ArrowLeft className="size-5" />} onClick={onClose}>
                  Zurück
                </Button>
              </div>
              <p className="text-sm font-bold text-home-muted">
                {!available
                  ? 'Dieses Spiel ist in Arbeit.'
                  : !enough
                    ? `Noch ${meta.minPlayers - connectedPlayers} Spieler nötig – tretet über euer Handy bei.`
                    : !canStart
                      ? 'Der Host oder die auswahlberechtigte Person startet das Spiel.'
                      : 'Enter = Start · E = Einstellungen · Esc = Zurück'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function QuickSettingsBox({ room, gameId, disabled }: { room: RoomSnapshot; gameId: string; disabled: boolean }) {
  const module = getClientGame(gameId);
  const { settings, change } = useGameSettings(room, gameId);
  if (!module?.QuickSettings || settings === undefined) return null;
  const Quick = module.QuickSettings;
  return (
    <div className="rounded-3xl border border-home-line/70 bg-white/70 p-4">
      <Quick settings={settings} onChange={change} disabled={disabled} />
    </div>
  );
}
