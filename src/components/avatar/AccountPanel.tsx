import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, LogIn, LogOut, Pencil, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { accountActions, useAccount } from '../../app/account/account-store';
import { SHIRT_COLORS, randomAvatar, type AvatarConfig } from '../../shared/avatar';
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '../../shared/types/account';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Controls';
import { Spinner } from '../ui/Feedback';
import { useToast } from '../ui/Toast';
import { AvatarEditor } from './AvatarEditor';
import { AvatarFace, shade } from './AvatarFace';

interface Props {
  /** nach Anmeldung/Registrierung oder gespeichertem Avatar */
  onChanged?: (kind: 'registered' | 'signed-in' | 'avatar' | 'signed-out') => void;
}

/** Anmelden/Registrieren bzw. Profil mit Avatar, Passwort ändern, Abmelden, Löschen. */
export function AccountPanel({ onChanged }: Props) {
  const { status, account } = useAccount();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [fresh, setFresh] = useState(false);

  if (status === 'unknown') return <div className="grid h-40 place-items-center"><Spinner /></div>;

  if (!account) {
    return (
      <AuthForms
        onDone={(isNew) => {
          setFresh(isNew);
          setEditing(isNew);
          onChanged?.(isNew ? 'registered' : 'signed-in');
        }}
      />
    );
  }

  if (editing) {
    return (
      <div>
        {fresh && (
          <div className="mb-5 rounded-2xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm font-bold text-cyan-dark">
            Willkommen, {account.username}! Bau dir jetzt deinen Avatar – er erscheint im Spiel und auf dem Fernseher.
          </div>
        )}
        <AvatarEditor
          initial={account.avatar}
          saveLabel={fresh ? 'Fertig' : 'Avatar speichern'}
          onCancel={fresh ? undefined : () => setEditing(false)}
          onSave={async (avatar) => {
            try {
              await accountActions.saveAvatar(avatar);
              toast('Avatar gespeichert!', 'success');
              setEditing(false);
              setFresh(false);
              onChanged?.('avatar');
            } catch (e) {
              toast((e as Error).message, 'error');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="home-tile relative size-28 shrink-0 overflow-hidden rounded-[28%]" style={{ background: `radial-gradient(circle at 50% 35%, #fff, ${shade(SHIRT_COLORS[account.avatar.shirt]!, 0.7)})` }}>
          <AvatarFace avatar={account.avatar} className="absolute inset-0 size-full" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-home-muted">Angemeldet als</div>
          <div className="truncate text-3xl font-black tracking-tight">{account.username}</div>
          <Button variant="primary" size="sm" className="mt-2" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
            Avatar bearbeiten
          </Button>
        </div>
      </div>

      <Collapsible icon={<KeyRound className="size-4" />} title="Passwort ändern">
        <ChangePassword />
      </Collapsible>

      <div className="flex flex-wrap gap-3">
        <Button
          icon={<LogOut className="size-4" />}
          onClick={() => {
            accountActions.signOut();
            onChanged?.('signed-out');
          }}
        >
          Abmelden
        </Button>
      </div>

      <Collapsible icon={<Trash2 className="size-4" />} title="Konto löschen" danger>
        <DeleteAccount onDeleted={() => onChanged?.('signed-out')} />
      </Collapsible>
    </div>
  );
}

function AuthForms({ onDone }: { onDone: (isNew: boolean) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [starter] = useState<AvatarConfig>(() => randomAvatar());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && password !== password2) return setError('Die Passwörter stimmen nicht überein.');
    setBusy(true);
    try {
      if (mode === 'register') await accountActions.register(username.trim(), password, starter);
      else await accountActions.login(username.trim(), password);
      onDone(mode === 'register');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Segmented
        layoutId="auth-mode"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: 'register', label: 'Neues Konto' },
          { value: 'login', label: 'Anmelden' },
        ]}
      />
      <p className="text-sm font-bold text-home-muted">
        {mode === 'register'
          ? 'Mit einem Konto bekommst du deinen eigenen Avatar und deinen Namen auf jedem Gerät.'
          : 'Willkommen zurück!'}
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Benutzername</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={USERNAME_MAX}
          minLength={USERNAME_MIN}
          autoComplete="username"
          placeholder="z. B. Max"
          className="home-input font-bold"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Passwort</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={PASSWORD_MIN}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          placeholder={mode === 'register' ? `mindestens ${PASSWORD_MIN} Zeichen` : ''}
          className="home-input font-bold"
          required
        />
      </label>
      {mode === 'register' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-dark">Passwort wiederholen</span>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" className="home-input font-bold" required />
        </label>
      )}
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}
      <Button type="submit" variant="primary" size="lg" loading={busy} icon={mode === 'register' ? <UserPlus className="size-5" /> : <LogIn className="size-5" />}>
        {mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
      </Button>
    </form>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await accountActions.changePassword(oldPw, newPw);
          setOldPw('');
          setNewPw('');
          toast('Passwort geändert. Andere Geräte müssen sich neu anmelden.', 'success');
        } catch (err) {
          toast((err as Error).message, 'error');
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="Aktuelles Passwort" autoComplete="current-password" className="home-input" required />
      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={`Neues Passwort (min. ${PASSWORD_MIN} Zeichen)`} minLength={PASSWORD_MIN} autoComplete="new-password" className="home-input" required />
      <Button type="submit" size="md" loading={busy} className="self-start">Passwort ändern</Button>
    </form>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await accountActions.deleteAccount(pw);
          toast('Konto gelöscht.', 'success');
          onDeleted();
        } catch (err) {
          toast((err as Error).message, 'error');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm font-bold text-home-muted">Konto und Avatar werden dauerhaft gelöscht. Zur Bestätigung dein Passwort eingeben:</p>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Passwort" autoComplete="current-password" className="home-input" required />
      <Button type="submit" variant="danger" size="md" loading={busy} className="self-start">Endgültig löschen</Button>
    </form>
  );
}

function Collapsible({ title, icon, children, danger }: { title: string; icon: ReactNode; children: ReactNode; danger?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-home-line bg-white">
      <button onClick={() => setOpen((o) => !o)} className={`flex w-full items-center gap-2 px-4 py-3 text-left font-extrabold ${danger ? 'text-rose-500' : ''}`} aria-expanded={open}>
        {icon} {title}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

