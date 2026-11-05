import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { WordManager } from '../../components/word-manager/WordManager';

export function WordsPage() {
  return (
    <div className="app-backdrop min-h-dvh px-5 pb-12 safe-pt sm:px-10">
      <header className="flex items-center justify-between py-6">
        <Logo size="sm" />
        <Link to="/" className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-sm font-medium text-white/75 hover:bg-white/15">
          <ArrowLeft className="size-4" /> Zurück
        </Link>
      </header>
      <main className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">Eigene Wörter</h1>
        <p className="mb-8 mt-2 text-white/55">
          Erstelle Wortlisten für Montagsmaler. Wähle sie anschließend in den Spieleinstellungen im Modus „Eigene Wörter“ oder „Mix“.
        </p>
        <WordManager />
      </main>
    </div>
  );
}
