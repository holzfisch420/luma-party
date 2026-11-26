import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { useGameSettings } from '../launcher/GameSettingsSheet';
import { resolveMenu } from './menu-model';
import { RulesView } from './RulesView';

/** Inhalt einer Menü-Unterseite – gleich auf Fernseher und Fernbedienung */
export function MenuPage({ room, gameId, view, device, disabled }: { room: RoomSnapshot; gameId: string; view: string; device: 'host' | 'phone'; disabled: boolean }) {
  const module = getClientGame(gameId);
  const { settings, change } = useGameSettings(room, gameId);
  if (!module) return null;
  const page = resolveMenu(module).view(view);
  if (!page) return null;
  if (page.id === 'rules' && !page.Content) return <RulesView gameId={gameId} />;
  if (settings === undefined) return null;
  if (page.Content) {
    const C = page.Content;
    return <C room={room} gameId={gameId} settings={settings} onChange={change} disabled={disabled} device={device} />;
  }
  const Panel = module.SettingsPanel;
  return Panel ? <Panel settings={settings} onChange={change} disabled={disabled} /> : null;
}
