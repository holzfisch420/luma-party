import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '../../app/session/session-store';
import { Logo } from './Logo';

export function Spinner({ className = 'size-6' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-white/70 ${className}`} />;
}

export function LoadingScreen({ label = 'Verbinde …' }: { label?: string }) {
  return (
    <div className="app-backdrop flex min-h-dvh flex-col items-center justify-center gap-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <Logo size="lg" />
      </motion.div>
      <div className="flex items-center gap-3 text-white/60">
        <Spinner className="size-5" />
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Kleiner Statusindikator + Banner bei Verbindungsverlust. */
export function ConnectionStatusBadge({ status, compact }: { status: ConnectionStatus; compact?: boolean }) {
  const ok = status === 'connected';
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${ok ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/15 text-amber-200'}`}>
      {ok ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5 animate-pulse" />}
      {!compact && <span>{ok ? 'Verbunden' : 'Verbinde neu …'}</span>}
    </div>
  );
}

export function ReconnectBanner({ status }: { status: ConnectionStatus }) {
  return (
    <AnimatePresence>
      {status !== 'connected' && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[90] flex justify-center p-3 safe-pt"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-xl">
            <Loader2 className="size-4 animate-spin" />
            Verbindung unterbrochen – verbinde neu …
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
