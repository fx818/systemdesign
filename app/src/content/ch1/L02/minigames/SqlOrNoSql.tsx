import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { FEATURES, type FeatureCard, type Store } from '../data';

const FAMILIES = ['Key-value', 'Graph', 'Column', 'Document'] as const;
type Family = (typeof FAMILIES)[number];
const SWIPE = 110;

interface Answer {
  id: string;
  pick: Store;
  correct: boolean;
  family?: Family;
  familyCorrect?: boolean;
}

/** Final 0..1 score: 1 point per correct bin, +0.5 per correct NoSQL family. */
export function sqlNoSqlScore(cards: FeatureCard[], answers: Answer[]): number {
  const max = cards.length + 0.5 * cards.filter((c) => c.answer === 'nosql').length;
  const got = answers.reduce((s, a) => s + (a.correct ? 1 : 0) + (a.familyCorrect ? 0.5 : 0), 0);
  return max ? Math.round((got / max) * 100) / 100 : 0;
}

type Stage = 'intro' | 'swipe' | 'family' | 'feedback' | 'done';

function SwipeCard({ card, onPick, disabled }: { card: FeatureCard; onPick: (s: Store) => void; disabled: boolean }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const sqlGlow = useTransform(x, [-SWIPE, 0], [1, 0]);
  const noGlow = useTransform(x, [0, SWIPE], [0, 1]);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE) onPick('sql');
    else if (info.offset.x > SWIPE) onPick('nosql');
  };
  return (
    <motion.div
      key={card.id}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      style={{ x, rotate }}
      initial={{ scale: 0.8, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      whileTap={{ scale: 1.03 }}
      className="relative mx-auto w-full max-w-sm cursor-grab touch-none rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:cursor-grabbing"
    >
      <motion.div style={{ opacity: sqlGlow }} className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-emerald-400" />
      <motion.div style={{ opacity: noGlow }} className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-orange-400" />
      <div className="text-xs font-bold uppercase tracking-widest text-violet-300">PixelPost feature</div>
      <h3 className="mt-2 text-2xl font-black text-white">{card.feature}</h3>
      <p className="mt-3 text-slate-300">{card.detail}</p>
      <div className="mt-6 flex justify-between text-xs font-bold text-slate-500">
        <span>← SQL</span>
        <span>drag me</span>
        <span>NoSQL →</span>
      </div>
    </motion.div>
  );
}

export default function SqlOrNoSql({ onComplete }: MiniGameProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const finished = useRef(false);
  const card = FEATURES[idx];
  const current = answers[answers.length - 1];
  const score = sqlNoSqlScore(FEATURES, answers);

  const pick = useCallback(
    (s: Store) => {
      if (stage !== 'swipe') return;
      const correct = s === card.answer;
      setAnswers((a) => [...a, { id: card.id, pick: s, correct }]);
      const n = correct ? combo + 1 : 0;
      setCombo(n);
      setBestCombo((best) => Math.max(best, n));
      setStage(correct && card.answer === 'nosql' ? 'family' : 'feedback');
    },
    [stage, card, combo],
  );

  const pickFamily = (f: Family) => {
    setAnswers((a) => {
      const copy = [...a];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, family: f, familyCorrect: f === card.family };
      return copy;
    });
    setStage('feedback');
  };

  const next = useCallback(() => {
    if (idx + 1 < FEATURES.length) {
      setIdx(idx + 1);
      setStage('swipe');
    } else setStage('done');
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === 'swipe' && e.key === 'ArrowLeft') pick('sql');
      else if (stage === 'swipe' && e.key === 'ArrowRight') pick('nosql');
      else if (stage === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, pick, next]);

  const restart = () => {
    setIdx(0);
    setAnswers([]);
    setCombo(0);
    setBestCombo(0);
    setStage('swipe');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  const sqlCount = answers.filter((a) => a.pick === 'sql').length;
  const noCount = answers.filter((a) => a.pick === 'nosql').length;

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      {/* HUD */}
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">
          Card {Math.min(idx + 1, FEATURES.length)}/{FEATURES.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-cyan-400" animate={{ width: `${(answers.length / FEATURES.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={combo}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl px-3 py-2 text-sm font-black ${combo >= 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300'}`}
          >
            🔥 x{combo}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative grid min-h-[420px] grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_0_40px_rgba(167,139,250,0.12)]">
        {/* SQL bin */}
        <button
          onClick={() => pick('sql')}
          disabled={stage !== 'swipe'}
          className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-400/5 p-3 text-center transition hover:bg-emerald-400/15 disabled:opacity-60"
        >
          <span className="text-3xl">🗄️</span>
          <span className="mt-1 text-lg font-black text-emerald-300">SQL</span>
          <span className="text-xs text-slate-400">tables · joins</span>
          <span className="mt-2 rounded-full bg-emerald-400/20 px-2 text-sm font-bold text-emerald-200">{sqlCount}</span>
        </button>

        {/* center */}
        <div className="relative flex min-h-[380px] items-center justify-center">
          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-sm text-center">
                <h3 className="text-3xl font-black text-cyan-300">SQL or NoSQL?</h3>
                <p className="mt-3 text-slate-300">
                  Ravi hands you PixelPost's features. Swipe each card <b className="text-emerald-300">left for SQL</b> or{' '}
                  <b className="text-orange-300">right for NoSQL</b> (arrow keys or the bins work too). Nail a NoSQL card and you get a bonus: name its family.
                </p>
                <button className="mt-6 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={() => setStage('swipe')} autoFocus>
                  Deal the cards
                </button>
              </motion.div>
            )}
            {stage === 'swipe' && <SwipeCard key={card.id} card={card} onPick={pick} disabled={false} />}
            {stage === 'family' && (
              <motion.div key="family" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm text-center">
                <div className="text-sm font-bold text-emerald-300">✓ NoSQL, correct!</div>
                <h3 className="mt-1 text-xl font-black">Bonus: which NoSQL family fits "{card.feature}"?</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {FAMILIES.map((f) => (
                    <button key={f} onClick={() => pickFamily(f)} className="rounded-2xl border border-orange-400/50 bg-orange-400/10 px-3 py-3 font-bold text-orange-200 hover:bg-orange-400/25">
                      {f}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {stage === 'feedback' && current && (
              <motion.div
                key={`fb-${card.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, x: current.correct ? 0 : [0, -10, 10, -6, 6, 0] }}
                exit={{ opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl border-2 p-5 ${current.correct ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}
              >
                <div className={`text-2xl font-black ${current.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {current.correct ? (combo >= 3 ? `Combo x${combo}!` : 'Correct!') : `Not quite: ${card.answer === 'sql' ? 'SQL' : 'NoSQL'}`}
                </div>
                <div className="mt-1 font-bold text-white">{card.feature}</div>
                {card.family && (
                  <div className="mt-2 inline-block rounded-full bg-orange-400/20 px-3 py-1 text-xs font-bold text-orange-200">
                    {card.family} store
                    {current.family && (current.familyCorrect ? ' · bonus +½ ✓' : ` · you said ${current.family}`)}
                  </div>
                )}
                <p className="mt-3 text-sm text-slate-200">{card.why}</p>
                <button className="mt-4 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950 hover:bg-white" onClick={next} autoFocus>
                  {idx + 1 < FEATURES.length ? 'Next card' : 'See results'}
                </button>
              </motion.div>
            )}
            {stage === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
                <h3 className="text-2xl font-black text-amber-300">Data Whisperer report</h3>
                <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="mt-1 text-6xl font-black text-white">
                  {Math.round(score * 100)}%
                </motion.p>
                <p className="mt-1 text-sm text-slate-400">
                  {answers.filter((a) => a.correct).length}/{FEATURES.length} sorted · best combo x{bestCombo}
                </p>
                <ul className="mt-3 max-h-36 space-y-1 overflow-auto text-left text-sm">
                  {answers
                    .filter((a) => !a.correct)
                    .map((a) => {
                      const f = FEATURES.find((x) => x.id === a.id);
                      return f ? (
                        <li key={a.id} className="rounded-xl bg-rose-400/10 px-3 py-1 text-rose-200">
                          {f.feature} → {f.answer === 'sql' ? 'SQL' : 'NoSQL'}
                        </li>
                      ) : null;
                    })}
                </ul>
                <p className="mt-3 text-xs text-slate-400">Rule of thumb: relational by default; NoSQL for super-low latency, unstructured data, plain serialization, or massive scale.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={restart}>
                    Play again
                  </button>
                  <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                    Finish
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NoSQL bin */}
        <button
          onClick={() => pick('nosql')}
          disabled={stage !== 'swipe'}
          className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-400/50 bg-orange-400/5 p-3 text-center transition hover:bg-orange-400/15 disabled:opacity-60"
        >
          <span className="text-3xl">🧩</span>
          <span className="mt-1 text-lg font-black text-orange-300">NoSQL</span>
          <span className="text-xs text-slate-400">key-value · graph · column · document</span>
          <span className="mt-2 rounded-full bg-orange-400/20 px-2 text-sm font-bold text-orange-200">{noCount}</span>
        </button>
      </div>
    </div>
  );
}
