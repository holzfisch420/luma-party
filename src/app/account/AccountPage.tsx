import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AccountPanel } from '../../components/avatar/AccountPanel';
import { Logo } from '../../components/ui/Logo';

/** Konto-Seite: anmelden/registrieren, Avatar bauen, Konto verwalten. */
export function AccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const back = params.get('back');
  const safeBack = back && back.startsWith('/') && !back.startsWith('//') ? back : null;
  return (
    <div className="home-bg min-h-dvh px-5 pb-12 safe-pt sm:px-10">
      <header className="flex items-center justify-between py-5">
        <Logo size="sm" />
        <Link to={safeBack ?? '/'} className="home-tile flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold">
          <ArrowLeft className="size-4" /> {safeBack ? 'Zurück zum Spiel' : 'Zurück'}
        </Link>
      </header>
      <main className="home-panel mx-auto max-w-xl rounded-[32px] p-6 sm:p-8">
        <h1 className="mb-5 text-3xl font-black tracking-tight">Mein Konto</h1>
        <AccountPanel onChanged={(kind) => (kind === 'avatar' || kind === 'signed-in') && safeBack && navigate(safeBack)} />
      </main>
    </div>
  );
}
