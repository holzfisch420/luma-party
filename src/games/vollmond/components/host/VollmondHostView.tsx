import { AnimatePresence, motion } from 'framer-motion';
import { Check, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useCountdown } from '../../../../app/session/hooks';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { HostViewProps } from '../../../game-types';
import { ROLE_INFO, ROLES } from '../../game-config';
import type { VollmondPublicState } from '../../types';
import { Avatar, nameOf, NightSky, useNarrator } from '../shared';

const STORAGE_KEY = 'luma-vollmond-voice';

/** Fernseher: Erzähler, Dorf mit allen Personen, Tote, Abstimmung, Auflösung. */
export function VollmondHostView({ room, state }: HostViewProps<VollmondPublicState>) {
  const pub = state.public;
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 500) / 1000);
  const [voice, setVoice] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  useNarrator(pub.narration, voice);
  const night = pub.phase === 'night' || pub.phase === 'witch';
  const title = night ? `Nacht ${pub.day}` : pub.phase === 'roles' ? 'Die Rollen werden verteilt' : pub.phase === 'end' ? 'Das Spiel ist aus' : `Tag ${pub.day}`;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-white">
      <NightSky dark={night} />
      <header className="relative z-10 flex items-center gap-4 px-[3vw] pt-4">
        <span className="text-5xl font-black tracking-tight">Vollmond</span>
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-lg font-black">{title}</span>
        {pub.phaseEndsAt && pub.phase !== 'morning' && pub.phase !== 'verdict' && pub.phase !== 'end' && (
          <span className={`rounded-full px-4 py-1.5 text-2xl font-black tabular-nums ${secs <= 15 ? 'bg-[#c0392b]' : 'bg-white/15'}`}>
            {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </span>
        )}
        <button
          onClick={() => {
            const next = !voice;
            setVoice(next);
            if (!next) window.speechSynthesis?.cancel();
            try {
              localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
            } catch {
              /* egal */
            }
          }}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/20"
        >
          {voice ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} Erzählerstimme {voice ? 'an' : 'aus'}
        </button>
      </header>

      {/* Erzähler */}
      <div className="relative z-10 flex justify-center px-[6vw] pt-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={pub.narration.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl text-center font-serif text-[clamp(1.4rem,2.6vw,2.6rem)] font-bold italic leading-snug text-[#f3e9c6] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          >
            {pub.narration.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-[4vw] pb-4">
        {pub.phase === 'end' ? <EndReveal room={room} pub={pub} /> : <Village room={room} pub={pub} />}
        {pub.phase === 'roles' && <RoleMix pub={pub} />}
        {pub.phase === 'vote' && <div className="text-xl font-black text-white/85">{pub.done.length}/{pub.alive.length} haben abgestimmt</div>}
        {pub.phase === 'day' && (
          <div className="text-xl font-black text-white/85">
            {pub.ready.length}/{pub.alive.length} bereit zur Abstimmung · ab zwei Dritteln geht’s los
          </div>
        )}
      </main>

      <footer className="relative z-10 flex items-center justify-between gap-4 bg-black/40 px-[3vw] py-2.5 text-sm font-bold text-white/80">
        <span>{night ? 'Nachts schauen alle nur aufs eigene Handy – nicht spicken, nicht reden!' : 'Redet, beschuldigt, lügt – das Spiel passiert zwischen euch. Tote schweigen.'}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Smartphone className="size-4" /> Code <span className="tracking-[0.2em] text-[#e8c25b]">{room.code}</span>
        </span>
      </footer>
    </div>
  );
}

