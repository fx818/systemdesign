import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'violet' | 'emerald' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] font-semibold',
  violet:
    'bg-violet-400 text-slate-950 hover:bg-violet-300 shadow-[0_0_20px_rgba(167,139,250,0.35)] font-semibold',
  emerald:
    'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.35)] font-semibold',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-slate-100',
  outline:
    'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300',
  danger:
    'bg-rose-500/90 text-slate-950 hover:bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.35)] font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={clsx(
        'inline-flex select-none items-center justify-center transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
