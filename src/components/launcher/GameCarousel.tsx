import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { GameMeta } from '../../shared/types/game';
import { GameCard } from './GameCard';

interface CarouselProps {
  games: GameMeta[];
  selectedId: string;
  onSelect: (id: string) => void;
  onActivate?: (id: string) => void;
  /** Breite einer Karte relativ zur Containerbreite */
  cardRatio?: number;
  interactive?: boolean;
}

/**
 * Horizontales Carousel: die ausgewählte Karte steht mittig und ist größer,
 * benachbarte Karten werden kleiner und abgedunkelt dargestellt.
 */
export function GameCarousel({ games, selectedId, onSelect, onActivate, cardRatio = 0.46, interactive = true }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const index = Math.max(0, games.findIndex((g) => g.id === selectedId));
  const cardWidth = width * cardRatio;
  const gap = cardWidth * 0.06;

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ height: (cardWidth * 10) / 16 + 40 }}>
      {games.map((g, i) => {
        const offset = i - index;
        const focused = offset === 0;
        const scale = focused ? 1 : 0.8;
        const x = width / 2 - cardWidth / 2 + offset * (cardWidth * 0.8 + gap) + (offset === 0 ? 0 : Math.sign(offset) * cardWidth * 0.1);
        return (
          <motion.div
            key={g.id}
            className="absolute top-5"
            style={{ width: cardWidth, zIndex: 10 - Math.abs(offset) }}
            initial={false}
            animate={{ x, scale, opacity: Math.abs(offset) > 2 ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }}
          >
            <motion.div
              animate={{ boxShadow: focused ? '0 40px 80px -20px rgba(0,0,0,0.75), 0 0 0 0 rgba(255,255,255,0)' : '0 20px 40px -20px rgba(0,0,0,0.6)' }}
              className="rounded-[28px]"
            >
              <GameCard
                meta={g}
                focused={focused}
                onClick={!interactive ? undefined : () => (focused ? onActivate?.(g.id) : onSelect(g.id))}
              />
            </motion.div>
            {focused && (
              <motion.div
                layoutId="carousel-focus"
                className="pointer-events-none absolute -inset-2 rounded-[34px] ring-[3px] ring-white/80"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
