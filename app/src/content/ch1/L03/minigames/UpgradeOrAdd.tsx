import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { SCENARIOS, type ScenarioCard, type Strategy } from '../data';

/** Seconds per card. */
export const CARD_TIME = 8;

interface Answer { id: string; pick: Strategy | null; correct: boolean; timeLeft: number }

/** 0..1 score: 1 point per correct card, plus up to 0.25 bonus for speed, normalised. */
export function upgradeOrAddScore(cards: ScenarioCard[], answers: Answer[]): number {
  if (!cards.length) return 0;
  const got = answers.reduce((s, a) => s + (a.correct ? 1 + 0.25 * Math.min(1, a.timeLeft / (CARD_TIME * 0.5)) : 0), 0);
  return Math.round((got / (cards.length * 1.25)) * 100) / 100;
}

type Phase = 'intro' | 'play' | 'feedback' | 'done';
const LABEL: Record<Strategy, string> = { up: 'Scale Up', out: 'Scale Out' };

export default function UpgradeOrAdd({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [left, setLeft] = useState(CARD_TIME);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const finished = useRef(false);
  const card = SCENARIOS[idx];
  const last = answers[answers.length - 1];
  const score = upgradeOrAddScore(SCENARIOS, answers);

  const answer = useCallback(
    (pick: Strategy | null) => {
      if (phase !== 'play') return;
      const correct = pick === card.answer;
      setAnswers((a) => [...a, { id: card.id, pick, correct, timeLeft: left }]);
      const n = correct ? streak + 1 : 0;
      setStreak(n);
      setBest((b) => Math.max(b, n));
      setPhase('feedback');
    },
    [phase, card, left, streak],
  );

  const next = useCallback(() => {
    if (idx + 1 < SCENARIOS.length) {
      setIdx(idx + 1);
      setLeft(CARD_TIME);
      setPhase('play');
    } else setPhase('done');
  }, [idx]);

  // countdown
  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, Math.round((l - 0.1) * 10) / 10)), 100);
    return () => window.clearInterval(id);
  }, [phase, idx]);
  useEffect(() => {
    if (phase === 'play' && left <= 0) answer(null);
  }, [left, phase, answer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'play' && e.key === 'ArrowLeft') answer('up');
      else if (phase === 'play' && e.key === 'ArrowRight') answer('out');
      else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer, next]);

  const restart = () => {
    setIdx(0);
    setAnswers([]);
    setStreak(0);
    setBest(0);
    setLeft(CARD_TIME);
    setPhase('play');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  const pct = left / CARD_TIME;
  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">
          Card {Math.min(idx + 1, SCENARIOS.length)}/{SCENARIOS.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-cyan-400" animate={{ width: `${(answers.length / SCENARIOS.length) * 100}%` }} />
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div key={streak} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl px-3 py-2 text-sm font-black ${streak >= 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300'}`}>
            🔥 x{streak}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative min-h-[400px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md text-center">
              <h3 className="text-3xl font-black text-cyan-300">Upgrade or Add?</h3>
              <p className="mt-3 text-slate-300">
                Eight situations, {CARD_TIME} seconds each. Decide: <b className="text-cyan-300">Scale Up</b> (a bigger server, ←) or{' '}
                <b className="text-violet-300">Scale Out</b> (more servers, →). Fast right answers earn bonus points.
              </p>
              <button className="mt-6 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={() => setPhase('play')} autoFocus>
                Start the clock
              </button>
            </motion.div>
          )}

          {phase === 'play' && (
            <motion.div key={`card-${card.id}`} initial={{ opacity: 0, scale: 0.85, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} className="mx-auto max-w-lg">
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full transition-[width] duration-100 ${pct > 0.5 ? 'bg-emerald-400' : pct > 0.25 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${pct * 100}%` }} />
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="text-xs font-bold uppercase tracking-widest text-violet-300">Situation</div>
                <h3 className="mt-2 text-2xl font-black text-white">{card.title}</h3>
                <p className="mt-3 text-slate-300">{card.detail}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => answer('up')}
                  className="rounded-2xl border-2 border-cyan-400/60 bg-cyan-400/10 px-4 py-4 text-left hover:bg-cyan-400/20">
                  <div className="text-lg font-black text-cyan-300">⬆ Scale Up</div>
                  <div className="text-xs text-slate-400">bigger CPU / RAM · ←</div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => answer('out')}
                  className="rounded-2xl border-2 border-violet-400/60 bg-violet-400/10 px-4 py-4 text-right hover:bg-violet-400/20">
                  <div className="text-lg font-black text-violet-300">Scale Out ➜</div>
                  <div className="text-xs text-slate-400">more servers · →</div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'feedback' && last && (
            <motion.div key={`fb-${card.id}`} initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, x: last.correct ? 0 : [0, -10, 10, -6, 6, 0] }} exit={{ opacity: 0 }}
              className={`mx-auto max-w-lg rounded-2xl border-2 p-6 ${last.correct ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
              <div className={`text-2xl font-black ${last.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                {last.correct ? (streak >= 3 ? `Streak x${streak}!` : 'Correct!') : last.pick === null ? `Time's up: ${LABEL[card.answer]}` : `Nope: ${LABEL[card.answer]}`}
              </div>
              <div className="mt-1 font-bold text-white">{card.title}</div>
              <p className="mt-3 text-sm text-slate-200">{card.why}</p>
              <button className="mt-4 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950 hover:bg-white" onClick={next} autoFocus>
                {idx + 1 < SCENARIOS.length ? 'Next situation' : 'See results'}
              </button>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
              <h3 className="text-2xl font-black text-amber-300">Scale Thinker report</h3>
              <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="mt-1 text-6xl font-black text-white">
                {Math.round(score * 100)}%
              </motion.p>
              <p className="mt-1 text-sm text-slate-400">
                {answers.filter((a) => a.correct).length}/{SCENARIOS.length} right · best streak x{best}
              </p>
              <p className="mt-3 text-xs text-slate-400">Scale up while traffic is low and simplicity matters. Scale out when you need redundancy or you hit the hardware ceiling.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={restart}>Play again</button>
                <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>Finish</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
