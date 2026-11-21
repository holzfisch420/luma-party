import { useState } from 'react';
import { GENRES, type Media } from '../data/catalog';

/**
 * Karte wie ein Kinoplakat: oben das Cover (TMDB) – oder gezeichnete Ersatzgrafik –,
 * darunter Titel, Jahr, Genres und die Kurzbeschreibung.
 */
export function MediaCard({ media, poster, size = 'md', className = '' }: { media: Media; poster?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [broken, setBroken] = useState(false);
  const g = GENRES[media.genres[0] ?? 'drama'];
  const g2 = GENRES[media.genres[1] ?? media.genres[0] ?? 'drama'];
  const big = size === 'lg';
  const small = size === 'sm';
  const showImg = !!poster && !broken;
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[26px] bg-[#1c1220] text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`}>
      {/* Cover */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={showImg ? undefined : { background: `linear-gradient(160deg, ${g.color} 0%, color-mix(in srgb, ${g2.color} 70%, #000) 75%, #120a14 100%)` }}>
        {showImg ? (
          <>
            {/* unscharfer Hintergrund füllt Ränder, das Cover selbst bleibt vollständig sichtbar */}
            <img src={poster!} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-xl" />
            <img src={poster!} alt={`Cover: ${media.title}`} draggable={false} onError={() => setBroken(true)} className="relative size-full object-contain" />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="select-none leading-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" style={{ fontSize: big ? '9rem' : small ? '3.5rem' : '7rem' }}>
              {g.emoji}
            </span>
            <div className="pointer-events-none absolute -left-16 bottom-6 size-48 rounded-full bg-white/10 blur-2xl" />
          </div>
        )}
        <div className={`absolute left-0 top-0 flex gap-1.5 ${small ? 'p-2' : 'p-3'}`}>
          <span className={`rounded-full bg-black/55 font-black uppercase tracking-[0.16em] backdrop-blur ${small ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]'}`}>{media.type === 'film' ? '🎬 Film' : '📺 Serie'}</span>
          <span className={`rounded-full bg-black/55 font-black backdrop-blur ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'}`}>{media.year}</span>
        </div>
      </div>
      {/* Titel und Beschreibung unter dem Cover */}
      <div className={`relative flex shrink-0 flex-col ${small ? 'gap-1 p-3' : 'gap-1.5 px-4 pb-4 pt-3'}`} style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${g.color} 22%, #1c1220), #1c1220)` }}>
        <div className={`font-black leading-[1.08] tracking-tight ${big ? 'text-4xl' : small ? 'text-base' : 'text-[clamp(1.35rem,6.5vw,1.9rem)]'}`}>{media.title}</div>
        <div className="flex flex-wrap gap-1">
          {media.genres.map((id) => (
            <span key={id} className={`rounded-full bg-white/10 font-extrabold ${small ? 'px-1.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'}`}>
              {GENRES[id].emoji} {GENRES[id].label}
            </span>
          ))}
        </div>
        {!small && <p className={`font-semibold leading-snug text-white/85 ${big ? 'text-lg' : 'line-clamp-3 text-[14px]'}`}>{media.desc}</p>}
      </div>
    </div>
  );
}
