import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useMusic } from '../../../../app/audio/music';
import { PlayerAvatar } from '../../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { MEDIA_BY_ID } from '../../data/catalog';
import type { KinoPublicState } from '../../types';
import { MediaCard } from '../MediaCard';
import { usePosters } from '../posters';

export function KinoHostView({ room, state }: HostViewProps<KinoPublicState>) {
  const pub = state.public;
  const posters = usePosters(pub.deck);
  const withCovers = Object.values(posters).some(Boolean);
  useMusic(pub.phase === 'results' ? 'results' : null, 0.8);
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_-10%,#6b1240,#14060f_70%)] text-white">
      <header className="flex items-center gap-4 px-[3vw] pt-5">
        <span className="text-5xl font-black tracking-tight [text-shadow:0_4px_20px_rgba(255,77,109,0.6)]">Couch-Match</span>
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-lg font-black">{pub.phase === 'swipe' ? `${pub.deck.length} Titel – alle wischen auf dem Handy` : 'Eure Rangliste'}</span>
        {withCovers && <span className="ml-auto mr-[8vw] max-w-[22vw] text-right text-[10px] font-bold leading-tight text-white/40">Cover: TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</span>}
      </header>
      {pub.phase === 'swipe' ? <Swiping room={room} pub={pub} posters={posters} /> : <Results room={room} pub={pub} posters={posters} />}

    </div>
  );
}

function Avatar({ room, id, size = 'md' }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const p = room.players.find((x) => x.id === id);
  return <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#ff4d6d'} avatar={p?.avatar} size={size} dimmed={p ? !p.isConnected : true} />;
}

function Swiping({ room, pub, posters }: { room: RoomSnapshot; pub: KinoPublicState; posters: Record<string, string | null> }) {
  const total = pub.deck.length;
  // ein paar Karten als Deko-Fächer
  const deco = pub.deck.slice(0, 5).map((id) => MEDIA_BY_ID.get(id)!);
  return (
    <main className="flex min-h-0 flex-1 items-center gap-[4vw] px-[5vw]">
      <div className="relative ml-[2vw] mr-[3vw] h-[58vh] w-[24vw] shrink-0">
        {deco.map((m, i) => (
          <motion.div
            key={m.id}
            className="absolute inset-0"
            initial={{ rotate: 0, x: 0 }}
            animate={{ rotate: (i - 2) * 7, x: (i - 2) * 26, y: Math.abs(i - 2) * 10 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.08 }}
          >
            <div className="size-full blur-[6px] brightness-75">
              <MediaCard media={m} poster={posters[m.id]} className="size-full" />
            </div>
            <div className="absolute inset-0 grid place-items-center text-7xl font-black text-white/80">?</div>
          </motion.div>
        ))}
      </div>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3">
        <div className="text-3xl font-black text-white/90">Wer ist schon durch?</div>
        {pub.swipers.map((id) => {
          const n = pub.progress[id] ?? 0;
          const done = n >= total;
          return (
            <div key={id} className="flex items-center gap-4 rounded-2xl bg-white/[0.07] px-4 py-3">
              <Avatar room={room} id={id} size="md" />
              <span className="w-48 truncate text-2xl font-black">{room.players.find((p) => p.id === id)?.name}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#ff8fa3] to-[#ff2e63]" animate={{ width: `${(n / total) * 100}%` }} />
              </div>
              <span className={`w-24 text-right text-xl font-black tabular-nums ${done ? 'text-[#51cf66]' : 'text-white/70'}`}>{done ? 'fertig ✓' : `${n}/${total}`}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function Results({ room, pub, posters }: { room: RoomSnapshot; pub: KinoPublicState; posters: Record<string, string | null> }) {
  const liked = (pub.results ?? []).filter((r) => r.likers.length > 0);
  const top = liked.slice(0, 3);
  const rest = liked.slice(3, 11);
  const all = pub.swipers.length;
  if (liked.length === 0)
    return (
      <main className="grid flex-1 place-items-center text-center">
        <div>
          <div className="text-6xl font-black">Kein einziges Match 🙈</div>
          <div className="mt-3 text-2xl font-bold text-white/70">Auf dem Handy der Spielleitung gibt es eine neue Runde.</div>
        </div>
      </main>
    );
  return (
    <main className="flex min-h-0 flex-1 gap-[2.5vw] px-[3vw] py-5">
      <div className="flex min-w-0 flex-[3] items-stretch gap-[1.5vw]">
        {top.map((r, i) => {
          const m = MEDIA_BY_ID.get(r.id)!;
          const perfect = all > 1 && r.likers.length === all;
          return (
            <motion.div key={r.id} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + (2 - i) * 0.35, type: 'spring', stiffness: 120, damping: 14 }} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full text-2xl font-black ${i === 0 ? 'bg-[#ffd23f] text-[#5c3d00]' : i === 1 ? 'bg-[#dee2e6] text-[#343a40]' : 'bg-[#e8a87c] text-[#4a2410]'}`}>{i + 1}</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-2xl font-black text-[#ff8fa3]">
                  <Heart className="size-6" fill="currentColor" /> {r.likers.length}
                </span>
                {perfect && (
                  <span className="ml-auto flex items-center gap-1 whitespace-nowrap rounded-full bg-[#51cf66] px-3 py-1 text-sm font-black text-[#0b3d1a]">
                    <Sparkles className="size-4" /> Alle wollen!
                  </span>
                )}
              </div>
              <MediaCard media={m} poster={posters[r.id]} size="md" className="min-h-0 flex-1" />
              <div className="flex flex-wrap gap-1">
                {r.likers.map((id) => (
                  <Avatar key={id} room={room} id={id} size="sm" />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div className="flex w-[26vw] flex-col gap-2">
          <div className="text-sm font-black uppercase tracking-[0.2em] text-white/60">Auch beliebt</div>
          {rest.map((r, i) => {
            const m = MEDIA_BY_ID.get(r.id)!;
            return (
              <motion.div key={r.id} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.6 + i * 0.1 }} className="rounded-2xl bg-white/[0.07] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-lg font-black text-white/50">{i + 4}</span>
                  {posters[r.id] && <img src={posters[r.id]!} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xl font-black">{m.title}</span>
                      <span className="flex shrink-0 items-center gap-1 text-lg font-black text-[#ff8fa3]">
                        <Heart className="size-4" fill="currentColor" /> {r.likers.length}
                      </span>
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold text-white/60">{m.desc}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
