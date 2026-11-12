import { AnimatePresence, motion } from 'framer-motion';
import { Check, Hand } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { haptics } from '../../../../app/haptics';
import { useCountdown } from '../../../../app/session/hooks';
import type { RoomSnapshot } from '../../../../shared/types/room';
import type { PlayerViewProps } from '../../../game-types';
import { ROLE_INFO } from '../../game-config';
import type { VollmondPrivateState, VollmondPublicState } from '../../types';
import { Avatar, nameOf, NightSky } from '../shared';

type Props = PlayerViewProps<VollmondPublicState, VollmondPrivateState>;

/** Handy: geheime Rolle, Nachtaktionen, Abstimmung. Das eigentliche Spiel passiert im Gespräch. */
export function VollmondController({ room, me, state, sendAction }: Props) {
  const pub = state.public;
  const priv = state.private;
  const secs = Math.ceil(useCountdown(pub.phaseEndsAt, 500) / 1000);
  const night = pub.phase === 'night' || pub.phase === 'witch';

  // kurz vibrieren, wenn man etwas tun muss
  const lastTask = useRef<string>('none');
  useEffect(() => {
    const key = `${pub.phase}-${pub.day}-${priv?.task}`;
    if (priv && priv.task !== 'none' && priv.task !== 'dummy' && lastTask.current !== key) haptics.play('double');
    lastTask.current = key;
  }, [pub.phase, pub.day, priv]);

  if (!priv)
    return (
      <Shell night={false}>
        <Center title="Zuschauen" text="Du bist beim nächsten Spiel dabei. Schau aufs Dorf am Fernseher!" />
      </Shell>
    );

  const done = pub.done.includes(me.id);
  return (
    <Shell night={night}>
      <header className="flex items-center justify-between pt-3">
        <span className="text-2xl font-black tracking-tight">Vollmond</span>
        <span className="flex items-center gap-2 text-sm font-black">
          {night ? `Nacht ${pub.day}` : pub.phase === 'roles' ? 'Rollen' : `Tag ${pub.day}`}
          {pub.phaseEndsAt && pub.phase !== 'morning' && pub.phase !== 'verdict' && <span className="rounded-full bg-white/15 px-2.5 py-0.5 tabular-nums">{secs}s</span>}
        </span>
      </header>

      <RoleCard priv={priv} room={room} big={pub.phase === 'roles'} />

      <AnimatePresence mode="wait">
        <motion.div key={`${pub.phase}-${pub.day}-${priv.task}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
          {pub.phase === 'roles' && (
            <BigButton disabled={done} onClick={() => sendAction('seen')}>
              {done ? 'Warte auf die anderen …' : 'Verstanden – ich kenne meine Rolle'}
            </BigButton>
          )}

          {!priv.alive && pub.phase !== 'end' && pub.phase !== 'roles' && (
            <Center title="Du bist tot 💀" text="Ab jetzt schweigst du – kein Wort, kein Zwinkern. Schau zu, wie sich das Dorf schlägt." />
          )}

          {pub.phase === 'night' && priv.alive && <NightTask room={room} me={me.id} pub={pub} priv={priv} sendAction={sendAction} />}
          {pub.phase === 'witch' && priv.alive && (priv.task === 'witch' ? <WitchTask room={room} me={me.id} pub={pub} priv={priv} sendAction={sendAction} /> : <Center title="🌙" text="Die Nacht geht weiter … Augen zu, Handy runter." />)}
          {(pub.phase === 'morning' || pub.phase === 'verdict') && <News room={room} pub={pub} />}
          {pub.phase === 'hunter' &&
            (priv.task === 'hunter' ? (
              <>
                <Info>Du warst der Jäger! Wen nimmst du mit in den Tod?</Info>
                <Picker room={room} ids={pub.alive.filter((id) => id !== me.id)} selected={null} onPick={(id) => sendAction('shoot', { target: id })} />
              </>
            ) : (
              <Center title="🏹" text={`${nameOf(room, pub.hunterId)} zielt …`} />
            ))}
          {pub.phase === 'day' && priv.alive && (
            <>
              <Info>Diskutiert! Wer lügt? Verteidige dich – oder lenk den Verdacht auf andere.</Info>
              <BigButton active={pub.ready.includes(me.id)} onClick={() => sendAction('ready')}>
                {pub.ready.includes(me.id) ? '✓ Bereit zur Abstimmung (nochmal tippen = doch nicht)' : 'Bereit zur Abstimmung'}
              </BigButton>
              <div className="text-center text-sm font-bold text-white/70">
                {pub.ready.length}/{pub.alive.length} bereit – ab zwei Dritteln wird abgestimmt
              </div>
            </>
          )}
          {pub.phase === 'vote' && priv.alive && (
            <>
              <Info>Wen verbannt das Dorf? Du kannst deine Stimme ändern, bis alle abgestimmt haben.</Info>
              <Picker
                room={room}
                ids={pub.alive.filter((id) => id !== me.id)}
                selected={done ? (priv.pick ?? 'none') : undefined}
                onPick={(id) => sendAction('vote', { target: id })}
                allowNone="Niemand verbannen"
                counts={pub.votes}
              />
            </>
          )}
          {pub.phase === 'end' && (
            <Center
              title={pub.winner === 'dorf' ? '🏡 Das Dorf gewinnt!' : '🐺 Die Werwölfe gewinnen!'}
              text={ROLE_INFO[priv.role].team === pub.winner ? 'Dein Team hat gewonnen! 🎉' : 'Dein Team hat verloren.'}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {priv.seen.length > 0 && (
        <div className="mt-auto rounded-2xl bg-black/30 p-3">
          <div className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-white/60">🔮 Deine Visionen (geheim)</div>
          {priv.seen.map((s) => (
            <div key={`${s.day}-${s.playerId}`} className="text-sm font-bold">
              Nacht {s.day}: {nameOf(room, s.playerId)} ist {s.wolf ? <b className="text-[#ff8a8a]">ein Werwolf!</b> : <b className="text-[#9be7a0]">kein Werwolf</b>}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ night, children }: { night: boolean; children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto text-white">
      <NightSky dark={night} moon={false} />
      <div className="relative z-10 flex min-h-full flex-col gap-3 px-4 pb-6 safe-pt safe-pb">{children}</div>
    </div>
  );
}

/** Rolle nur sichtbar, solange man den Finger draufhält – damit niemand mitliest */
function RoleCard({ priv, room, big }: { priv: VollmondPrivateState; room: RoomSnapshot; big: boolean }) {
  const [show, setShow] = useState(false);
  const info = ROLE_INFO[priv.role];
  return (
    <button
      onPointerDown={() => {
        setShow(true);
        haptics.play('light');
      }}
      onPointerUp={() => setShow(false)}
      onPointerLeave={() => setShow(false)}
      onPointerCancel={() => setShow(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 border-white/20 bg-white/10 px-5 text-left backdrop-blur ${big ? 'py-8' : 'py-3'}`}
    >
      {show ? (
        <div className="flex flex-col gap-1.5">
          <div className={`${big ? 'text-6xl' : 'text-4xl'}`}>{info.emoji}</div>
          <div className={`${big ? 'text-4xl' : 'text-2xl'} font-black`}>{info.name}</div>
          <div className="text-sm font-bold text-white/85">{info.text}</div>
          {priv.wolves.length > 0 && <div className="mt-1 text-sm font-black text-[#ff8a8a]">Die anderen Werwölfe: {priv.wolves.map((id) => nameOf(room, id)).join(', ')}</div>}
          {priv.witch && (
            <div className="text-xs font-black text-white/70">
              Heiltrank {priv.witch.heal ? 'übrig' : 'verbraucht'} · Gifttrank {priv.witch.poison ? 'übrig' : 'verbraucht'}
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center justify-center gap-3 ${big ? 'flex-col py-6' : ''} font-black text-white/85`}>
          <Hand className={big ? 'size-12' : 'size-5'} />
          <span className={big ? 'text-xl' : 'text-base'}>Gedrückt halten, um deine Rolle zu sehen</span>
        </div>
      )}
    </button>
  );
}

function NightTask({ room, me, pub, priv, sendAction }: { room: RoomSnapshot; me: string; pub: VollmondPublicState; priv: VollmondPrivateState; sendAction: Props['sendAction'] }) {
  const others = pub.alive.filter((id) => id !== me);
  const done = pub.done.includes(me);
  if (priv.task === 'wolf') {
    const targets = pub.alive.filter((id) => id !== me && !priv.wolves.includes(id));
    return (
      <>
        <Info>🐺 Wählt euer Opfer. Ihr seht, wen die anderen Werwölfe wählen – einigt euch (ohne zu reden!).</Info>
        <Picker
          room={room}
          ids={targets}
          selected={priv.pick ?? undefined}
          onPick={(id) => sendAction('pick', { target: id })}
          tags={Object.fromEntries(targets.map((t) => [t, Object.entries(priv.wolfPicks).filter(([w, p]) => p === t && w !== me).map(([w]) => nameOf(room, w))]))}
        />
      </>
    );
  }
  if (priv.task === 'seer') {
    const last = priv.seen.find((s) => s.day === pub.day);
    if (last)
      return (
        <Center title={last.wolf ? '🐺 Werwolf!' : '😇 Kein Werwolf'} text={`${nameOf(room, last.playerId)} ${last.wolf ? 'ist ein Werwolf. Pass auf, wem du es erzählst …' : 'ist kein Werwolf.'}`} />
      );
    return (
      <>
        <Info>🔮 Wessen wahre Natur willst du heute Nacht sehen?</Info>
        <Picker room={room} ids={others} onPick={(id) => sendAction('pick', { target: id })} />
      </>
    );
  }
  if (priv.task === 'guard') {
    return (
      <>
        <Info>🛡️ Wen beschützt du heute Nacht?{priv.lastProtected ? ` (Nicht nochmal ${nameOf(room, priv.lastProtected)}.)` : ''}</Info>
        <Picker room={room} ids={pub.alive.filter((id) => id !== priv.lastProtected)} selected={priv.pick ?? undefined} onPick={(id) => sendAction('pick', { target: id })} />
      </>
    );
  }
  // alle anderen tippen auch etwas an – so verrät niemand durch Nichtstun seine Rolle
  return done ? (
    <Center title="🌙" text="Gut. Leg das Handy hin und warte, bis der Morgen graut." />
  ) : (
    <>
      <Info>🌙 Wen findest du am verdächtigsten? (Nur zur Tarnung – damit alle gleich lang aufs Handy schauen.)</Info>
      <Picker room={room} ids={others} onPick={(id) => sendAction('pick', { target: id })} />
    </>
  );
}

function WitchTask({ room, me, pub, priv, sendAction }: { room: RoomSnapshot; me: string; pub: VollmondPublicState; priv: VollmondPrivateState; sendAction: Props['sendAction'] }) {
  const w = priv.witch!;
  const [heal, setHeal] = useState(false);
  const [poison, setPoison] = useState<string | null>(null);
  return (
    <>
      <Info>🧪 {w.victim ? `Die Werwölfe haben ${w.victim === me ? 'DICH' : nameOf(room, w.victim)} gewählt.` : 'Die Werwölfe haben heute niemanden gewählt.'}</Info>
      {w.victim && w.heal && (
        <BigButton active={heal} onClick={() => setHeal((h) => !h)}>
          {heal ? '✓ Heiltrank wird benutzt' : `Heiltrank benutzen – ${w.victim === me ? 'dich' : nameOf(room, w.victim)} retten`}
        </BigButton>
      )}
      {w.poison && (
        <>
          <div className="text-sm font-black text-white/80">Gifttrank (optional) – wen vergiftest du?</div>
          <Picker room={room} ids={pub.alive.filter((id) => id !== me)} selected={poison ?? undefined} onPick={(id) => setPoison((p) => (p === id ? null : id))} />
        </>
      )}
      <BigButton onClick={() => sendAction('witch', { heal, target: poison })}>Fertig – weiterschlafen</BigButton>
    </>
  );
}

function News({ room, pub }: { room: RoomSnapshot; pub: VollmondPublicState }) {
  if (pub.news.length === 0) return <Center title={pub.phase === 'morning' ? '🌅' : '⚖️'} text={pub.narration.text} />;
  return (
    <div className="flex flex-col gap-2">
      {pub.news.map((d) => (
        <div key={d.playerId} className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
          <Avatar room={room} id={d.playerId} size="md" dead />
          <div>
            <div className="text-xl font-black">{nameOf(room, d.playerId)}</div>
            <div className="text-sm font-bold text-white/75">{d.role ? `${ROLE_INFO[d.role].emoji} ${ROLE_INFO[d.role].name}` : 'Rolle bleibt geheim'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Picker({
  room,
  ids,
  selected,
  onPick,
  allowNone,
  tags,
  counts,
}: {
  room: RoomSnapshot;
  ids: string[];
  selected?: string | null;
  onPick: (id: string | null) => void;
  allowNone?: string;
  tags?: Record<string, string[]>;
  counts?: Record<string, string | null>;
}) {
  const votesFor = (id: string) => (counts ? Object.values(counts).filter((v) => v === id).length : 0);
  return (
    <div className="grid grid-cols-2 gap-2">
      {ids.map((id) => {
        const active = selected === id;
        return (
          <button
            key={id}
            onClick={() => {
              haptics.play('medium');
              onPick(id);
            }}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition active:scale-95 ${active ? 'bg-[#e8c25b] text-[#1d2350]' : 'bg-white/12 bg-white/10'}`}
          >
            <Avatar room={room} id={id} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-black">{nameOf(room, id)}</span>
              {tags?.[id]?.length ? <span className="block truncate text-xs font-black text-[#ff8a8a]">🐺 {tags[id]!.join(', ')}</span> : null}
            </span>
            {counts && votesFor(id) > 0 && <span className="rounded-full bg-black/30 px-2 text-sm font-black">{votesFor(id)}</span>}
            {active && <Check className="size-5 shrink-0" strokeWidth={3} />}
          </button>
        );
      })}
      {allowNone && (
        <button
          onClick={() => onPick(null)}
          className={`col-span-2 rounded-2xl px-3 py-2.5 font-black ${selected === 'none' ? 'bg-[#e8c25b] text-[#1d2350]' : 'bg-white/10'}`}
        >
          {allowNone}
        </button>
      )}
    </div>
  );
}

function BigButton({ children, onClick, disabled, active }: { children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        haptics.play('light');
        onClick();
      }}
      className={`min-h-14 rounded-2xl px-4 py-3 text-lg font-black shadow transition active:scale-[0.98] disabled:opacity-50 ${active ? 'bg-[#9be7a0] text-[#10301a]' : 'bg-[#e8c25b] text-[#1d2350]'}`}
    >
      {children}
    </button>
  );
}

function Info({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-black/30 px-4 py-2.5 text-center font-bold">{children}</p>;
}

function Center({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="text-5xl font-black">{title}</div>
      <p className="max-w-sm font-bold text-white/80">{text}</p>
    </div>
  );
}
