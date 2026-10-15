import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
  className?: string;
  label?: string;
  showPercent?: boolean;
}

const fills: Record<NonNullable<ProgressBarProps['color']>, string> = {
  cyan: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]',
  violet: 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]',
  emerald: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]',
  amber: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]',
  rose: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.6)]',
};

export function ProgressBar({ value, color = 'cyan', className, label, showPercent }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>{label}</span>
          {showPercent && <span>{Math.round(clamped * 100)}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={clsx('h-full rounded-full', fills[color])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
