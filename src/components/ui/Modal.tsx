import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

// Stapel offener Dialoge – Escape schließt nur den obersten
const openStack: symbol[] = [];

/** Zentriertes Panel auf großen Bildschirmen, Bottom-Sheet auf Smartphones. */
export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const id = Symbol('modal');
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openStack[openStack.length - 1] !== id) return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openStack.splice(openStack.indexOf(id), 1);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`relative flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-ink-800/95 shadow-2xl shadow-black/60 sm:rounded-[28px]`}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5 sm:px-8 sm:pt-7">
              <div>
                {title && <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                aria-label="Schließen"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">{children}</div>
            {footer && <div className="border-t border-white/10 px-6 py-4 safe-pb sm:px-8">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
