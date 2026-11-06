import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

type Tone = 'yellow' | 'white' | 'red' | 'blue' | 'green';
const TONES: Record<Tone, string> = {
  yellow: 'bg-pop-yellow',
  white: 'bg-white',
  red: 'bg-pop-red text-white',
  blue: 'bg-pop-blue text-white',
  green: 'bg-pop-green',
};

export interface ComicButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  active?: boolean;
  children?: ReactNode;
}

/** Comic-Button: dicke Kontur, harter Schatten, „drückt“ sich beim Tippen ein. */
export const ComicButton = forwardRef<HTMLButtonElement, ComicButtonProps>(function ComicButton(
  { tone = 'yellow', size = 'md', icon, loading, active, children, className = '', disabled, ...rest },
  ref,
) {
  const sizes = { sm: 'h-10 px-3 text-lg gap-1.5', md: 'h-13 px-5 text-2xl gap-2', lg: 'h-16 px-8 text-3xl gap-3' }[size];
  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileTap={disabled ? undefined : { x: 3, y: 3, boxShadow: '0px 0px 0 #161616' }}
      className={`font-bangers inline-flex select-none items-center justify-center rounded-[14px] border-[3px] border-ink text-ink shadow-[4px_4px_0_#161616] transition-colors disabled:opacity-40 ${TONES[tone]} ${active ? 'translate-x-[2px] translate-y-[2px] !shadow-[2px_2px_0_#161616] ring-4 ring-pop-yellow' : ''} ${sizes} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="size-6 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
});
