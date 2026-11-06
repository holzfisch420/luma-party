import { motion } from 'framer-motion';
import { ArrowRight, Share, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { accountActions, getAuthToken, useAccount } from '../../app/account/account-store';
import { PlayerAvatar } from '../lobby/PlayerAvatar';
import { useState, type FormEvent } from 'react';
import { PLAYER_NAME_MAX, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, STORAGE_KEYS } from '../../shared/constants';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

interface Props {
  initialCode?: string;
  onJoin: (code: string, name: string, authToken?: string | null) => Promise<void>;
  notice?: string | null;
}

const cleanCode = (v: string) =>
  v
    .toUpperCase()
    .split('')
    .filter((c) => ROOM_CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, ROOM_CODE_LENGTH);

export function MobileJoinScreen({ initialCode = '', onJoin, notice }: Props) {
  const [code, setCode] = useState(cleanCode(initialCode));
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.playerName) ?? '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState<string | null>(notice ?? null);
  const [busy, setBusy] = useState(false);
  const { account } = useAccount();
  const valid = code.length === ROOM_CODE_LENGTH && (!!account || name.trim().length > 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(code, account ? account.username : name.trim(), account ? getAuthToken() : null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="home-bg flex min-h-dvh flex-col px-6 safe-pt safe-pb">
      <div className="pt-4">
        <Logo size="sm" />
      </div>
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Mitspielen</h1>
          <p className="mt-1 font-bold text-home-muted">Code vom Fernseher und deinen Namen eingeben.</p>
        </div>

        <label className="flex flex-col gap-2.5">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-dark">Raumcode</span>
          <div className="relative">
            <input
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Raumcode"
              className="absolute inset-0 z-10 w-full cursor-text opacity-0"
              autoFocus={!code}
            />
            <div className="grid grid-cols-4 gap-3" aria-hidden>
              {Array.from({ length: ROOM_CODE_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`grid aspect-square place-items-center rounded-[26%] text-4xl font-black transition-all ${
                    code[i] ? 'home-tile text-cyan-dark' : i === code.length ? 'border-[3px] border-cyan bg-white/70' : 'border-2 border-white/80 bg-white/40'
                  }`}
                >
                  {code[i] ?? ''}
                </div>
              ))}
            </div>
          </div>
        </label>

        {account ? (
          <div className="home-tile flex items-center gap-4 rounded-[24px] p-3">
            <PlayerAvatar name={account.username} color="#1fb3d4" avatar={account.avatar} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-dark">Du spielst als</div>
              <div className="truncate text-2xl font-black">{account.username}</div>
            </div>
            <button type="button" onClick={() => accountActions.signOut()} className="text-xs font-extrabold text-home-muted underline">
              Als Gast
            </button>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-2.5">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-dark">Dein Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, PLAYER_NAME_MAX))}
                maxLength={PLAYER_NAME_MAX}
                placeholder="z. B. Max"
                autoComplete="nickname"
                enterKeyHint="go"
                autoFocus={!!code}
                className="home-input !h-16 !rounded-[20px] !text-xl font-bold"
              />
            </label>
            <Link
              to={`/konto?back=${encodeURIComponent(`/play${code ? `?code=${code}` : ''}`)}`}
              className="-mt-3 flex items-center gap-2 self-start text-sm font-extrabold text-cyan-dark"
            >
              <UserRound className="size-4" /> Mit Konto &amp; eigenem Avatar spielen
            </Link>
          </>
        )}

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}

        <HomeScreenTip />

        <Button type="submit" variant="primary" size="xl" disabled={!valid} loading={busy} className="w-full">
          Beitreten <ArrowRight className="size-6" />
        </Button>
      </motion.form>
    </div>
  );
}

const TIP_KEY = 'luma.homescreen-tip';

/** iPhone in Safari: Tipp „Zum Home-Bildschirm“ – Vollbild ohne Safari-Leisten */
function HomeScreenTip() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(TIP_KEY) === 'off';
    } catch {
      /* ignorieren */
    }
    return ios && !standalone && !dismissed;
  });
  if (!visible) return null;
  return (
    <div className="home-tile relative flex gap-3 rounded-[20px] p-4 pr-10 text-sm font-bold text-home-muted">
      <Share className="mt-0.5 size-5 shrink-0 text-cyan" />
      <span>
        Tipp fürs iPhone: Tippe unten auf <b className="text-home-text">Teilen</b> → <b className="text-home-text">Zum Home-Bildschirm</b>. Dann läuft der Controller im Vollbild – ohne Safari-Leisten.
      </span>
      <button
        type="button"
        aria-label="Tipp ausblenden"
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-home-muted"
        onClick={() => {
          try {
            localStorage.setItem(TIP_KEY, 'off');
          } catch {
            /* ignorieren */
          }
          setVisible(false);
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
