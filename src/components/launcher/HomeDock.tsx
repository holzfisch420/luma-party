import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export interface DockItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

/** Icon-Leiste am unteren Bildschirmrand. */
export function HomeDock({ items, spread = false }: { items: DockItem[]; spread?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <nav className={`flex items-end ${spread ? 'w-full justify-between' : 'justify-center gap-[clamp(0.75rem,3vw,3.5rem)]'}`} aria-label="Werkzeuge">
      {items.map((item) => (
        <div key={item.id} className="relative flex flex-col items-center">
          {hover === item.id && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full mb-2 whitespace-nowrap rounded-full border border-home-line bg-white px-3 py-1 text-sm font-extrabold shadow-md">
              {item.label}
            </motion.div>
          )}
          <motion.button
            onClick={item.onClick}
            onMouseEnter={() => setHover(item.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(item.id)}
            onBlur={() => setHover(null)}
            whileHover={{ y: -4, scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            aria-label={item.label}
            className="grid size-[clamp(3rem,5vw,4.75rem)] place-items-center rounded-[28%] border-b-4 text-white shadow-[0_6px_14px_-6px_rgba(40,50,70,0.5)]"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${item.color} 80%, #fff), ${item.color})`,
              borderColor: `color-mix(in srgb, ${item.color} 70%, #000)`,
            }}
          >
            <item.icon className="size-1/2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
          </motion.button>
        </div>
      ))}
    </nav>
  );
}
