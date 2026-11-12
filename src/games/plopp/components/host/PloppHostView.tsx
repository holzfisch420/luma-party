import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCountdown } from '../../../../app/session/hooks';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { PACK_LABELS } from '../../prompt-types';
import type { PloppPublicState } from '../../types';
import { Avatar, Lives, nameOf, Ocean, PACK_COLORS, Puffer, useTension } from '../shared';
import { ploppSounds } from '../sounds';

/** Fernseher: Aufgabe, Spielerkreis mit Kugelfisch, genannte Antworten, Abstimmung und Plopp. */
export function PloppHostView({ room, state }: HostViewProps<PloppPublicState>) {
  const pub = state.public;
  const tension = useTension(pub.fuse);
  const [muted, setMuted] = useState(ploppSounds.isMuted());
  usePloppSounds(pub, tension);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-white">
      <Ocean />

      {/* Kopf links (rechts oben sitzt der Beenden-Knopf) */}
      <header className="relative z-10 flex items-center gap-4 px-[3vw] pt-4">
        <div className="flex items-center gap-3">
          <Puffer tension={0.35} size={56} />
          <span className="text-5xl font-black tracking-tight drop-shadow-[0_3px_0_rgba(0,30,60,0.5)]">Plopp!</span>
        </div>
        <span className="rounded-full bg-black/25 px-4 py-1.5 text-lg font-black">Runde {pub.round}</span>
        <button
          onClick={() => {
            ploppSounds.setMuted(!muted);
            setMuted(!muted);
          }}
          className="grid size-11 place-items-center rounded-full bg-black/25 hover:bg-black/40"
          aria-label={muted ? 'Ton an' : 'Ton aus'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </header>

      <PromptBanner pub={pub} />

      <main className="relative z-10 flex min-h-0 flex-1 gap-[2vw] px-[3vw] pb-3 pt-6">
        <Ring room={room} pub={pub} tension={tension} />
        <UsedList room={room} pub={pub} />
      </main>

      <footer className="relative z-10 flex items-center justify-between gap-4 bg-black/25 px-[3vw] py-2.5">
        <span className="text-sm font-bold text-white/85">Wer den Fisch hat, tippt eine Antwort aufs Handy – Tippfehler werden automatisch korrigiert.</span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-bold text-white/80">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#ffd23f]">{room.code}</span>
        </span>
      </footer>

      <AnimatePresence>{pub.phase === 'vote' && pub.vote && <VoteOverlay key="vote" room={room} pub={pub} />}</AnimatePresence>
      <AnimatePresence>{pub.phase === 'pop' && pub.pop && <PopOverlay key={`pop-${pub.round}`} room={room} pub={pub} />}</AnimatePresence>
    </div>
  );
}

