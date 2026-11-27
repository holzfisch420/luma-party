import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Play, Smartphone } from 'lucide-react';
import { useEffect } from 'react';
import { useJoinUrl, useQrSvg } from '../../components/lobby/JoinInstructions';
import { PlayerAvatar } from '../../components/lobby/PlayerAvatar';
import type { PublicPlayer, RoomSnapshot } from '../../shared/types/room';
import { getSocket } from '../session/socket';

const TEAL = '#17607f';

/** Avatar-Größe nach Spielerzahl – wenige Leute dürfen richtig groß sein */
function avatarSize(n: number): string {
  if (n <= 4) return 'min(19vh, 14vw)';
  if (n <= 6) return 'min(16vh, 10.5vw)';
  if (n <= 8) return 'min(13vh, 8.5vw)';
  return 'min(9.5vh, 6.5vw)';
}

/**
 * Willkommensbildschirm „Wer spielt mit?“ – erscheint am Anfang vor dem Home-Menü.
 * Großer QR-Code oben rechts, alle Beigetretenen unten mit Avatar und Namensschild.
 */
export function WelcomeScreen({ room, keys = true }: { room: RoomSnapshot; keys?: boolean }) {
  const url = useJoinUrl(room.code);
  const qr = useQrSvg(url, { margin: 1, dark: '#0f3d52' });
  const display = url.replace(/^https?:\/\//, '').replace(/\?code=.*/, '');
  const players = room.players;
  const size = avatarSize(Math.max(players.length, 4));
  const empty = Math.max(0, 4 - players.length);
  const lead = !room.hostHasControl && room.controllerId ? players.find((p) => p.id === room.controllerId) : undefined;
  const go = () => getSocket().emit('room:setWelcome', { open: false });

  useEffect(() => {
    if (!keys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      go();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [keys]);

  return (
    <motion.div
      className="home-bg fixed inset-0 z-[45] flex flex-col overflow-hidden px-[5vw] pb-[4vh] pt-[5vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45 }}
      style={{ position: 'fixed' }} // .home-bg setzt sonst position: relative
      role="dialog"
      aria-label="Wer spielt mit?"
    >
      {/* weiche Hintergrundformen in Petrol */}
      <div className="pointer-events-none absolute -left-[8vw] top-[30vh] size-[38vw] rounded-full opacity-[0.07]" style={{ background: TEAL }} />
      <div className="pointer-events-none absolute -right-[6vw] -bottom-[18vh] size-[30vw] rounded-full opacity-[0.06]" style={{ background: TEAL }} />

      {/* oben: Titel links, QR-Code rechts */}
      <div className="relative flex shrink-0 items-start justify-between gap-[4vw]">
        <div className="min-w-0 pt-[2vh]">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.1 }}
            className="text-[min(8.5vw,15vh)] font-black leading-[0.95] tracking-tight text-[#1b2430]"
          >
            Wer spielt
            <br />
            mit?
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-[3vh] space-y-[1.2vh] text-[min(1.7vw,3vh)] font-bold text-home-muted">
            <div className="flex items-center gap-3">
              <Smartphone className="size-[1.3em] shrink-0" style={{ color: TEAL }} />
              <span>
                QR-Code scannen oder <b className="font-black text-home-text">{display}</b> öffnen
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full px-[0.7em] py-[0.15em] text-white" style={{ background: TEAL }}>
                Code
              </span>
              <b className="text-[1.5em] font-black tracking-[0.18em]" style={{ color: TEAL }}>
                {room.code}
              </b>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ scale: 0.7, rotate: 6, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
          className="relative shrink-0 rounded-[3vh] p-[1.2vh] shadow-[0_30px_70px_-25px_rgba(15,61,82,0.6)]"
          style={{ background: TEAL, width: 'min(44vh, 32vw)', height: 'min(44vh, 32vw)' }}
        >
          <div className="size-full rounded-[2vh] bg-white p-[1.2vh] [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR-Code zum Beitreten" />
          {/* sanfter Puls, damit der Blick dorthin geht */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[3vh] border-4"
            style={{ borderColor: TEAL }}
            animate={{ scale: [1, 1.06], opacity: [0.6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.div>
      </div>

      {/* unten: alle, die schon da sind */}
      <div className="relative flex min-h-0 flex-1 flex-wrap content-center items-end justify-center gap-x-[3vw] gap-y-[2.5vh]">
        <AnimatePresence initial={false}>
          {players.map((p) => (
            <Seat key={p.id} player={p} size={size} isLead={p.id === lead?.id} />
          ))}
          {Array.from({ length: empty }, (_, i) => (
            <EmptySeat key={`leer-${i}`} size={size} delay={i * 0.4} />
          ))}
        </AnimatePresence>
      </div>

      {/* Weiter */}
      <div className="relative flex shrink-0 items-center justify-center gap-[2vw] text-[clamp(0.9rem,1.3vw,1.5rem)] font-bold text-home-muted">
        <span>{players.length === 0 ? 'Noch niemand da' : `${players.length} ${players.length === 1 ? 'Person' : 'Personen'} dabei`}</span>
        <button
          onClick={go}
          className="flex items-center gap-2 rounded-full px-[1.6em] py-[0.6em] font-black text-white shadow-[0_12px_30px_-12px_rgba(15,61,82,0.8)] transition hover:scale-105 active:scale-95"
          style={{ background: TEAL }}
        >
          <Play className="size-[1.1em] fill-current" /> Alle da – los geht’s
        </button>
        <span>
          <kbd className="rounded-md border border-home-line bg-white px-2 py-0.5 text-[0.85em] font-black text-home-text">Enter</kbd>
          {lead ? ` oder ${lead.name} per Handy` : ''}
        </span>
      </div>
    </motion.div>
  );
}

/** Ein Platz: runder Avatar, der auf einem Namensschild sitzt */
function Seat({ player, size, isLead }: { player: PublicPlayer; size: string; isLead: boolean }) {
  return (
    <motion.div
      layout
      initial={{ scale: 0, y: 60 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 17 }}
      className="relative flex flex-col items-center"
      style={{ width: `calc(${size} * 1.45)` }}
    >
      <motion.div
        className="relative z-10 rounded-full p-[0.5vh]"
        style={{ width: size, height: size, background: TEAL }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3 + (player.name.length % 3) * 0.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PlayerAvatar name={player.name} color={player.avatarColor} avatar={player.avatar} size="fill" dimmed={!player.isConnected} />
        {isLead && (
          <span className="absolute -right-[4%] -top-[4%] grid size-[30%] place-items-center rounded-full border-[3px] border-white bg-amber-400 text-white shadow" title="wählt die Spiele">
            <Crown className="size-[60%]" />
          </span>
        )}
      </motion.div>
      <div
        className="-mt-[18%] w-full rounded-[999px] border border-white/80 px-[0.6em] pb-[0.55em] pt-[22%] text-center font-extrabold text-[#1b2430] shadow-[inset_0_-6px_12px_rgba(0,0,0,0.08),0_10px_20px_-12px_rgba(40,50,70,0.5)]"
        style={{ background: 'linear-gradient(180deg,#f7f8fa,#dfe3e8)', fontSize: `max(1.05rem, calc(${size} * 0.16))` }}
      >
        <div className="truncate">{player.name}</div>
      </div>
    </motion.div>
  );
}

/** Freier Platz – lädt zum Beitreten ein */
function EmptySeat({ size, delay }: { size: string; delay: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      className="relative flex flex-col items-center"
      style={{ width: `calc(${size} * 1.45)` }}
    >
      <motion.div
        className="relative z-10 grid place-items-center rounded-full border-[3px] border-dashed text-home-muted"
        style={{ width: size, height: size, borderColor: '#a9b7c2', fontSize: `calc(${size} * 0.4)` }}
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 2.4, repeat: Infinity, delay }}
      >
        <span className="font-black">?</span>
      </motion.div>
      <div
        className="-mt-[18%] w-full rounded-[999px] border-[3px] border-dashed px-[0.6em] pb-[0.55em] pt-[22%] text-center font-extrabold text-home-muted/70"
        style={{ borderColor: '#c5d0d8', fontSize: `max(1.05rem, calc(${size} * 0.16))` }}
      >
        frei
      </div>
    </motion.div>
  );
}
