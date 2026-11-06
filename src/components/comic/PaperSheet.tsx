import type { ReactNode } from 'react';

/**
 * Karopapier-Blatt im Block-Look: gelochter Rand oben, rote Linie, darunter Kästchen.
 * Grundlage für alle Spiel-Oberflächen im Comic-Stil.
 */
export function PaperSheet({ children, compact, className = '' }: { children: ReactNode; compact?: boolean; className?: string }) {
  const holes = compact ? 9 : 22;
  return (
    <div className={`comic relative flex h-dvh flex-col overflow-hidden bg-paper ${className}`}>
      <div className={`relative shrink-0 bg-[#fbfbf8] ${compact ? 'h-7' : 'h-12'}`}>
        <div className="absolute inset-x-[3%] top-1/2 flex -translate-y-1/2 justify-between" aria-hidden>
          {Array.from({ length: holes }).map((_, i) => (
            <span
              key={i}
              className={`${compact ? 'size-2.5' : 'size-4'} rounded-full bg-[#d9dde2] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]`}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-margin" />
      </div>
      <div className="paper-grid relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Klebestreifen-Deko für Ecken. */
export function Tape({ className = '' }: { className?: string }) {
  return <div className={`pointer-events-none absolute h-7 w-24 bg-[#fff6c9]/80 shadow-sm [clip-path:polygon(3%_0,97%_6%,100%_100%,0_92%)] ${className}`} aria-hidden />;
}
