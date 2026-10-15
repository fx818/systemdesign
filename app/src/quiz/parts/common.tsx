/**
 * Shared bits for the per-kind answer components: the big tappable option
 * button used by mcq/multi/truefalse-style lists.
 */
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export type Reveal = 'none' | 'correct' | 'wrong' | 'missed';

export interface OptionButtonProps {
  /** 0-based index; shown as a "1".."n" keyboard hint */
  index: number;
  text: string;
  selected: boolean;
  /** post-submit coloring; 'missed' = should have been picked */
  reveal?: Reveal;
  /** square checkbox look (multi) vs round radio look */
  multi?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function OptionButton({
  index,
  text,
  selected,
  reveal = 'none',
  multi = false,
  disabled = false,
  onClick,
}: OptionButtonProps) {
  const revealed = reveal !== 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-pressed={selected}
      data-testid={`option-${index}`}
      className={clsx(
        'flex min-h-14 w-full items-center gap-3 rounded-xl border-2 bg-slate-900/70 px-4 py-3 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        !revealed && !selected && 'border-slate-700 text-slate-200 hover:border-cyan-400/60 hover:bg-slate-800/60',
        !revealed && selected && 'border-cyan-400 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.3)]',
        reveal === 'correct' && 'border-emerald-400 bg-emerald-400/15 text-emerald-100',
        reveal === 'missed' && 'border-dashed border-emerald-400/70 bg-emerald-400/5 text-emerald-200',
        reveal === 'wrong' && 'border-rose-400 bg-rose-400/15 text-rose-100',
        (disabled || !onClick) && 'cursor-default',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'flex h-6 w-6 shrink-0 items-center justify-center border-2 text-xs font-black',
          multi ? 'rounded-md' : 'rounded-full',
          selected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-600 text-transparent',
          reveal === 'correct' && 'border-emerald-400 bg-emerald-400 text-slate-950',
          reveal === 'wrong' && 'border-rose-400 bg-rose-400 text-slate-950',
        )}
      >
        {selected || reveal === 'correct' ? <Check size={14} strokeWidth={3.5} /> : null}
      </span>
      <span className="flex-1 text-sm font-semibold sm:text-base">{text}</span>
      {!revealed && (
        <kbd
          aria-hidden="true"
          className={clsx(
            'hidden rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 sm:inline-block',
          )}
        >
          {index + 1}
        </kbd>
      )}
    </button>
  );
}