function PromptBanner({ pub }: { pub: PloppPublicState }) {
  const color = PACK_COLORS[pub.prompt.pack] ?? '#ffb02e';
  return (
    <div className="relative z-10 flex justify-center px-[4vw] pt-3">
      <motion.div
        key={pub.round}
        initial={{ scale: pub.phase === 'intro' ? 1.5 : 1, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        className="relative max-w-5xl rounded-[28px] border-4 border-white/80 bg-white px-10 py-4 text-center text-[#0b3d6b] shadow-[0_14px_40px_-10px_rgba(0,20,50,0.7)]"
      >
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-sm font-black uppercase tracking-[0.18em] text-white shadow" style={{ background: color }}>
          {PACK_LABELS[pub.prompt.pack].emoji} {PACK_LABELS[pub.prompt.pack].label}
        </span>
        <div className="text-[clamp(2rem,4vw,4.2rem)] font-black leading-tight">{pub.prompt.text}</div>
      </motion.div>
    </div>
  );
}

/** Spieler im Kreis, Fisch in der Mitte – er dreht sich zur Person, die ihn hat */
function Ring({ room, pub, tension }: { room: RoomSnapshot; pub: PloppPublicState; tension: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 500 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ids = pub.order;
  const n = Math.max(1, ids.length);
  const rx = box.w * 0.4;
  const ry = box.h * 0.36;
  const pos = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: box.w / 2 + Math.cos(a) * rx, y: box.h / 2 + Math.sin(a) * ry };
  };
  const holderIdx = pub.holderId ? ids.indexOf(pub.holderId) : -1;
  const hp = holderIdx >= 0 ? pos(holderIdx) : { x: box.w / 2, y: box.h / 2 };
  // Fisch rückt ein Stück Richtung Person mit Fisch
  const fx = box.w / 2 + (hp.x - box.w / 2) * 0.38;
  const fy = box.h / 2 + (hp.y - box.h / 2) * 0.38;
  const fishSize = Math.min(box.w, box.h) * (0.42 + tension * 0.16);
  const shake = tension > 0.5 && pub.phase === 'play' ? (tension - 0.5) * 6 : 0;
  const ev = pub.event;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      {/* Fisch */}
      <motion.div
        className="absolute"
        animate={{ left: fx - fishSize / 2, top: fy - fishSize / 2 }}
        transition={{ type: 'spring', stiffness: 140, damping: 15 }}
        style={{ width: fishSize, height: fishSize }}
      >
        <motion.div
          animate={shake ? { x: [-shake, shake, -shake], y: [shake, -shake, shake] } : { y: [0, -8, 0] }}
          transition={shake ? { duration: 0.12, repeat: Infinity } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Fisch schaut zur Person, die ihn hat */}
          <div style={{ transform: hp.x < box.w / 2 - 4 && pub.phase !== 'pop' ? 'scaleX(-1)' : undefined, transition: 'transform 0.3s' }}>
            <Puffer tension={pub.phase === 'intro' ? 0 : tension} popped={pub.phase === 'pop'} size={fishSize} />
          </div>
        </motion.div>
      </motion.div>

      {/* Meldung zur letzten Antwort */}
      <AnimatePresence>
        {ev && pub.phase === 'play' && (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute left-1/2 top-[56%] z-20 -translate-x-1/2"
          >
            <EventBadge room={room} ev={ev} />
          </motion.div>
        )}
      </AnimatePresence>

      {pub.phase === 'intro' && pub.holderId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute left-1/2 top-[56%] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffd23f] px-6 py-2 text-2xl font-black text-[#0b3d6b] shadow-lg">
          {nameOf(room, pub.holderId)} fängt an – gleich geht’s los!
        </motion.div>
      )}

      {/* Spieler */}
      {ids.map((id, i) => {
        const p = pos(i);
        const lives = pub.lives[id] ?? 0;
        const out = lives <= 0;
        const holder = id === pub.holderId && pub.phase !== 'pop';
        return (
          <motion.div
            key={id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: p.x, top: p.y }}
            animate={{ scale: holder ? 1.18 : 1, opacity: out ? 0.35 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className={`rounded-full p-1.5 ${holder ? 'bg-[#ffd23f] shadow-[0_0_0_6px_rgba(255,210,63,0.35),0_0_40px_rgba(255,210,63,0.8)]' : 'bg-white/25'}`}>
              <Avatar room={room} id={id} size="lg" />
            </div>
            <span className={`max-w-[9rem] truncate rounded-full px-3 py-0.5 text-lg font-black ${holder ? 'bg-[#ffd23f] text-[#0b3d6b]' : 'bg-black/30'}`}>{nameOf(room, id)}</span>
            {out ? <span className="text-sm font-black uppercase tracking-widest text-white/80">raus</span> : <Lives left={lives} max={pub.maxLives} />}
          </motion.div>
        );
      })}
    </div>
  );
}

function EventBadge({ room, ev }: { room: RoomSnapshot; ev: NonNullable<PloppPublicState['event']> }) {
  const who = nameOf(room, ev.playerId);
  const base = 'flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-2xl font-black shadow-lg';
  if (ev.kind === 'pass')
    return (
      <div className={`${base} bg-white text-[#0b3d6b]`}>
        <span className="text-[#2b8a3e]">✓</span> {ev.answer}
        {ev.text !== ev.answer && <span className="text-base font-bold text-[#0b3d6b]/50 line-through">{ev.text}</span>}
        <span className="text-base font-bold text-[#0b3d6b]/60">– {who}</span>
      </div>
    );
  if (ev.kind === 'skip') return <div className={`${base} bg-black/50 text-white`}>{who} ist weg – Fisch geht weiter</div>;
  const msg = ev.kind === 'dupe' ? `„${ev.answer}“ war schon!` : ev.kind === 'letter' ? `„${ev.answer}“ – falscher Anfangsbuchstabe` : ev.kind === 'rejected' ? `„${ev.text}“ abgelehnt` : `„${ev.text}“? Kenn ich nicht`;
  return (
    <div className={`${base} bg-[#e03131] text-white`}>
      ✗ {msg} <span className="text-base font-bold text-white/75">– {who}</span>
    </div>
  );
}

