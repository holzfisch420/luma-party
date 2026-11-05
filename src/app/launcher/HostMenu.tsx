import { BookOpen, Gamepad2, LogOut, RefreshCw, Square } from 'lucide-react';
import { useState } from 'react';
import type { RoomSnapshot } from '../../shared/types/room';
import { Button } from '../../components/ui/Button';
import { SettingRow, Toggle } from '../../components/ui/Controls';
import { Modal } from '../../components/ui/Modal';
import { WordManager } from '../../components/word-manager/WordManager';
import { getSocket } from '../session/socket';

export function HostMenu({ room, open, onClose, onNewRoom }: { room: RoomSnapshot; open: boolean; onClose: () => void; onNewRoom: () => void }) {
  const [words, setWords] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const socket = getSocket();
  return (
    <>
      <Modal open={open && !words} onClose={onClose} title="Einstellungen" subtitle={`Raum ${room.code}`}>
        <div className="divide-y divide-white/[0.06]">
          <SettingRow
            label={<span className="flex items-center gap-2"><Gamepad2 className="size-4" /> Spielauswahl am Bildschirm</span>}
            hint="Sperrt die Auswahl über das Smartphone des ersten Spielers"
          >
            <Toggle checked={room.hostHasControl} onChange={(enabled) => socket.emit('room:setHostControl', { enabled })} label="Host-Steuerung" />
          </SettingRow>
          <SettingRow label={<span className="flex items-center gap-2"><BookOpen className="size-4" /> Eigene Wörter</span>} hint="Wortlisten anlegen und bearbeiten">
            <Button size="sm" onClick={() => setWords(true)}>Verwalten</Button>
          </SettingRow>
          {room.phase !== 'lobby' && (
            <SettingRow label={<span className="flex items-center gap-2"><Square className="size-4" /> Spiel beenden</span>} hint="Zurück zum Launcher (Punkte gehen verloren)">
              <Button size="sm" variant="danger" onClick={() => { socket.emit('room:backToLauncher'); onClose(); }}>Beenden</Button>
            </SettingRow>
          )}
          <SettingRow label={<span className="flex items-center gap-2"><RefreshCw className="size-4" /> Neuer Raum</span>} hint="Schließt diesen Raum – alle Spieler werden getrennt">
            {confirmNew ? (
              <div className="flex gap-2">
                <Button size="sm" variant="danger" icon={<LogOut className="size-4" />} onClick={() => { setConfirmNew(false); onNewRoom(); onClose(); }}>Schließen</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmNew(false)}>Abbrechen</Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setConfirmNew(true)}>Neu erstellen</Button>
            )}
          </SettingRow>
        </div>
      </Modal>
      <Modal open={open && words} onClose={() => setWords(false)} title="Eigene Wörter" subtitle="Listen werden dauerhaft gespeichert und sind in den Spieleinstellungen auswählbar." width="max-w-3xl">
        <WordManager />
      </Modal>
    </>
  );
}
