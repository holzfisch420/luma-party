import type { ReactNode } from 'react';

interface Props {
  label: string;
  sub?: ReactNode;
  color: string;
  size: number;
  disabled?: boolean;
  /** 0..1 Abklingzeit (zeigt einen Füllstand) */
  cooldown?: number;
  onPress: (down: boolean) => void;
}

/** Runde Gamepad-Taste im Comic-Stil, mehrfach-touchfähig. */
export function PadButton({ label, sub, color, size, disabled, cooldown = 0, onPress }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`touch-none-all relative grid select-none place-items-center rounded-full border-4 border-ink text-ink shadow-[4px_4px_0_#161616] transition-[transform,box-shadow] duration-75 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${disabled ? 'opacity-45' : ''}`}
      style={{ width: size, height: size, background: color }}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* z. B. synthetische Ereignisse */
        }
        navigator.vibrate?.(12);
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onLostPointerCapture={() => onPress(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {cooldown > 0 && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-x-0 bottom-0 bg-black/40" style={{ height: `${cooldown * 100}%` }} />
        </span>
      )}
      <span className="pointer-events-none relative flex flex-col items-center leading-none">
        <span className="font-bangers" style={{ fontSize: size * 0.36 }}>
          {label}
        </span>
        {sub && <span className="mt-0.5 text-[11px] font-bold">{sub}</span>}
      </span>
    </button>
  );
}
