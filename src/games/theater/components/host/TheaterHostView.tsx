import { AnimatePresence, motion } from 'framer-motion';
import { EyeOff, Smartphone } from 'lucide-react';
import type { HostViewProps } from '../../../game-types';
import { HIDE_LABEL, sceneOf, speaks, windowAround } from '../../logic/view';
import { useScript } from '../../script-cache';
import type { ScriptLine, TheaterPublicState } from '../../types';

/** Fernseher: Rolle und Text wie beim Karaoke – aktuelle Zeile im Scheinwerferlicht. */
export function TheaterHostView({ room, state }: HostViewProps<TheaterPublicState>) {
  const pub = state.public;
  const script = useScript(pub.scriptId);

  if (!script) {
    return (
      <div className="stage grid h-dvh place-items-center">
        <div className="font-stage text-3xl text-[#c9973b]">Skript wird geladen …</div>
      </div>
    );
  }

  const { indices, hidden } = windowAround(script, pub.index, pub.skipDirections, 2, 3, pub.hide);
  const scene = sceneOf(script, pub.index);
  const line = script.lines[pub.index]!;
  const progress = script.lines.length > 1 ? pub.index / (script.lines.length - 1) : 1;

  return (
    <div className="stage relative flex h-dvh overflow-hidden">
      {/* Vorhang links/rechts */}
      <div className="curtain w-[4vw] shrink-0 shadow-[8px_0_30px_rgba(0,0,0,0.6)]" />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Kopf */}
        <header className="flex items-end justify-between gap-6 px-[4vw] pt-6">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold uppercase tracking-[0.3em] text-[#c9973b]/80">{script.title}</div>
            <div className="font-stage truncate text-4xl font-extrabold text-[#f3dfb8]">
              Szene {scene?.number}
              {scene?.title ? <span className="font-normal italic text-[#f3dfb8]/70"> · {scene.title}</span> : null}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#c9973b]/80">Seite</div>
            <div className="font-stage text-4xl font-extrabold text-[#f3dfb8]">
              {line.page}
              <span className="text-2xl text-[#f3dfb8]/50"> / {script.pageCount}</span>
            </div>
          </div>
        </header>
        <div className="mx-[4vw] mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-gradient-to-r from-[#8e1b2c] to-[#c9973b]" animate={{ width: `${progress * 100}%` }} />
        </div>

        {/* Zeilen */}
        <main className="relative flex min-h-0 flex-1 flex-col justify-center px-[6vw]">
          <div className="flex flex-col gap-[2.2vh]">
            <AnimatePresence initial={false} mode="popLayout">
              {indices.map((i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                >
                  <LineView line={script.lines[i]!} current={i === pub.index} hidden={hidden.has(i)} focus={speaks(script.lines[i]!, pub.focus)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>

        {/* Fuß */}
        <footer className="flex items-center justify-between gap-4 px-[4vw] pb-5 text-base font-semibold text-[#f3dfb8]/60">
          <span className="flex items-center gap-2">
            <Smartphone className="size-5" /> Weiterblättern per Handy · Code <span className="tracking-[0.2em] text-[#c9973b]">{room.code}</span>
          </span>
          <span className="flex items-center gap-4">
            {pub.hide !== 'none' && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#c9973b]/15 px-3 py-1 text-[#c9973b]">
                <EyeOff className="size-4" /> {HIDE_LABEL[pub.hide]}
              </span>
            )}
            {pub.lastBy && <span>geblättert von {pub.lastBy}</span>}
          </span>
        </footer>
      </div>
      <div className="curtain w-[4vw] shrink-0 shadow-[-8px_0_30px_rgba(0,0,0,0.6)]" />
    </div>
  );
}

function LineView({ line, current, hidden, focus }: { line: ScriptLine; current: boolean; hidden: boolean; focus: boolean }) {
  const size = current ? 'text-[clamp(1.6rem,3.1vw,3.4rem)] leading-[1.25]' : 'text-[clamp(1rem,1.6vw,1.7rem)] leading-snug';
  const fade = current ? '' : 'opacity-45';

  if (line.kind !== 'dialog') {
    return (
      <div className={`text-center italic ${current ? 'text-[clamp(1.3rem,2.4vw,2.6rem)] text-[#f3dfb8]/85' : 'text-[clamp(0.9rem,1.3vw,1.4rem)] text-[#f3dfb8]/40'}`}>
        {line.segments.map((s) => s.t).join(' ')}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-3xl transition-colors duration-500 ${current ? 'bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,214,150,0.16),transparent_70%)] px-8 py-6' : 'px-8 py-1'} ${fade}`}
    >
      {focus && <div className="absolute bottom-2 left-2 top-2 w-1.5 rounded-full bg-[#c9973b]" />}
      <div className={`font-stage font-extrabold uppercase tracking-[0.12em] ${current ? 'text-[clamp(1rem,1.7vw,1.9rem)] text-[#e9b85b]' : 'text-[clamp(0.8rem,1.1vw,1.2rem)] text-[#c9973b]'}`}>
        {line.character}
      </div>
      {hidden ? (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="ausgeblendete Zeile">
          {Array.from({ length: Math.min(8, Math.max(2, Math.round(line.segments.reduce((n, s) => n + s.t.length, 0) / 14))) }).map((_, k) => (
            <span key={k} className="h-4 rounded-full bg-[#f3dfb8]/20" style={{ width: `${3 + ((k * 37) % 5)}rem` }} />
          ))}
        </div>
      ) : (
        <div className={`${size} mt-1 text-[#fbf5ec]`}>
          {line.segments.map((s, k) =>
            s.k === 'direction' ? (
              <span key={k} className="mx-1 align-middle text-[0.62em] italic text-[#f3dfb8]/55">
                {s.t}
              </span>
            ) : (
              <span key={k} className={current ? 'font-semibold' : ''}>
                {s.t}{' '}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
