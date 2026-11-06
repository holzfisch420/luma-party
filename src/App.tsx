import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { Landing } from './app/landing/Landing';
import { HostApp } from './app/launcher/HostApp';
import { PlayerApp } from './app/mobile/PlayerApp';
import { WordsPage } from './app/words/WordsPage';
import { AccountPage } from './app/account/AccountPage';
import { restoreWordLists } from './components/word-manager/word-api';

export function App() {
  // Online-Modus: gesicherte eigene Wortlisten nach einem Server-Neustart zurückspielen
  useEffect(() => {
    void restoreWordLists();
  }, []);
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/host" element={<HostApp />} />
          <Route path="/play" element={<PlayerApp />} />
          <Route path="/words" element={<WordsPage />} />
          <Route path="/konto" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
