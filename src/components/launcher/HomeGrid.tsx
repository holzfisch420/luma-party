import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { EmptyTile, HomeTile } from './HomeTile';

export interface GridItem {
  id: string;
  label: string;
  art: ReactNode;
  actionLabel?: string;
}

interface HomeGridProps {
  items: GridItem[];
  focusedId: string | null;
  onFocus: (id: string) => void;
  onActivate: (id: string) => void;
  columns?: number;
  rows?: number;
  /** Tastatur-/Fernbedienungssteuerung aktiv */
  keyboard?: boolean;
  showArrows?: boolean;
}

/**
 * Seitenweises Kachelraster: Pfeiltasten bewegen die Auswahl, Enter startet,
 * Seitenpunkte oben und große Pfeile an den Rändern blättern.
 */
export function HomeGrid({ items, focusedId, onFocus, onActivate, columns = 5, rows = 3, keyboard = true, showArrows = true }: HomeGridProps) {
  const perPage = columns * rows;
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const focusedIndex = Math.max(0, items.findIndex((i) => i.id === focusedId));
  const [page, setPage] = useState(Math.floor(focusedIndex / perPage));
  const [direction, setDirection] = useState(1);

  // Seite folgt der Auswahl (z. B. wenn ein Smartphone ein Spiel wählt)
  useEffect(() => {
    const p = Math.floor(focusedIndex / perPage);
    setDirection(p >= page ? 1 : -1);
    setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex, perPage]);

  const goPage = (p: number) => {
    const next = Math.min(pageCount - 1, Math.max(0, p));
    if (next === page) return;
    setDirection(next > page ? 1 : -1);
    setPage(next);
    const first = items[next * perPage];
    if (first) onFocus(first.id);
  };

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const i = focusedIndex;
      const samePage = (j: number) => Math.floor(j / perPage) === Math.floor(i / perPage);
      let next: number | null = null;
      if (e.key === 'ArrowRight') next = i + 1;
      else if (e.key === 'ArrowLeft') next = i - 1;
      else if (e.key === 'ArrowDown') next = samePage(i + columns) ? i + columns : null;
      else if (e.key === 'ArrowUp') next = samePage(i - columns) ? i - columns : null;
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (items[i]) onActivate(items[i].id);
        return;
      } else return;
      e.preventDefault();
      if (next !== null && next >= 0 && next < items.length) onFocus(items[next]!.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, items, focusedIndex, columns, perPage, onFocus, onActivate]);

  const slots = Array.from({ length: perPage }, (_, k) => items[page * perPage + k] ?? null);

  return (
    <div className="relative">
      {/* Seitenpunkte */}
      <div className="mb-[2.5%] flex justify-center gap-2.5" aria-label={`Seite ${page + 1} von ${pageCount}`}>
        {Array.from({ length: Math.max(pageCount, 1) }).map((_, p) => (
          <motion.button
            key={p}
            onClick={() => goPage(p)}
            aria-label={`Seite ${p + 1}`}
            animate={{ width: p === page ? 28 : 13, backgroundColor: p === page ? '#1fb3d4' : '#c4cbd3' }}
            className="h-[13px] rounded-[5px] shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]"
          />
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: `${d * 60}%`, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: `${d * -60}%`, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="grid gap-[2.4%]"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {slots.map((item, k) =>
              item ? (
                <HomeTile
                  key={item.id}
                  label={item.label}
                  art={item.art}
                  focused={item.id === focusedId}
                  actionLabel={item.actionLabel}
                  onClick={() => (item.id === focusedId ? onActivate(item.id) : onFocus(item.id))}
                />
              ) : (
                <EmptyTile key={`empty-${k}`} />
              ),
            )}
          </motion.div>
        </AnimatePresence>

        {showArrows && page > 0 && (
          <PageArrow side="left" onClick={() => goPage(page - 1)} />
        )}
        {showArrows && page < pageCount - 1 && <PageArrow side="right" onClick={() => goPage(page + 1)} />}
      </div>
    </div>
  );
}

function PageArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Vorherige Seite' : 'Nächste Seite'}
      className={`absolute top-1/2 grid size-[clamp(3rem,6vw,6rem)] -translate-y-1/2 place-items-center rounded-full bg-white/70 text-[#b9c1ca] shadow-lg backdrop-blur transition hover:text-cyan ${side === 'left' ? '-left-[5%]' : '-right-[5%]'}`}
    >
      <Icon className="size-2/3" strokeWidth={3} />
    </button>
  );
}
