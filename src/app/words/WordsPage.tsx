import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { WordManager } from '../../components/word-manager/WordManager';

export function WordsPage() {
  return (
    <div className="home-bg min-h-dvh px-5 pb-12 safe-pt sm:px-10">
      <header className="flex items-center justify-between py-6">
        <Logo size="sm" />
        <Link to="/" className="home-tile flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold">
          <ArrowLeft className="size-4" /> Zurück
        </Link>
      </header>
      <main className="home-panel mx-auto max-w-3xl rounded-[32px] p-6 sm:p-8">
        <h1 className="text-4xl font-black tracking-tight">Eigene Wörter</h1>
        <p className="mb-8 mt-2 font-bold text-home-muted">
          Erstelle Wortlisten für Montagsmaler und wähle sie in den Spieleinstellungen unter „Eigene Wörter“ oder „Mix“.
        </p>
        <WordManager />
      </main>
    </div>
  );
}
