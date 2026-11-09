import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  /** Raster füllt den verfügbaren Platz mit möglichst großen, quadratischen Kacheln */
  fill?: boolean;
  /** Inhalt links in der oberen Leiste (neben den Seitenpunkten) */
  corner?: ReactNode;
  /** Inhalt rechts in der oberen Leiste */
  cornerRight?: ReactNode;
}

/** Kachelmaße so, dass das Raster Breite und Höhe ausnutzt */
function useFillLayout(enabled: boolean, columns: number, rows: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled]);
  // Kacheln immer quadratisch; Abstand = 10 % der Kachelgröße (wie beim Wii-U-Menü)
  const G = 0.1;
  const t = Math.max(0, Math.min(box.w / (columns + G * (columns - 1)), box.h / (rows + G * (rows - 1))));
  return { ref, gap: t * G, tw: t, th: t, ready: box.w > 0 && box.h > 0 };
}

/**
 * Seitenweises Kachelraster: Pfeiltasten bewegen die Auswahl, Enter startet,
 * Seitenpunkte oben und große Pfeile an den Rändern blättern.
 */
export function HomeGrid({ items, focusedId, onFocus, onActivate, columns = 5, rows = 3, keyboard = true, showArrows = true, fill = false, corner, cornerRight }: HomeGridProps) {
  const layout = useFillLayout(fill, columns, rows);
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
    <div className={fill ? 'relative flex size-full flex-col' : 'relative'}>
      {/* Seitenpunkte */}
      <div className={`${fill ? 'relative h-[14vh] shrink-0 items-center' : 'mb-[2.5%]'} flex justify-center gap-2.5`} aria-label={`Seite ${page + 1} von ${pageCount}`}>
        {corner && <div className="absolute inset-y-0 left-0 flex items-center">{corner}</div>}
        {cornerRight && <div className="absolute inset-y-0 right-0 flex items-center">{cornerRight}</div>}
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

      <div ref={layout.ref} className={fill ? 'relative flex min-h-0 flex-1 items-center justify-center' : 'relative'}>
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
            className={fill ? 'grid' : 'grid gap-[2.4%]'}
            style={
              fill
                ? { gridTemplateColumns: `repeat(${columns}, ${layout.tw}px)`, gridTemplateRows: `repeat(${rows}, ${layout.th}px)`, gap: layout.gap, visibility: layout.ready ? 'visible' : 'hidden' }
                : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            }
          >
            {slots.map((item, k) =>
              item ? (
                <HomeTile
                  key={item.id}
                  label={item.label}
                  art={item.art}
                  focused={item.id === focusedId}
                  actionLabel={item.actionLabel}
                  fill={fill}
                  onClick={() => (item.id === focusedId ? onActivate(item.id) : onFocus(item.id))}
                />
              ) : (
                <EmptyTile key={`empty-${k}`} fill={fill} />
              ),
            )}
          </motion.div>
        </AnimatePresence>

        {showArrows && page > 0 && <PageArrow side="left" edge={fill} onClick={() => goPage(page - 1)} />}
        {showArrows && page < pageCount - 1 && <PageArrow side="right" edge={fill} onClick={() => goPage(page + 1)} />}
      </div>
    </div>
  );
}

function PageArrow({ side, onClick, edge }: { side: 'left' | 'right'; onClick: () => void; edge?: boolean }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  if (edge) {
    // Lasche am Bildschirmrand (wie beim Wii-U-Menü)
    return (
      <button
        onClick={onClick}
        aria-label={side === 'left' ? 'Vorherige Seite' : 'Nächste Seite'}
        className={`absolute top-1/2 z-40 grid h-[clamp(5rem,16vh,10rem)] w-[clamp(2.5rem,3.6vw,4rem)] -translate-y-1/2 place-items-center bg-white/90 text-[#b9c1ca] shadow-[0_4px_16px_-4px_rgba(40,50,70,0.35)] transition hover:text-cyan ${
          side === 'left' ? '-left-[2vw] rounded-r-[999px] pr-1' : '-right-[2vw] rounded-l-[999px] pl-1'
        }`}
      >
        <Icon className="size-[70%]" strokeWidth={3} />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Vorherige Seite' : 'Nächste Seite'}
      className={`absolute top-1/2 z-40 grid size-[clamp(3rem,5vw,5rem)] -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#b9c1ca] shadow-lg backdrop-blur transition hover:text-cyan ${side === 'left' ? 'left-0' : 'right-0'}`}
    >
      <Icon className="size-2/3" strokeWidth={3} />
    </button>
  );
}
