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
    <div className="app-backdrop flex min-h-dvh flex-col px-6 safe-pt safe-pb">
      <div className="pt-6">
        <Logo size="sm" />
      </div>
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8"
      >
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Mitspielen</h1>
          <p className="mt-2 text-white/55">Gib den Code vom Bildschirm und deinen Namen ein.</p>
        </div>

        <label className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Raumcode</span>
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
                  className={`grid aspect-square place-items-center rounded-2xl text-4xl font-bold transition-all ${
                    code[i] ? 'bg-white text-black' : i === code.length ? 'border-2 border-white/60 bg-white/[0.06]' : 'border border-white/10 bg-white/[0.04]'
                  }`}
                >
                  {code[i] ?? ''}
                </div>
              ))}
            </div>
          </div>
        </label>

        <label className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Dein Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, PLAYER_NAME_MAX))}
            maxLength={PLAYER_NAME_MAX}
            placeholder="z. B. Max"
            autoComplete="nickname"
            enterKeyHint="go"
            autoFocus={!!code}
            className="h-16 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-xl outline-none transition placeholder:text-white/30 focus:border-white/50"
          />
        </label>

        {error && <div className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm font-medium text-rose-200">{error}</div>}

        <Button type="submit" variant="primary" size="xl" disabled={!valid} loading={busy} className="w-full">
          Beitreten <ArrowRight className="size-6" />
        </Button>
      </motion.form>
    </div>
  );
}
