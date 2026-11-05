import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';
import { getServerInfo } from '../../app/session/server-info';

/** Ermittelt die im LAN erreichbare Beitritts-URL (für Smartphones). */
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

export function JoinInstructions({ code, compact }: { code: string; compact?: boolean }) {
  const url = useJoinUrl(code);
  const [qr, setQr] = useState<string>('');
  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);
  const display = url.replace(/^https?:\/\//, '').replace(/\?code=.*/, '');

  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-5'}`}>
      <div
        className={`${compact ? 'size-16 p-1.5 rounded-xl' : 'size-28 p-2.5 rounded-2xl'} shrink-0 bg-white shadow-xl shadow-black/30 [&>svg]:size-full`}
        dangerouslySetInnerHTML={{ __html: qr }}
        aria-label="QR-Code zum Beitreten"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Smartphone className="size-4" /> Mit dem Smartphone mitspielen
        </div>
        <div className={`${compact ? 'text-base' : 'text-xl'} mt-1 truncate font-semibold tracking-tight`}>{display}</div>
        {!compact && <div className="mt-1 text-sm text-white/50">QR-Code scannen oder Adresse öffnen und Code eingeben</div>}
      </div>
    </div>
  );
}