function UsedList({ room, pub }: { room: RoomSnapshot; pub: PloppPublicState }) {
  const list = [...pub.used].reverse().slice(0, 18);
  return (
    <aside className="flex w-[22vw] min-w-56 flex-col gap-2 overflow-hidden">
      <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Schon genannt · {pub.used.length}</div>
      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {list.map((u) => (
            <motion.div
              key={`${u.text}-${u.by}`}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="flex items-center gap-2 rounded-2xl bg-white/15 py-1 pl-1 pr-3 backdrop-blur-sm"
            >
              <Avatar room={room} id={u.by} size="xs" />
              <span className="min-w-0 flex-1 truncate text-lg font-black">{u.text}</span>
              {u.voted && <span className="rounded-full bg-[#ffd23f] px-2 text-xs font-black text-[#0b3d6b]">👍</span>}
              {u.typed && <span className="max-w-[40%] truncate text-xs font-bold text-white/60 line-through">{u.typed}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {pub.used.length === 0 && <div className="rounded-2xl border-2 border-dashed border-white/30 px-4 py-6 text-center font-bold text-white/70">Noch nichts – los geht’s!</div>}
      </div>
    </aside>
  );
}

function VoteOverlay({ room, pub }: { room: RoomSnapshot; pub: PloppPublicState }) {
  const v = pub.vote!;
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 200) / 1000);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center bg-[#071f3a]/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} className="flex max-w-3xl flex-col items-center gap-4 rounded-[32px] bg-white px-12 py-8 text-center text-[#0b3d6b] shadow-2xl">
        <div className="text-lg font-black uppercase tracking-[0.2em] text-[#1576a8]">Gilt das? Stimmt auf dem Handy ab!</div>
        <div className="flex items-center gap-3 text-xl font-black">
          <Avatar room={room} id={v.playerId} size="md" /> {nameOf(room, v.playerId)} sagt:
        </div>
        <div className="text-6xl font-black">„{v.text}“</div>
        <div className="text-xl font-bold text-[#0b3d6b]/70">für: {pub.prompt.text}</div>
        <div className="flex items-center gap-3">
          {v.eligible.map((id) => (
            <div key={id} className={`rounded-full p-1 ${v.voters.includes(id) ? 'bg-[#2b8a3e]' : 'bg-[#0b3d6b]/15'}`}>
              <Avatar room={room} id={id} size="sm" />
            </div>
          ))}
          <span className="ml-2 grid size-12 place-items-center rounded-full bg-[#ffb02e] text-2xl font-black text-white">{secs}</span>
        </div>
        <div className="text-sm font-bold text-[#0b3d6b]/60">Die Zündschnur ist so lange angehalten.</div>
      </motion.div>
    </motion.div>
  );
}

function PopOverlay({ room, pub }: { room: RoomSnapshot; pub: PloppPublicState }) {
  const pop = pub.pop!;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-white" />
      <motion.div initial={{ scale: 0.3, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }} className="flex flex-col items-center gap-3 rounded-[36px] bg-[#071f3a]/80 px-14 py-8 text-center shadow-2xl backdrop-blur">
        <div className="rounded-full bg-white p-2">
          <Avatar room={room} id={pop.playerId} size="xl" />
        </div>
        <div className="text-6xl font-black text-[#ffd23f] drop-shadow">PLOPP!</div>
        <div className="text-3xl font-black">{pop.eliminated ? `${nameOf(room, pop.playerId)} ist raus!` : `${nameOf(room, pop.playerId)} verliert ein Leben`}</div>
        {!pop.eliminated && <Lives left={pop.livesLeft} max={pub.maxLives} size={22} />}
        <div className="text-lg font-bold text-white/75">{pub.used.length} Antworten in dieser Runde</div>
      </motion.div>
    </motion.div>
  );
}

/** Ticken, Blubb, Fehlerton, Abstimmung und Knall */
function usePloppSounds(pub: PloppPublicState, tension: number) {
  const tensionRef = useRef(tension);
  tensionRef.current = tension;
  const playing = pub.phase === 'play';
  useEffect(() => {
    if (!playing) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const k = tensionRef.current;
      ploppSounds.tick(k);
      t = setTimeout(loop, 520 - k * 380);
    };
    loop();
    return () => clearTimeout(t);
  }, [playing]);

  const lastEvent = useRef<number | null>(null);
  useEffect(() => {
    const ev = pub.event;
    if (!ev || ev.id === lastEvent.current) return;
    lastEvent.current = ev.id;
    if (ev.kind === 'pass') ploppSounds.pass();
    else if (ev.kind !== 'skip') ploppSounds.nope();
  }, [pub.event]);

  const lastPhase = useRef(pub.phase);
  useEffect(() => {
    if (pub.phase === lastPhase.current) return;
    lastPhase.current = pub.phase;
    if (pub.phase === 'pop') ploppSounds.pop();
    if (pub.phase === 'vote') ploppSounds.vote();
    if (pub.phase === 'intro') ploppSounds.round();
  }, [pub.phase]);
}