/** alle Personen im Halbkreis; Tote grau mit Rolle (falls aufgedeckt), Stimmen bei der Abstimmung */
function Village({ room, pub }: { room: RoomSnapshot; pub: VollmondPublicState }) {
  const showDone = pub.phase === 'roles' || pub.phase === 'night' || pub.phase === 'vote';
  const votedFor = (id: string) => Object.entries(pub.votes).filter(([, t]) => t === id).map(([v]) => v);
  const newsIds = new Set(pub.news.map((d) => d.playerId));
  return (
    <div className="flex max-w-6xl flex-wrap items-start justify-center gap-x-6 gap-y-5">
      {pub.order.map((id) => {
        const alive = pub.alive.includes(id);
        const death = pub.graveyard.find((d) => d.playerId === id);
        const fresh = newsIds.has(id) && (pub.phase === 'morning' || pub.phase === 'verdict' || pub.phase === 'hunter');
        const voters = pub.phase === 'vote' || pub.phase === 'verdict' ? votedFor(id) : [];
        return (
          <motion.div
            key={id}
            layout
            animate={fresh ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] } : { scale: 1 }}
            transition={{ duration: 0.8 }}
            className={`flex w-32 flex-col items-center gap-1.5 rounded-3xl px-2 py-3 ${fresh ? 'bg-[#c0392b]/40 ring-2 ring-[#ff8a8a]' : alive ? 'bg-white/10' : 'bg-black/30'}`}
          >
            <div className="relative">
              <Avatar room={room} id={id} size="lg" dead={!alive} />
              {showDone && alive && pub.done.includes(id) && (
                <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-[#9be7a0] text-[#10301a]">
                  <Check className="size-4" strokeWidth={3} />
                </span>
              )}
              {pub.phase === 'day' && pub.ready.includes(id) && <span className="absolute -right-1 -top-1 rounded-full bg-[#e8c25b] px-1.5 text-xs font-black text-[#1d2350]">bereit</span>}
              {pub.hunterId === id && <span className="absolute -left-2 -top-2 text-2xl">🏹</span>}
            </div>
            <span className={`max-w-full truncate text-lg font-black ${alive ? '' : 'text-white/50 line-through'}`}>{nameOf(room, id)}</span>
            {death && <span className="text-xs font-black text-white/70">{death.role ? `${ROLE_INFO[death.role].emoji} ${ROLE_INFO[death.role].name}` : '💀'}</span>}
            {voters.length > 0 && (
              <div className="flex flex-wrap justify-center gap-0.5">
                {voters.map((v) => (
                  <Avatar key={v} room={room} id={v} size="xs" />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function RoleMix({ pub }: { pub: VollmondPublicState }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span className="mr-1 text-lg font-black text-white/70">Im Dorf:</span>
      {ROLES.filter((r) => pub.roleCount[r]).map((r) => (
        <span key={r} className="rounded-full bg-white/10 px-4 py-1.5 text-lg font-black">
          {pub.roleCount[r]}× {ROLE_INFO[r].emoji} {ROLE_INFO[r].name}
        </span>
      ))}
    </div>
  );
}

function EndReveal({ room, pub }: { room: RoomSnapshot; pub: VollmondPublicState }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-3xl px-10 py-4 text-5xl font-black shadow-2xl ${pub.winner === 'dorf' ? 'bg-[#2f855a]' : 'bg-[#c0392b]'}`}>
        {pub.winner === 'dorf' ? '🏡 Das Dorf gewinnt!' : '🐺 Die Werwölfe gewinnen!'}
      </motion.div>
      <div className="flex max-w-6xl flex-wrap justify-center gap-4">
        {pub.order.map((id, i) => {
          const role = pub.roles?.[id];
          return (
            <motion.div
              key={id}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className={`flex w-36 flex-col items-center gap-1 rounded-3xl px-2 py-3 ${role === 'werwolf' ? 'bg-[#c0392b]/50' : 'bg-white/10'}`}
            >
              <Avatar room={room} id={id} size="lg" dead={!pub.alive.includes(id)} />
              <span className="max-w-full truncate text-lg font-black">{nameOf(room, id)}</span>
              {role && (
                <span className="text-base font-black">
                  {ROLE_INFO[role].emoji} {ROLE_INFO[role].name}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
