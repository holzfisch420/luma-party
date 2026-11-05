import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { emitWithAck } from '../../app/session/socket';
import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

/**
 * Generisches Einstellungs-Sheet: rendert das SettingsPanel des Spiels
 * und synchronisiert Änderungen (optimistisch) mit dem Server.
 */
export function GameSettingsSheet({ room, gameId, open, onClose, disabled }: { room: RoomSnapshot; gameId: string; open: boolean; onClose: () => void; disabled?: boolean }) {
  const module = getClientGame(gameId);
  const toast = useToast();
  const serverSettings = room.gameSettings[gameId];
  const [draft, setDraft] = useState(serverSettings);
  const pending = useRef(0);

  // Serverstand übernehmen, solange keine eigene Änderung unterwegs ist
  useEffect(() => {
    if (pending.current === 0) setDraft(serverSettings);
  }, [serverSettings]);

  if (!module?.SettingsPanel) return null;
  const Panel = module.SettingsPanel;

  const change = (next: unknown) => {
    setDraft(next);
    pending.current++;
    emitWithAck('room:updateSettings', { gameId, settings: next })
      .catch((e: Error) => {
        toast(e.message, 'error');
        setDraft(serverSettings);
      })
      .finally(() => pending.current--);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<span className="flex items-center gap-2"><SlidersHorizontal className="size-6" /> {module.meta.name} – Einstellungen</span>}
      subtitle="Änderungen gelten sofort für alle im Raum."
    >
      {draft !== undefined && <Panel settings={draft} onChange={change} disabled={disabled} />}
    </Modal>
  );
}
