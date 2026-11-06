import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PLAYER_NAME_MAX, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, STORAGE_KEYS } from '../../shared/constants';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

interface Props {
  initialCode?: string;
  onJoin: (code: string, name: string) => Promise<void>;
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
  const valid = code.length === ROOM_CODE_LENGTH && name.trim().length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(code, name.trim());
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

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}

        <Button type="submit" variant="primary" size="xl" disabled={!valid} loading={busy} className="w-full">
          Beitreten <ArrowRight className="size-6" />
        </Button>
      </motion.form>
    </div>
  );
}
