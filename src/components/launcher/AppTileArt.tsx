import type { LucideIcon } from 'lucide-react';

/** App-Kachel (Beitreten, Wörter, Hilfe …): glänzender Farbverlauf, großes Symbol in einer Glaskugel, Beschriftung. */
export function AppTileArt({ icon: Icon, color, label }: { icon?: LucideIcon; color: string; label: string }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden [container-type:inline-size]"
      style={{ background: `radial-gradient(120% 90% at 30% 15%, color-mix(in srgb, ${color} 55%, #fff), ${color} 55%, color-mix(in srgb, ${color} 70%, #000))` }}
    >
      {/* Lichtkreise */}
      <div className="absolute -right-[18%] -top-[18%] size-[62%] rounded-full bg-white/15" />
      <div className="absolute -bottom-[25%] -left-[10%] size-[70%] rounded-full bg-black/10" />
      {Icon && (
        <div className="absolute left-1/2 top-[42%] grid size-[52%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),0_8px_18px_-6px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <Icon className="size-[58%] text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.25)]" strokeWidth={2.4} />
        </div>
      )}
      <span className="absolute inset-x-0 bottom-[8%] truncate px-[6%] text-center text-[13cqw] font-black text-white [text-shadow:0_2px_0_rgba(0,0,0,0.22)]">{label}</span>
    </div>
  );
}
