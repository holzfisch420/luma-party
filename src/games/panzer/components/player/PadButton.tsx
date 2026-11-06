import type { ReactNode } from 'react';
import { haptics, type HapticKind } from '../../../../app/haptics';

interface Props {
  label: ReactNode;
  ariaLabel: string;
  sub?: ReactNode;
  color: string;
  size: number;
  disabled?: boolean;
  /** 0..1 Abklingzeit (zeigt einen Füllstand) */
  cooldown?: number;
  /** Art der haptischen Rückmeldung beim Drücken */
  haptic?: HapticKind;
  onPress: (down: boolean) => void;
}

function darken(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * 0.72);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Runde, flache Gamepad-Taste (Google-Minispiel-Stil), mehrfach-touchfähig. */
export function PadButton({ label, ariaLabel, sub, color, size, disabled, cooldown = 0, haptic = 'light', onPress }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`touch-none-all relative grid select-none place-items-center rounded-full text-white transition-transform duration-75 active:translate-y-[4px] active:!shadow-none ${disabled ? 'opacity-50' : ''}`}
      style={{ width: size, height: size, background: color, boxShadow: `0 5px 0 ${darken(color)}, 0 8px 14px rgba(0,0,0,0.25)` }}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* z. B. synthetische Ereignisse */
        }
        haptics.play(disabled ? 'tick' : haptic);
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onLostPointerCapture={() => onPress(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {cooldown > 0 && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-x-0 bottom-0 bg-black/35" style={{ height: `${cooldown * 100}%` }} />
        </span>
      )}
      <span className="pointer-events-none relative flex flex-col items-center leading-none [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
        <span className="font-black" style={{ fontSize: size * 0.34 }}>
          {label}
        </span>
        {sub && <span className="mt-1 text-[11px] font-bold opacity-95">{sub}</span>}
      </span>
    </button>
  );
}
