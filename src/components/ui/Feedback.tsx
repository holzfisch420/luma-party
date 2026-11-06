import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../../app/session/session-store';
import { Logo } from './Logo';

export function Spinner({ className = 'size-6' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-cyan ${className}`} />;
}

export function LoadingScreen({ label = 'Verbinde …' }: { label?: string }) {
  return (
    <div className="home-bg flex min-h-dvh flex-col items-center justify-center gap-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Logo size="lg" />
      </motion.div>
      <div className="flex items-center gap-3 font-bold text-home-muted">
        <Spinner className="size-5" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ConnectionStatusBadge({ status, compact }: { status: ConnectionStatus; compact?: boolean }) {
  const ok = status === 'connected';
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-amber-200 bg-amber-50 text-amber-600'}`}
      title={ok ? 'Verbunden' : 'Verbindung unterbrochen'}
    >
      {ok ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5 animate-pulse" />}
      {!compact && <span>{ok ? 'Verbunden' : 'Verbinde neu …'}</span>}
    </div>
  );
}

/** Neutrales Banner – funktioniert über Launcher und Spielen. */
export function ReconnectBanner({ status }: { status: ConnectionStatus }) {
  return (
    <AnimatePresence>
      {status !== 'connected' && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed inset-x-0 top-0 z-[90] flex justify-center p-3 font-sans safe-pt">
          <div className="flex items-center gap-2.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-extrabold text-black shadow-xl">
            <Loader2 className="size-4 animate-spin" />
            Verbindung unterbrochen – verbinde neu …
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
