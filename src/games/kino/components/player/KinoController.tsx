import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Check, Heart, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { playSfx } from '../../../../app/audio/sfx';
import { haptics } from '../../../../app/haptics';
import type { PlayerViewProps } from '../../../game-types';
import { MEDIA_BY_ID } from '../../data/catalog';
import type { KinoPrivateState, KinoPublicState } from '../../types';
import { MediaCard } from '../MediaCard';
import { preloadPosters, usePosters } from '../posters';

type Props = PlayerViewProps<KinoPublicState, KinoPrivateState>;

export function KinoController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const canControl = room.controllerId === me.id && !room.hostHasControl;
  // lokal sofort weiter, ohne auf den Server zu warten
  const [local, setLocal] = useState<Record<string, boolean>>({});
  useEffect(() => setLocal({}), [pub.round]);
  const votes = { ...(priv?.votes ?? {}), ...local };
  const queue = useMemo(() => (priv?.order ?? []).filter((id) => !(id in votes)), [priv?.order, votes]);
  const posters = usePosters(pub.deck);
  // die nächsten Cover vorladen
  useEffect(() => preloadPosters(queue.slice(0, 4).map((id) => posters[id])), [queue, posters]);

  if (pub.phase === 'results') return <PhoneResults pub={pub} meId={me.id} canControl={canControl} posters={posters} onAgain={() => sendAction('again')} />;
  if (!priv) return <Center title="Gleich geht’s los" text="Du wischst in der nächsten Runde mit." />;

  const done = Object.keys(votes).length;
  const total = pub.deck.length;
  const swipe = (id: string, like: boolean) => {
    setLocal((l) => ({ ...l, [id]: like }));
    sendAction('swipe', { id, like });
    playSfx(like ? 'pop' : 'swish', { vol: 0.5, rate: like ? 1.2 : 1 });
    haptics.play(like ? 'success' : 'light');
  };

  if (queue.length === 0) {
    const waiting = pub.swipers.filter((id) => (pub.progress[id] ?? 0) < total);
    return (
      <Center
        title="Fertig! 🍿"
        text={waiting.length ? `Warte auf ${waiting.map((id) => room.players.find((p) => p.id === id)?.name ?? '?').join(', ')} …` : 'Gleich kommt die Auswertung auf dem Fernseher.'}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex touch-none select-none flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#4a0f2e,#14060f)] px-4 pb-4 text-white safe-pt safe-pb">
      <div className="flex items-center justify-between pt-3">
        <span className="text-xl font-black tracking-tight">Couch-Match</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black tabular-nums">
          {done + 1} / {total}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#ff4d6d] transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <div className="relative mt-4 min-h-0 flex-1">
        {queue.slice(0, 3).reverse().map((id, i, arr) => {
          const top = i === arr.length - 1;
          const m = MEDIA_BY_ID.get(id);
          if (!m) return null;
          return top ? (
            <SwipeCard key={id} onSwipe={(like) => swipe(id, like)}>
              <MediaCard media={m} poster={posters[id]} className="size-full" />
            </SwipeCard>
          ) : (
            <div key={id} className="absolute inset-0" style={{ transform: `scale(${1 - (arr.length - 1 - i) * 0.04}) translateY(${(arr.length - 1 - i) * 14}px)`, opacity: 0.6 }}>
              <MediaCard media={m} poster={posters[id]} className="size-full" />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-8">
        <button aria-label="Nein" onClick={() => queue[0] && swipe(queue[0], false)} className="grid size-16 place-items-center rounded-full border-2 border-white/20 bg-white/10 text-[#ff6b6b] shadow-lg active:scale-90">
          <X className="size-8" strokeWidth={3} />
        </button>
        <button aria-label="Will ich sehen" onClick={() => queue[0] && swipe(queue[0], true)} className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#ff8fa3] to-[#ff2e63] text-white shadow-[0_10px_24px_-6px_rgba(255,46,99,0.7)] active:scale-90">
          <Heart className="size-9" fill="currentColor" />
        </button>
      </div>
      <div className="mt-2 text-center text-xs font-bold text-white/50">Nach rechts wischen = will ich sehen · nach links = lieber nicht</div>
    </div>
  );
}

/** oberste Karte: ziehen und loslassen */
function SwipeCard({ children, onSwipe }: { children: React.ReactNode; onSwipe: (like: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const like = useTransform(x, [30, 120], [0, 1]);
  const nope = useTransform(x, [-120, -30], [1, 0]);
  const [gone, setGone] = useState(false);
  const fly = (dir: 1 | -1) => {
    setGone(true);
    void animate(x, dir * 600, { duration: 0.25 }).then(() => onSwipe(dir === 1));
  };
  const end = (_: unknown, info: PanInfo) => {
    if (gone) return;
    if (info.offset.x > 110 || info.velocity.x > 600) fly(1);
    else if (info.offset.x < -110 || info.velocity.x < -600) fly(-1);
    else void animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  };
  return (
    <motion.div className="absolute inset-0 z-10 cursor-grab" style={{ x, rotate }} drag="x" dragElastic={0.9} dragMomentum={false} onDragEnd={end}>
      {children}
      <motion.div style={{ opacity: like }} className="pointer-events-none absolute left-5 top-14 -rotate-12 rounded-xl border-4 border-[#51cf66] px-3 py-1 text-4xl font-black text-[#51cf66]">
        JA!
      </motion.div>
      <motion.div style={{ opacity: nope }} className="pointer-events-none absolute right-5 top-14 rotate-12 rounded-xl border-4 border-[#ff6b6b] px-3 py-1 text-4xl font-black text-[#ff6b6b]">
        NÖ
      </motion.div>
    </motion.div>
  );
}

function PhoneResults({ pub, meId, canControl, posters, onAgain }: { pub: KinoPublicState; meId: string; canControl: boolean; posters: Record<string, string | null>; onAgain: () => void }) {
  const list = (pub.results ?? []).filter((r) => r.likers.length > 0).slice(0, 10);
  return (
    <div className="fixed inset-0 flex flex-col bg-[radial-gradient(circle_at_50%_0%,#4a0f2e,#14060f)] px-4 pb-4 text-white safe-pt safe-pb">
      <div className="pt-4 text-center">
        <div className="text-3xl font-black">Eure Matches 🍿</div>
        <div className="text-sm font-bold text-white/60">Die ganze Liste steht auf dem Fernseher</div>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        {list.length === 0 && <div className="mt-10 text-center font-bold text-white/70">Niemand wollte irgendwas sehen. Noch eine Runde?</div>}
        {list.map((r, i) => {
          const m = MEDIA_BY_ID.get(r.id)!;
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2">
              <span className="w-6 text-center text-lg font-black text-white/60">{i + 1}</span>
              {posters[r.id] && <img src={posters[r.id]!} alt="" className="h-12 w-8 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-black">{m.title}</div>
                <div className="text-xs font-bold text-white/60">
                  {m.type === 'film' ? 'Film' : 'Serie'} · {m.year}
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm font-black text-[#ff8fa3]">
                <Heart className="size-4" fill="currentColor" /> {r.likers.length}
              </span>
              {r.likers.includes(meId) && <Check className="size-4 text-[#51cf66]" />}
            </div>
          );
        })}
      </div>
      {canControl && (
        <button onClick={onAgain} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#ff4d6d] py-3.5 text-lg font-black shadow-lg active:scale-95">
          <RotateCcw className="size-5" /> Neue 25 Titel
        </button>
      )}
    </div>
  );
}

function Center({ title, text }: { title: string; text: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center gap-3 bg-[radial-gradient(circle_at_50%_0%,#4a0f2e,#14060f)] px-8 pt-[14vh] text-center text-white">
      <div className="text-5xl font-black">{title}</div>
      <p className="text-lg font-bold text-white/75">{text}</p>
    </div>
  );
}
