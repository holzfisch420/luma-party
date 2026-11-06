import type { ReactNode } from 'react';
import { Tape } from '../../../components/comic/PaperSheet';

/** Zeichenblatt: Karopapier mit dicker Comic-Kontur und Klebestreifen. */
export function DrawingSheet({ children, tape = true, className = '' }: { children: ReactNode; tape?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="paper-grid relative overflow-hidden rounded-[18px] border-[3.5px] border-ink bg-white shadow-[6px_6px_0_#161616] [background-size:22px_22px]">
        {children}
      </div>
      {tape && (
        <>
          <Tape className="-left-6 -top-2 -rotate-[30deg]" />
          <Tape className="-right-6 -top-2 rotate-[32deg]" />
        </>
      )}
    </div>
  );
}
