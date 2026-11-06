import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { NoticeKind } from '../../shared/types/room';

type ToastFn = (message: string, kind?: NoticeKind) => void;
const ToastContext = createContext<ToastFn>(() => {});

interface ToastItem {
  id: number;
  message: string;
  kind: NoticeKind;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback<ToastFn>((message, kind = 'info') => {
    const id = ++seq;
    setItems((list) => [...list.filter((t) => t.message !== message), { id, message, kind }].slice(-4));
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 font-sans safe-pt">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-home-line bg-white px-5 py-3 text-sm font-bold text-home-text shadow-[0_12px_30px_-10px_rgba(40,50,70,0.4)]"
              role="status"
            >
              {t.kind === 'success' && <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />}
              {t.kind === 'error' && <XCircle className="size-5 shrink-0 text-rose-500" />}
              {t.kind === 'info' && <Info className="size-5 shrink-0 text-cyan" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
