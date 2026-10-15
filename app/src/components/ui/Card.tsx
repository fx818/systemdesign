import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Neon accent colour for the top edge / hover glow. */
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'none';
  padded?: boolean;
  children: ReactNode;
}

const accents: Record<NonNullable<CardProps['accent']>, string> = {
  cyan: 'border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-[0_0_28px_rgba(34,211,238,0.15)]',
  violet: 'border-violet-400/30 hover:border-violet-400/60 hover:shadow-[0_0_28px_rgba(167,139,250,0.15)]',
  emerald: 'border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-[0_0_28px_rgba(52,211,153,0.15)]',
  amber: 'border-amber-400/30 hover:border-amber-400/60 hover:shadow-[0_0_28px_rgba(251,191,36,0.15)]',
  rose: 'border-rose-400/30 hover:border-rose-400/60 hover:shadow-[0_0_28px_rgba(251,113,133,0.15)]',
  none: 'border-slate-800',
};

export function Card({ accent = 'none', padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border bg-slate-900/70 backdrop-blur transition-shadow',
        accents[accent],
        padded && 'p-4 sm:p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
