import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { hash } from '@/scenekit';

export interface HabitCard { text: string; isDo: boolean; why: string }

/** Behaviours drawn from the book's dos and don'ts and wrap-up advice (pp. 48-49), in our own words. */
export const DECK: HabitCard[] = [
  { text: 'Ask for clarification instead of trusting your own assumption', isDo: true, why: 'Do not assume your assumption is correct.' },
  { text: 'Make sure you understand the requirements', isDo: true, why: 'A startup and an established company need different designs.' },
  { text: 'Tell the interviewer what you are thinking', isDo: true, why: 'Communicate. The interviewer can only grade what they hear.' },
  { text: 'Suggest multiple approaches', isDo: true, why: 'Options show you understand trade-offs.' },
  { text: 'Agree on the blueprint, then design the most critical components first', isDo: true, why: 'High level first, then the parts that matter most.' },
  { text: 'Bounce ideas off the interviewer', isDo: true, why: 'A good interviewer works with you as a teammate.' },
  { text: 'Keep going when the problem gets hard', isDo: true, why: 'Never give up.' },
  { text: 'Ask for a hint when you are stuck', isDo: true, why: 'Don\'t hesitate to ask for hints.' },
  { text: 'Ask for feedback early and often', isDo: true, why: 'You are not done until the interviewer says so.' },
  { text: 'Name the bottlenecks and how you would improve them', isDo: true, why: 'There is always something to improve.' },
  { text: 'Walk in unprepared for typical interview questions', isDo: false, why: 'Prepare for the common prompts.' },
  { text: 'Jump into a solution before clarifying requirements', isDo: false, why: 'Clarify requirements and assumptions first.' },
  { text: 'Describe one component in great detail before any high-level design', isDo: false, why: 'Give the high-level design first, then drill down.' },
  { text: 'Think in silence for minutes at a time', isDo: false, why: 'Communicate. Silence gives the interviewer no signal.' },
  { text: 'Announce you are finished right after presenting the design', isDo: false, why: 'You are not done until the interviewer says you are done.' },
  { text: 'Tell the interviewer the design is perfect', isDo: false, why: 'Never say that: there is always something to improve.' },
  { text: 'Add components nobody asked for, for design purity', isDo: false, why: 'Over-engineering is a red flag.' },
  { text: 'Refuse to change your design after feedback', isDo: false, why: 'Stubbornness is a red flag.' },
];

export const CARD_SEC = 7;

/** Fixed, deterministic order so every player sees the same run. */
export const ORDER = DECK.map((c, i) => ({ c, k: hash(i * 17 + 5) })).sort((a, b) => a.k - b.k).map((x) => x.c);

export const doOrDontScore = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) / 100 : 0);

type Phase = 'intro' | 'play' | 'feedback' | 'done';

export default function DoOrDont({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [last, setLast] = useState<{ ok: boolean; timeout: boolean } | null>(null);
  const finished = useRef(false);
  const card = ORDER[idx];

  const answer = useCallback(
    (isDo: boolean | null) => {
      if (phase !== 'play') return;
      const ok = isDo === card.isDo;
      if (ok) {
        setCorrect((c) => c + 1);
        setCombo((c) => {
          setBest((b) => Math.max(b, c + 1));
          return c + 1;
        });
      } else setCombo(0);
      setLast({ ok, timeout: isDo === null });
      setPhase('feedback');
    },
    [phase, card],
  );

  const next = useCallback(() => {
    if (idx + 1 < ORDER.length) {
      setIdx(idx + 1);
      setPhase('play');
    } else setPhase('done');
  }, [idx]);

  // per-card countdown: running out of time counts as a miss
  useEffect(() => {
    if (phase !== 'play') return;
    const id = setTimeout(() => answer(null), CARD_SEC * 1000);
    return () => clearTimeout(id);
  }, [phase, idx, answer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'play' && e.key === 'ArrowLeft') answer(true);
      else if (phase === 'play' && e.key === 'ArrowRight') answer(false);
      else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer, next]);

  const score = doOrDontScore(correct, ORDER.length);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };
  const restart = () => {
    setIdx(0);
    setCorrect(0);
    setCombo(0);
    setBest(0);
    setLast(null);
    setPhase('play');
  };

  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-emerald-300">Card {Math.min(idx + 1, ORDER.length)}/{ORDER.length}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-emerald-400" animate={{ width: `${((idx + (phase === 'feedback' || phase === 'done' ? 1 : 0)) / ORDER.length) * 100}%` }} />
        </div>
        <div className={`rounded-2xl px-3 py-2 text-sm font-black ${combo >= 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-amber-300'}`}>🔥 x{combo}</div>
      </div>

      <div className="relative grid min-h-[340px] grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <button onClick={() => answer(true)} disabled={phase !== 'play'}
          className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-400/5 p-3 text-center hover:bg-emerald-400/15 disabled:opacity-60">
          <span className="text-3xl">👍</span>
          <span className="mt-1 text-lg font-black text-emerald-300">Do</span>
          <span className="text-xs text-slate-400">← arrow</span>
        </button>

        <div className="relative flex min-h-[300px] items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <h3 className="text-3xl font-black text-emerald-300">Do or Don&apos;t?</h3>
                <p className="mt-3 text-slate-300">{ORDER.length} interview habits, {CARD_SEC} seconds each. Sort them fast: left for Do, right for Don&apos;t.</p>
                <button className="mt-5 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={() => setPhase('play')} autoFocus>
                  Deal
                </button>
              </motion.div>
            )}
            {phase === 'play' && (
              <motion.div key={`c-${idx}`} initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="text-xs font-bold uppercase tracking-widest text-violet-300">In the interview, you...</div>
                <h3 className="mt-2 text-xl font-black text-white">{card.text}</h3>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <motion.div key={`t-${idx}`} className="h-full bg-amber-400" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: CARD_SEC, ease: 'linear' }} />
                </div>
              </motion.div>
            )}
            {phase === 'feedback' && last && (
              <motion.div key={`f-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl border-2 p-5 ${last.ok ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
                <div className={`text-2xl font-black ${last.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {last.ok ? (combo >= 3 ? `Combo x${combo}!` : 'Correct!') : last.timeout ? 'Too slow!' : 'Nope!'} It&apos;s a {card.isDo ? 'Do' : 'Don\'t'}.
                </div>
                <p className="mt-2 text-sm text-slate-200">{card.why}</p>
                <button className="mt-4 rounded-2xl bg-slate-100 px-5 py-2 font-bold text-slate-950" onClick={next} autoFocus>
                  {idx + 1 < ORDER.length ? 'Next card' : 'See results'}
                </button>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <h3 className="text-2xl font-black text-amber-300">{correct}/{ORDER.length} sorted</h3>
                <p className="mt-1 text-5xl font-black text-white">{Math.round(score * 100)}%</p>
                <p className="mt-2 text-slate-300">Best combo x{best}.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold" onClick={restart}>Play again</button>
                  <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => answer(false)} disabled={phase !== 'play'}
          className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-400/50 bg-rose-400/5 p-3 text-center hover:bg-rose-400/15 disabled:opacity-60">
          <span className="text-3xl">👎</span>
          <span className="mt-1 text-lg font-black text-rose-300">Don&apos;t</span>
          <span className="text-xs text-slate-400">arrow →</span>
        </button>
      </div>
    </div>
  );
}
