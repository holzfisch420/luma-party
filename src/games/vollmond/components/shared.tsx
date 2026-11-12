import { useEffect, useRef } from 'react';
import { PlayerAvatar } from '../../../components/lobby/PlayerAvatar';
import type { RoomSnapshot } from '../../../shared/types/room';

export function nameOf(room: RoomSnapshot, id: string | null | undefined) {
  return room.players.find((p) => p.id === id)?.name ?? '?';
}

export function Avatar({ room, id, size = 'md', dead }: { room: RoomSnapshot; id: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; dead?: boolean }) {
  const p = room.players.find((x) => x.id === id);
  return (
    <span className={`relative inline-block ${dead ? 'grayscale' : ''}`}>
      <PlayerAvatar name={p?.name ?? '?'} color={p?.avatarColor ?? '#5c6bc0'} avatar={p?.avatar} size={size} dimmed={dead || (p ? !p.isConnected : true)} />
      {dead && <span className="absolute -bottom-1 -right-1 text-lg">💀</span>}
    </span>
  );
}

/** Nachthimmel mit Mond und Sternen */
export function NightSky({ dark = false, moon = true }: { dark?: boolean; moon?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`absolute inset-0 transition-colors duration-[1500ms] ${dark ? 'bg-[radial-gradient(ellipse_at_70%_10%,#1a2150_0%,#0b1026_55%,#05070f_100%)]' : 'bg-[radial-gradient(ellipse_at_70%_10%,#3a4280_0%,#1d2350_55%,#0b1026_100%)]'}`} />
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="vollmond-star absolute rounded-full bg-white" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, width: 1 + (i % 3), height: 1 + (i % 3), animationDelay: `${(i % 7) * 0.6}s` }} />
      ))}
      {moon && <div className="absolute right-[8%] top-[6%] size-[14vmin] rounded-full bg-[radial-gradient(circle_at_40%_35%,#fffbe6,#f3e3a6_60%,#d9c37a)] shadow-[0_0_80px_20px_rgba(255,240,180,0.25)]" />}
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-[linear-gradient(to_top,#04060c,transparent)]" />
    </div>
  );
}

/** Erzähler: liest neue Texte mit der deutschen Systemstimme vor */
export function useNarrator(narration: { id: number; text: string }, enabled: boolean) {
  const last = useRef(0);
  useEffect(() => {
    if (!enabled || narration.id === last.current || !narration.text) return;
    last.current = narration.id;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(narration.text);
      u.lang = 'de-DE';
      u.rate = 0.95;
      u.pitch = 0.9;
      const voice = synth.getVoices().find((v) => v.lang.startsWith('de'));
      if (voice) u.voice = voice;
      synth.speak(u);
    } catch {
      /* keine Sprachausgabe verfügbar */
    }
  }, [narration, enabled]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
}
