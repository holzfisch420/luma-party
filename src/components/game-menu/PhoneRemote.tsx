import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Tv } from 'lucide-react';
import { haptics } from '../../app/haptics';
import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { MenuPage } from './MenuPage';
import { resolveMenu } from './menu-model';
import { useMenuActions } from './useMenuActions';

/** Handy der Spielleitung: Fernbedienung für das Spielmenü auf dem Fernseher */
export function PhoneRemote({ room }: { room: RoomSnapshot }) {
  const menu = room.menu!;
  const module = getClientGame(menu.gameId);
  const { run, starting, blocked } = useMenuActions(room, menu.gameId);
  if (!module) return null;
  const { items, view: pageOf } = resolveMenu(module);
  const page = menu.view === 'title' ? undefined : pageOf(menu.view);
  const t = module.meta.theme;
  const tap = (fn: () => void) => () => {
    haptics.play('light');
    fn();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden text-white safe-pt safe-pb" style={{ background: `linear-gradient(160deg, ${t.from}, ${t.via ?? t.from} 55%, ${t.to})` }}>
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/15 blur-3xl" />
      <header className="relative flex items-center gap-3 px-5 pt-4">
        {page && (
          <button onClick={tap(() => void run({ kind: 'back' }))} className="grid size-11 shrink-0 place-items-center rounded-full bg-black/25" aria-label="Zurück">
            <ArrowLeft className="size-6" />
          </button>
        )}
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-white/70">{page ? module.meta.name : 'Fernbedienung'}</div>
          <div className="truncate text-3xl font-black tracking-tight drop-shadow">{page ? page.title : module.meta.name}</div>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-black">
          <Tv className="size-4" /> Fernseher
        </span>
      </header>
      <AnimatePresence mode="wait">
        {page ? (
          <motion.div key={page.id} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} className="relative mx-4 mb-4 mt-4 min-h-0 flex-1 overflow-y-auto rounded-[28px] bg-white p-4 text-home-text shadow-xl">
            <MenuPage room={room} gameId={menu.gameId} view={page.id} device="phone" disabled={false} />
          </motion.div>
        ) : (
          <motion.div key="title" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} className="relative flex min-h-0 flex-1 flex-col justify-center gap-3 px-5">
            <p className="mb-2 text-lg font-bold text-white/85">{module.meta.tagline}</p>
            {items.map((it) => {
              const start = it.action.kind === 'start';
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  disabled={start && (!!blocked || starting)}
                  onClick={tap(() => void run(it.action))}
                  className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-left text-xl font-black shadow-lg transition active:scale-[0.97] disabled:opacity-45 ${
                    start ? 'bg-white text-[#1d1d1d]' : it.action.kind === 'back' ? 'bg-black/20 text-white/85' : 'bg-black/30 text-white'
                  }`}
                  style={start ? { color: t.from } : undefined}
                >
                  {Icon && <Icon className="size-6 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    {it.label}
                    {it.hint && <span className="block text-xs font-bold opacity-70">{it.hint}</span>}
                  </span>
                </button>
              );
            })}
            {blocked && <div className="rounded-2xl bg-black/35 px-4 py-2 text-center text-sm font-bold">{blocked}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative pb-3 text-center text-xs font-bold text-white/60">Alles erscheint gleichzeitig auf dem Fernseher</div>
    </div>
  );
}
