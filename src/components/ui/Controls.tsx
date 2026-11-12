/** Formular-Steuerelemente im hellen Launcher-Stil. */
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { ui } from '../../app/audio/sfx';

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        ui.toggle();
        onChange(!checked);
      }}
      className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-300 disabled:opacity-40 ${checked ? 'border-cyan-dark bg-cyan' : 'border-home-line bg-[#dfe4e9]'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className={`absolute top-[3px] size-6 rounded-full bg-white shadow-md ${checked ? 'right-[3px]' : 'left-[3px]'}`}
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
    <div className={`flex rounded-full border border-home-line bg-[#e9edf1] p-1 ${disabled ? 'opacity-50' : ''}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          disabled={disabled}
          onClick={() => {
            ui.toggle();
            onChange(o.value);
          }}
          className={`relative flex-1 rounded-full px-3 py-2 text-sm font-extrabold transition-colors ${value === o.value ? 'text-white' : 'text-home-muted hover:text-home-text'}`}
        >
          {value === o.value && (
            <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-cyan shadow" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
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
  const btn = 'grid size-9 place-items-center rounded-full bg-white text-home-text shadow-sm border border-home-line hover:text-cyan disabled:opacity-30';
  return (
    <div className={`flex items-center gap-1 rounded-full border border-home-line bg-[#e9edf1] p-1 ${disabled ? 'opacity-50' : ''}`}>
      <button type="button" aria-label="Weniger" disabled={disabled || value <= min} onClick={() => {
        ui.tap();
        onChange(Math.max(min, value - step));
      }} className={btn}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-[4.5rem] text-center text-sm font-black tabular-nums">{format ? format(value) : value}</span>
      <button type="button" aria-label="Mehr" disabled={disabled || value >= max} onClick={() => {
        ui.tap();
        onChange(Math.min(max, value + step));
      }} className={btn}>
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
      onClick={() => {
        ui.toggle();
        onClick();
      }}
      aria-pressed={active}
      className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-all disabled:opacity-40 ${
        active ? 'border-cyan bg-cyan text-white shadow' : 'border-home-line bg-white text-home-muted hover:border-cyan/60 hover:text-home-text'
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
        <div className="text-[15px] font-extrabold">{label}</div>
        {hint && <div className="mt-0.5 text-xs font-semibold text-home-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 mt-6 text-xs font-black uppercase tracking-[0.14em] text-cyan-dark first:mt-0">{children}</h3>;
}
