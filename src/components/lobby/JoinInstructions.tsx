import { AnimatePresence, motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { getServerInfo } from '../../app/session/server-info';

/** Ermittelt die Beitritts-URL (im Heimnetz mit LAN-IP statt localhost). */
export function useJoinUrl(code: string | undefined): string {
  const [base, setBase] = useState(() => window.location.origin);
  useEffect(() => {
    const { hostname, protocol, port } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return;
    getServerInfo()
      .then((info) => {
        const ip = info.lanAddresses[0];
        if (ip) setBase(`${protocol}//${ip}${port ? `:${port}` : ''}`);
      })
      .catch(() => {});
  }, []);
  return code ? `${base}/play?code=${code}` : `${base}/play`;
}

export function useQrSvg(text: string, opts: { margin?: number; dark?: string } = {}): string {
  const [qr, setQr] = useState('');
  const { margin = 0, dark = '#2b2f36' } = opts;
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin, errorCorrectionLevel: 'M', color: { dark, light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [text, margin, dark]);
  return qr;
}

/**
 * QR-Code; mit `zoomable` lässt er sich per Klick bildschirmfüllend vergrößern
 * (zum Scannen aus ein paar Metern Entfernung).
 */
export function QrCode({ text, className = '', zoomable = false, code }: { text: string; className?: string; zoomable?: boolean; code?: string }) {
  const qr = useQrSvg(text);
  const [zoom, setZoom] = useState(false);
  const img = <div className={`bg-white [&>svg]:size-full ${className}`} dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR-Code zum Beitreten" />;
  if (!zoomable) return img;
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} className="group relative shrink-0 cursor-zoom-in" aria-label="QR-Code vergrößern" title="Zum Vergrößern klicken">
        {img}
        <span className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-2 border-white bg-cyan text-white shadow-md transition group-hover:scale-110">
          <ZoomIn className="size-4" />
        </span>
      </button>
      <QrZoom open={zoom} onClose={() => setZoom(false)} text={text} code={code} />
    </>
  );
}

/** Bildschirmfüllende QR-Ansicht – Klick irgendwo oder Escape schließt sie. */
export function QrZoom({ open, onClose, text, code }: { open: boolean; onClose: () => void; text: string; code?: string }) {
  // großer, kontrastreicher Code mit Ruhezone (wichtig für Kameras auf Distanz)
  const qr = useQrSvg(text, { margin: 2, dark: '#000000' });
  const display = text.replace(/^https?:\/\//, '').replace(/\?code=.*/, '');
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true); // vor Dialogen und Kachelraster abfangen
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex cursor-zoom-out flex-col items-center justify-center gap-[2.5vh] bg-[#eef1f4]/95 p-4 font-sans backdrop-blur-md"
          role="dialog"
          aria-label="QR-Code zum Beitreten"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="rounded-[4vmin] bg-white p-[1.5vmin] shadow-[0_30px_80px_-20px_rgba(40,50,70,0.5)] [&>svg]:size-full"
            style={{ width: 'min(72vh, 88vw)', height: 'min(72vh, 88vw)' }}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <div className="text-center text-home-text">
            {code && (
              <div className="text-[clamp(1.5rem,4.5vh,3.5rem)] font-black leading-none">
                Code <span className="tracking-[0.15em] text-cyan-dark">{code}</span>
              </div>
            )}
            <div className="mt-1 text-[clamp(0.9rem,2.2vh,1.4rem)] font-bold text-home-muted">
              Mit der Handy-Kamera scannen oder {display} öffnen · Tippen zum Schließen
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Große Beitritts-Anleitung (für das Beitreten-Fenster). */
export function JoinInstructions({ code }: { code: string }) {
  const url = useJoinUrl(code);
  const display = url.replace(/^https?:\/\//, '').replace(/\?code=.*/, '');
  return (
    <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
      <QrCode text={url} code={code} zoomable className="size-44 shrink-0 rounded-3xl border border-home-line p-3 shadow-md" />
      <div>
        <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-cyan-dark">Mit dem Handy mitspielen</div>
        <ol className="mt-2 space-y-1.5 text-[15px] font-semibold text-home-text">
          <li>1. QR-Code mit der Handy-Kamera scannen</li>
          <li>
            2. oder <strong className="font-black">{display}</strong> öffnen
          </li>
          <li>
            3. Code <strong className="font-black tracking-[0.2em] text-cyan-dark">{code}</strong> und Namen eingeben
          </li>
        </ol>
      </div>
    </div>
  );
}
