import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

export interface BadgeChipProps {
  name: string;
  icon: string;
  description?: string;
  /** When earned (epoch ms). Undefined/null => locked. */
  earnedAt?: number | null;
  size?: 'sm' | 'lg';
}

const palette = ['cyan', 'violet', 'emerald', 'amber', 'rose'] as const;

export function BadgeChip({ name, icon, description, earnedAt, size = 'sm' }: BadgeChipProps) {
  const earned = earnedAt != null;
  const color = palette[name.length % palette.length];
  const ring = earned
    ? {
        cyan: 'border-cyan-400/60 text-cyan-300 bg-cyan-400/10',
        violet: 'border-violet-400/60 text-violet-300 bg-violet-400/10',
        emerald: 'border-emerald-400/60 text-emerald-300 bg-emerald-400/10',
        amber: 'border-amber-400/60 text-amber-300 bg-amber-400/10',
        rose: 'border-rose-400/60 text-rose-300 bg-rose-400/10',
      }[color]
    : 'border-slate-700 text-slate-600 bg-slate-800/40 grayscale';

  const dim = size === 'lg' ? 'h-16 w-16' : 'h-11 w-11';
  const iconSize = size === 'lg' ? 30 : 20;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-1.5 text-center"
      title={description}
    >
      <div className={clsx('flex items-center justify-center rounded-full border-2', dim, ring)}>
        <Icon name={icon} size={iconSize} />
      </div>
      <div>
        <div className={clsx('font-semibold', size === 'lg' ? 'text-sm' : 'text-[11px]', earned ? 'text-slate-200' : 'text-slate-500')}>
          {name}
        </div>
        {size === 'lg' && description && (
          <div className="mt-0.5 max-w-40 text-xs text-slate-500">{description}</div>
        )}
        {earned && size === 'lg' && (
          <div className="mt-0.5 text-[10px] text-slate-500">Earned {new Date(earnedAt).toLocaleDateString()}</div>
        )}
      </div>
    </motion.div>
  );
}
