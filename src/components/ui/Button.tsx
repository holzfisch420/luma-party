import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

/** Launcher-Buttons im hellen Home-Menü-Stil (Spiele nutzen ComicButton). */
const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-b from-[#3ccbe8] to-[#16a6c8] border border-[#1192b3] shadow-[0_4px_0_#0f86a4,0_8px_16px_-6px_rgba(17,146,179,0.6)] hover:brightness-105',
  secondary:
    'text-home-text bg-gradient-to-b from-white to-[#eef1f4] border border-home-line shadow-[0_3px_0_#c9cfd6,0_6px_12px_-6px_rgba(60,70,85,0.35)] hover:to-white',
  ghost: 'text-home-muted hover:bg-black/5 hover:text-home-text',
  danger: 'text-white bg-gradient-to-b from-[#ff7a7a] to-[#e64646] border border-[#cc3a3a] shadow-[0_3px_0_#b83232]',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-full',
  lg: 'h-14 px-7 text-lg gap-2.5 rounded-full',
  xl: 'h-16 px-10 text-xl gap-3 rounded-full',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading, children, className = '', disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.95, y: 2 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center font-extrabold transition-[filter,background] duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
});

export function IconButton({ label, className = '', ...rest }: ButtonProps & { label: string }) {
  return <Button aria-label={label} title={label} className={`!px-0 aspect-square ${className}`} {...rest} />;
}
