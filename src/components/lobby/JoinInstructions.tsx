import { useEffect, useState } from 'react';
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

export function useQrSvg(text: string): string {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#2b2f36', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [text]);
  return qr;
}

export function QrCode({ text, className = '' }: { text: string; className?: string }) {
  const qr = useQrSvg(text);
  return <div className={`bg-white [&>svg]:size-full ${className}`} dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR-Code zum Beitreten" />;
}

/** Große Beitritts-Anleitung (für das Beitreten-Fenster). */
export function JoinInstructions({ code }: { code: string }) {
  const url = useJoinUrl(code);
  const display = url.replace(/^https?:\/\//, '').replace(/\?code=.*/, '');
  return (
    <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
      <QrCode text={url} className="size-44 shrink-0 rounded-3xl border border-home-line p-3 shadow-md" />
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
