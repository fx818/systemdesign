/**
 * Post-submit feedback: correct = glow + pop, wrong = shake; always shows the
 * explanation, the "Book p. N" reference, earned XP and the Continue button.
 */
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export interface FeedbackProps {
  correct: boolean;
  explanation: string;
  page?: number;
  /** what the right answer was (shown when incorrect) */
  correctLine?: string;
  xpEarned?: number;
  onContinue: () => void;
}

export function Feedback({ correct, explanation, page, correctLine, xpEarned, onContinue }: FeedbackProps) {
  return (
    <motion.div
      initial={correct ? { scale: 0.96, opacity: 0 } : { x: 0 }}
      animate={
        correct
          ? {
              scale: 1,
              opacity: 1,
              boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 30px rgba(52,211,153,0.35)', '0 0 18px rgba(52,211,153,0.15)'],
            }
          : { x: [0, -10, 10, -7, 7, -4, 4, 0] }
      }
      transition={correct ? { duration: 0.45 } : { duration: 0.5 }}
      className={clsx(
        'mt-4 rounded-2xl border-2 p-4',
        correct ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-rose-400/70 bg-rose-400/10',
      )}
      role="status"
      data-testid="feedback"
    >
      <div className="flex items-center gap-2.5">
        {correct ? (
          <CheckCircle2 size={26} className="shrink-0 text-emerald-300" />
        ) : (
          <XCircle size={26} className="shrink-0 text-rose-300" />
        )}
        <span
          className={clsx(
            'text-lg font-black',
            correct ? 'text-emerald-200' : 'text-rose-200',
          )}
        >
          {correct ? 'Correct!' : 'Not quite'}
        </span>
        {correct && xpEarned != null && xpEarned > 0 && (
          <span className="ml-auto flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-xs font-black text-amber-300 tabular-nums">
            <Sparkles size={13} /> +{xpEarned} XP
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">{explanation}</p>

      {correctLine && !correct && (
        <p className="mt-2 text-sm text-rose-200/90">
          <span className="font-bold">Correct answer: </span>
          {correctLine}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold text-slate-400">
          <BookOpen size={13} />
          {page != null ? `Book p. ${page}` : 'From the chapter'}
        </span>
        <Button
          variant={correct ? 'emerald' : 'outline'}
          onClick={onContinue}
          data-testid="continue"
          className="min-w-32"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
