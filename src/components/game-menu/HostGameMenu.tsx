import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ui } from '../../app/audio/sfx';
import { getClientGame } from '../../games/game-registry';
import type { RoomSnapshot } from '../../shared/types/room';
import { DefaultTitleScreen } from './DefaultTitleScreen';
import { MenuPage } from './MenuPage';
import { resolveMenu } from './menu-model';
import { useMenuActions } from './useMenuActions';

/**
 * Spielmenü auf dem Fernseher: Titelbildschirm des Spiels, darüber die Unterseiten.
 * Bedienbar mit Pfeiltasten/Enter/Esc – oder vom Handy der Spielleitung aus.
 */
export function HostGameMenu({ room }: { room: RoomSnapshot }) {
  const menu = room.menu;
  return <AnimatePresence>{menu && <Open key={menu.gameId} room={room} gameId={menu.gameId} view={menu.view} />}</AnimatePresence>;
}

function Open({ room, gameId, view }: { room: RoomSnapshot; gameId: string; view: string }) {
  const module = getClientGame(gameId)!;
  const { items, view: pageOf } = resolveMenu(module);
  const [focus, setFocusState] = useState(0);
  const { run, starting, blocked } = useMenuActions(room, gameId);
  const page = view === 'title' ? undefined : pageOf(view);
  const Title = module.TitleScreen ?? DefaultTitleScreen;

  const setFocus = (i: number) => {
    const n = (i + items.length) % items.length;
    if (n !== focus) ui.move();
    setFocusState(n);
  };
  const activate = (i: number) => {
    setFocusState(i);
    void run(items[i]!.action);
  };

  useEffect(() => {
    ui.open();
    // Spielansicht vorladen, damit der Start sofort klappt
    (module.HostView as { preload?: () => unknown }).preload?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key;
      if (k === 'Escape' || k === 'Backspace') {
        e.preventDefault();
        e.stopImmediatePropagation();
        void run({ kind: 'back' });
        return;
      }
      if (page) return; // Unterseiten bedient man mit Maus/Handy
      if (k === 'ArrowRight' || k === 'ArrowDown') setFocus(focus + 1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') setFocus(focus - 1);
      else if (k === 'Enter' || k === ' ') activate(focus);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const t = module.meta.theme;
  return (
    <motion.div className="fixed inset-0 z-40 overflow-hidden" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
      <Title meta={module.meta} room={room} items={items} focus={focus} setFocus={setFocus} activate={activate} blocked={blocked} starting={starting} />
      <AnimatePresence>
        {page && (
          <motion.div key={page.id} className="absolute inset-0 z-20 flex items-center justify-center p-[4vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => void run({ kind: 'back' })} />
            <motion.div
              initial={{ y: 40, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[32px] bg-white text-home-text shadow-2xl"
              style={{ boxShadow: `0 0 0 6px ${t.accent}, 0 40px 100px -30px rgba(0,0,0,0.7)` }}
            >
              <div className="flex items-center gap-4 px-8 py-5 text-white" style={{ background: `linear-gradient(120deg, ${t.from}, ${t.via ?? t.from} 60%, ${t.to})` }}>
                <button onClick={() => void run({ kind: 'back' })} className="grid size-11 place-items-center rounded-full bg-white/20 hover:bg-white/30" aria-label="Zurück">
                  <ArrowLeft className="size-6" />
                </button>
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-white/75">{module.meta.name}</div>
                  <div className="text-3xl font-black">{page.title}</div>
                </div>
                <span className="ml-auto text-sm font-bold text-white/70">Esc = zurück</span>
              </div>
              <div className="min-h-0 overflow-y-auto px-8 py-6">
                <MenuPage room={room} gameId={gameId} view={page.id} device="host" disabled={false} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
