import { GENRES, type Media } from '../data/catalog';

/** Plakat-artige Karte: Farbe und Symbol vom Hauptgenre, Titel, Jahr, Genres, Kurzbeschreibung */
export function MediaCard({ media, size = 'md', className = '' }: { media: Media; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const g = GENRES[media.genres[0] ?? 'drama'];
  const g2 = GENRES[media.genres[1] ?? media.genres[0] ?? 'drama'];
  const big = size === 'lg';
  const small = size === 'sm';
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[28px] text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] ${className}`}
      style={{ background: `linear-gradient(160deg, ${g.color} 0%, color-mix(in srgb, ${g2.color} 70%, #000) 70%, #120a14 100%)` }}
    >
      {/* Deko: großes Genre-Symbol und Lichtkreise */}
      <div className="pointer-events-none absolute -right-[8%] -top-[6%] select-none text-[9rem] leading-none opacity-30 blur-[1px]" style={{ fontSize: big ? '12rem' : small ? '5rem' : '9rem' }}>
        {g.emoji}
      </div>
      <div className="pointer-events-none absolute -left-16 bottom-10 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className={`relative flex items-center gap-2 ${small ? 'px-3 pt-3' : 'px-5 pt-5'}`}>
        <span className={`rounded-full bg-black/35 font-black uppercase tracking-[0.18em] ${small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}>{media.type === 'film' ? '🎬 Film' : '📺 Serie'}</span>
        <span className={`rounded-full bg-white/20 font-black ${small ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>{media.year}</span>
      </div>
      <div className={`relative mt-auto flex flex-col ${small ? 'gap-1 p-3' : 'gap-2 p-5'}`}>
        <div className={`font-black leading-[1.05] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${big ? 'text-5xl' : small ? 'text-lg' : 'text-[clamp(1.6rem,8vw,2.4rem)]'}`}>{media.title}</div>
        <div className="flex flex-wrap gap-1">
          {media.genres.map((id) => (
            <span key={id} className={`rounded-full bg-black/30 font-extrabold ${small ? 'px-1.5 text-[9px]' : 'px-2 py-0.5 text-xs'}`}>
              {GENRES[id].emoji} {GENRES[id].label}
            </span>
          ))}
        </div>
        {!small && <p className={`font-semibold leading-snug text-white/90 ${big ? 'text-xl' : 'text-[15px]'}`}>{media.desc}</p>}
      </div>
    </div>
  );
}
