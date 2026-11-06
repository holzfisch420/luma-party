import { LogOut, RefreshCw, Square } from 'lucide-react';
import { useState } from 'react';
import type { RoomSnapshot } from '../../shared/types/room';
import { Button } from '../../components/ui/Button';
import { SettingRow, Toggle } from '../../components/ui/Controls';
import { Modal } from '../../components/ui/Modal';
import { getSocket } from '../session/socket';

export function HostMenu({ room, open, onClose, onNewRoom }: { room: RoomSnapshot; open: boolean; onClose: () => void; onNewRoom: () => void }) {
  const [confirmNew, setConfirmNew] = useState(false);
  const socket = getSocket();
  return (
    <Modal open={open} onClose={onClose} title="Einstellungen" subtitle={`Raum ${room.code}`}>
      <div className="divide-y divide-home-line/70">
        <SettingRow label="Spielauswahl nur am Bildschirm" hint="Sperrt die Auswahl über das Handy der ersten Person">
          <Toggle checked={room.hostHasControl} onChange={(enabled) => socket.emit('room:setHostControl', { enabled })} label="Host-Steuerung" />
        </SettingRow>
        {room.phase !== 'lobby' && (
          <SettingRow label={<span className="flex items-center gap-2"><Square className="size-4" /> Spiel beenden</span>} hint="Zurück zum Home-Menü (Punkte gehen verloren)">
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
  );
}
