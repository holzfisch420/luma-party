import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { ui } from '../../app/audio/sfx';
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

/** Helles Panel im Home-Menü-Stil; auf Smartphones als Bottom-Sheet. */
export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    ui.open();
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
      ui.close();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center font-sans sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-[#c9d1d9]/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={`relative flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-[30px] border border-white bg-gradient-to-b from-white to-[#f3f5f8] text-home-text shadow-[0_30px_80px_-20px_rgba(40,50,70,0.45)] sm:rounded-[30px]`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-home-line/70 px-6 pb-4 pt-5 sm:px-8 sm:pt-6">
              <div>
                {title && <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-sm font-semibold text-home-muted">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-home-line bg-white text-home-muted shadow-sm transition hover:text-home-text"
                aria-label="Schließen"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">{children}</div>
            {footer && <div className="border-t border-home-line/70 px-6 py-4 safe-pb sm:px-8">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
