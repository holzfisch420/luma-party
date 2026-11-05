/** Kleine, wiederverwendbare Formular-Steuerelemente im Launcher-Stil. */
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-40 ${checked ? 'bg-emerald-400' : 'bg-white/15'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className={`absolute top-0.5 size-6 rounded-full bg-white shadow ${checked ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  layoutId,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  layoutId: string;
}) {
  return (
    <div className={`flex rounded-2xl bg-white/[0.06] p-1 ${disabled ? 'opacity-50' : ''}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${value === o.value ? 'text-black' : 'text-white/70 hover:text-white'}`}
        >
          {value === o.value && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-white" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, min, max, step = 1, onChange, disabled, format }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void; disabled?: boolean; format?: (v: number) => string;
}) {
  return (
    <div className={`flex items-center gap-1 rounded-2xl bg-white/[0.06] p-1 ${disabled ? 'opacity-50' : ''}`}>
      <button type="button" aria-label="Weniger" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - step))} className="grid size-9 place-items-center rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-30">
        <Minus className="size-4" />
      </button>
      <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums">{format ? format(value) : value}</span>
      <button type="button" aria-label="Mehr" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + step))} className="grid size-9 place-items-center rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-30">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-40 ${
        active ? 'border-white/80 bg-white text-black' : 'border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function SettingRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <div className="text-[15px] font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-white/50">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-white/40 first:mt-0">{children}</h3>;
}
