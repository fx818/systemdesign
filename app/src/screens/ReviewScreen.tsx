import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getLevelMeta } from '@/content/registry';
import { FLASHBACK_SIZE, pickFlashback, todayKey, useGame } from '@/game';
import type { CardState } from '@/game';
import { Button, Card, ProgressBar } from '@/components/ui';

/** `/review` — the daily Flashback: flip a due card, then rate your recall. */
export function ReviewScreen() {
  const reviewCard = useGame((s) => s.reviewCard);
  // Freeze the session: rating a card changes its due date and must not shift
  // the remaining cards or cause the index to skip an unreviewed card.
  const [due] = useState(() => {
    const state = useGame.getState();
    const today = todayKey();
    return pickFlashback(state.cards, today, Math.max(0, FLASHBACK_SIZE - (state.flashbackLog[today] ?? 0)));
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card: CardState | undefined = due[index];

  const rate = (correct: boolean) => {
    if (!card) return;
    reviewCard(card.id, correct);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const done = index >= due.length;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-50">Daily Flashback</h1>
          <p className="text-sm text-slate-400">Five spaced-repetition cards so earlier topics don't fade.</p>
        </div>
        <Link to="/" className="text-xs text-slate-500 hover:text-cyan-300">
          &larr; HQ
        </Link>
      </header>

      {due.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="text-4xl">🌙</div>
          <h2 className="text-lg font-bold text-slate-100">All caught up</h2>
          <p className="max-w-sm text-sm text-slate-400">
            No cards are due today. Finish more levels to grow your deck, or come back tomorrow.
          </p>
        </Card>
      ) : done || !card ? (
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="text-lg font-bold text-slate-100">Flashback complete</h2>
          <p className="text-sm text-slate-400">Your streak stays warm and the deck is shuffled for tomorrow.</p>
          <Link to="/">
            <Button variant="outline">Back to HQ</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                Card {index + 1} / {due.length} · Chapter {getLevelMeta(card.id.split('#')[0])?.chapter ?? 1}
              </span>
              <span className="font-mono">box {card.box} / 5</span>
            </div>
            <ProgressBar value={index / due.length} color="violet" />
          </div>

          {/* flashcard with flip */}
          <button
            onClick={() => setFlipped((f) => !f)}
            className="h-64 w-full [perspective:1200px] focus:outline-none"
            aria-label={flipped ? 'Show question' : 'Show answer'}
          >
            <motion.div
              className="relative h-full w-full [transform-style:preserve-3d]"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <Face className="bg-slate-900 border-cyan-400/30">
                <span className="text-xs font-bold tracking-[0.3em] text-cyan-300 uppercase">Question</span>
                <span className="text-xl font-bold text-slate-100">{card.front}</span>
                <span className="text-xs text-slate-500">tap to flip</span>
              </Face>
              <Face className="bg-slate-900 border-violet-400/30 [transform:rotateY(180deg)]">
                <span className="text-xs font-bold tracking-[0.3em] text-violet-300 uppercase">Answer</span>
                <span className="text-base leading-relaxed text-slate-100">{card.back}</span>
              </Face>
            </motion.div>
          </button>

          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center gap-3"
              >
                <Button variant="danger" onClick={() => rate(false)}>
                  <ArrowLeft size={16} /> I didn't
                </Button>
                <Button variant="emerald" onClick={() => rate(true)}>
                  I knew it <ArrowRight size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <RotateCcw size={13} />
        Correct answers move a card to the next box; wrong ones send it back to box 1.
      </div>
    </div>
  );
}

function Face({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center [backface-visibility:hidden] ${className}`}
    >
      {children}
    </div>
  );
}
