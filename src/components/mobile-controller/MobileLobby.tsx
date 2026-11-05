import { motion } from 'framer-motion';
import { BookOpen, Gamepad2, LogOut, MonitorOff, Tv } from 'lucide-react';
import { useState } from 'react';
import type { ConnectionStatus } from '../../app/session/session-store';
import { listLauncherGames } from '../../games/game-registry';
import type { PublicPlayer, RoomSnapshot } from '../../shared/types/room';
import { GameCard } from '../launcher/GameCard';
import { GameMetaChips } from '../launcher/GameInfo';
import { PlayerAvatar } from '../lobby/PlayerAvatar';
import { PlayerList } from '../lobby/PlayerList';
import { Button } from '../ui/Button';
import { ConnectionStatusBadge } from '../ui/Feedback';
import { Modal } from '../ui/Modal';
import { WordManager } from '../word-manager/WordManager';
import { MobileGameBrowser } from './MobileGameBrowser';

export function MobileLobby({ room, me, status, onLeave }: { room: RoomSnapshot; me: PublicPlayer; status: ConnectionStatus; onLeave: () => void }) {
  const [wordsOpen, setWordsOpen] = useState(false);
  const isController = room.controllerId === me.id;
  const canSelect = isController && !room.hostHasControl;
  const controller = room.players.find((p) => p.id === room.controllerId);
  const selected = listLauncherGames().find((g) => g.id === room.selectedGameId);

  return (
    <div className="app-backdrop min-h-dvh px-5 pb-10 safe-pt">
      <header className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-sm font-semibold tracking-[0.2em]">{room.code}</div>
        <div className="flex items-center gap-2">
          <ConnectionStatusBadge status={status} compact />
          <button onClick={onLeave} className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-sm text-white/70" aria-label="Raum verlassen">
            <LogOut className="size-4" /> Verlassen
          </button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-4">
        <PlayerAvatar name={me.name} color={me.avatarColor} size="lg" />
        <div className="min-w-0">
          <div className="text-sm text-white/50">Du bist dabei!</div>
          <div className="truncate text-3xl font-semibold tracking-tight">{me.name}</div>
        </div>
      </motion.div>

      {!room.hostConnected && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <MonitorOff className="size-5 shrink-0" /> Der Hauptbildschirm ist gerade nicht verbunden.
        </div>
      )}

      <section className="mt-8">
        {canSelect ? (
          <>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
              <Gamepad2 className="size-4" /> Du wählst das Spiel
            </div>
            <MobileGameBrowser room={room} />
          </>
        ) : (
          <div className="glass flex flex-col gap-4 rounded-[28px] p-4">
            {selected && <GameCard meta={selected} focused />}
            {selected && (
              <div className="px-1">
                <div className="text-xl font-semibold">{selected.name}</div>
                <div className="mt-2"><GameMetaChips meta={selected} /></div>
              </div>
            )}
            <div className="flex items-center gap-2 px-1 text-sm text-white/55">
              <Tv className="size-4 shrink-0" />
              {room.hostHasControl || !controller
                ? 'Der Host wählt das Spiel am Bildschirm.'
                : isController
                  ? 'Der Host hat die Auswahl übernommen.'
                  : `${controller.name} wählt das Spiel aus …`}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{room.players.length} im Raum</div>
        <PlayerList players={room.players} controllerId={room.controllerId} hostHasControl={room.hostHasControl} meId={me.id} />
      </section>

      <Button variant="ghost" className="mt-8 w-full" icon={<BookOpen className="size-4" />} onClick={() => setWordsOpen(true)}>
        Eigene Wörter verwalten
      </Button>
      <Modal open={wordsOpen} onClose={() => setWordsOpen(false)} title="Eigene Wörter" subtitle="Für den Modus „Eigene Wörter“ oder „Mix“.">
        <WordManager />
      </Modal>
    </div>
  );
}
