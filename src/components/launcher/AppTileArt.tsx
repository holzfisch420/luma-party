import type { LucideIcon } from 'lucide-react';

/** Ordner-Kachel für „Apps“ (Wörter, Hilfe …): 3×3 Farbfelder mit großer Beschriftung. */
export function AppTileArt({ color, label }: { icon?: LucideIcon; color: string; label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#f4f6f8] [container-type:inline-size]">
      <div className="grid w-[86%] grid-cols-3 gap-[5%]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[18%] shadow-[inset_0_-3px_0_rgba(0,0,0,0.08)]"
            style={{ background: `color-mix(in srgb, ${color} ${[88, 78, 88, 78, 70, 78, 88, 78, 88][i]}%, #fff)` }}
          />
        ))}
      </div>
      <span className="absolute max-w-[94%] truncate text-[15cqw] font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,0.25),0_0_8px_rgba(0,0,0,0.15)]">
        {label}
      </span>
    </div>
  );
}
