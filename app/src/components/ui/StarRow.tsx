import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export interface StarRowProps {
  /** 0..3 (any extra stars are clamped by slicing). */
  value: number;
  max?: number;
  size?: number;
  /** Animate stars popping in one by one (e.g. on the debrief screen). */
  animate?: boolean;
  className?: string;
}

export function StarRow({ value, max = 3, size = 20, animate = false, className }: StarRowProps) {
  return (
    <div className={clsx('flex items-center gap-1', className)} aria-label={`${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const star = (
          <Star
            size={size}
            className={
              filled
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                : 'fill-slate-800 text-slate-600'
            }
          />
        );
        return animate ? (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25 + i * 0.25, type: 'spring', stiffness: 300, damping: 14 }}
          >
            {star}
          </motion.span>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </div>
  );
}
