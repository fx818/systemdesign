import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { SESSION_MIN, STEPS } from '../../framework';

export interface Topic { text: string; minutes: number; good: boolean; why: string }
export interface DivePrompt { prompt: string; topics: Topic[] }

export const PROMPTS: DivePrompt[] = [
  {
    prompt: 'Design a URL shortener',
    topics: [
      { text: 'Hash function: long URL → short URL', minutes: 8, good: true, why: 'The interesting part of a URL shortener.' },
      { text: 'Pick the brand colour for the short links', minutes: 3, good: false, why: 'Zero design signal.' },
      { text: 'Design the marketing landing page', minutes: 6, good: false, why: 'Not the system the interviewer asked about.' },
      { text: 'Debate tabs versus spaces', minutes: 3, good: false, why: 'A rabbit hole.' },
    ],
  },
  {
    prompt: 'Design a chat system',
    topics: [
      { text: 'How to reduce message latency', minutes: 7, good: true, why: 'Core to a chat system.' },
      { text: 'Online / offline status', minutes: 6, good: true, why: 'A classic chat deep dive.' },
      { text: 'Emoji picker layout', minutes: 4, good: false, why: 'UI detail, no scalability signal.' },
      { text: 'Chat bubble animations', minutes: 4, good: false, why: 'Minute detail.' },
    ],
  },
  {
    prompt: 'Design a news feed system',
    topics: [
      { text: 'Feed publishing (fan-out to friends)', minutes: 8, good: true, why: 'One of the two key use cases.' },
      { text: 'News feed retrieval', minutes: 8, good: true, why: 'The other key use case.' },
      { text: 'The EdgeRank ranking algorithm in full detail', minutes: 12, good: false, why: 'Eats time, proves little about scalable design.' },
      { text: 'Font for the post timestamps', minutes: 3, good: false, why: 'Irrelevant detail.' },
    ],
  },
];

/** 1 inside the book's range, losing 0.2 per minute outside it. */
export function stepFit(minutes: number, min: number, max: number): number {
  const off = minutes < min ? min - minutes : minutes > max ? minutes - max : 0;
  return Math.max(0, 1 - 0.2 * off);
}
export function allocationScore(plan: number[]): number {
  if (plan.reduce((a, b) => a + b, 0) !== SESSION_MIN) return 0;
  return Math.round((plan.reduce((s, m, i) => s + stepFit(m, STEPS[i].min, STEPS[i].max), 0) / STEPS.length) * 100) / 100;
}
/** Share of good topics picked, minus 0.25 per rabbit hole. */
export function diveScore(p: DivePrompt, picked: number[]): number {
  const good = p.topics.filter((t) => t.good).length;
  const hits = picked.filter((i) => p.topics[i].good).length;
  const holes = picked.length - hits;
  return Math.round(Math.max(0, hits / good - 0.25 * holes) * 100) / 100;
}
export const timeBossScore = (alloc: number, dives: number[]) =>
  Math.round((0.4 * alloc + 0.6 * (dives.reduce((a, b) => a + b, 0) / PROMPTS.length)) * 100) / 100;

type Phase = 'intro' | 'allocate' | 'dive' | 'done';

export default function TimeBoss({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [plan, setPlan] = useState<number[]>([10, 10, 10, 10]);
  const [alloc, setAlloc] = useState(0);
  const [pi, setPi] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [dives, setDives] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);
  const finished = useRef(false);
  const total = plan.reduce((a, b) => a + b, 0);
  const budget = Math.max(5, plan[2]);
  const prompt = PROMPTS[pi];
  const spent = picked.reduce((s, i) => s + prompt.topics[i].minutes, 0);
  const score = timeBossScore(alloc, dives);

  const toggle = (i: number) => {
    if (reveal) return;
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (spent + prompt.topics[i].minutes <= budget) setPicked([...picked, i]);
  };
  const lockDive = () => {
    setDives([...dives, diveScore(prompt, picked)]);
    setReveal(true);
  };
  const nextPrompt = () => {
    setReveal(false);
    setPicked([]);
    if (pi + 1 < PROMPTS.length) setPi(pi + 1);
    else setPhase('done');
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      {phase === 'intro' && (
        <div className="mx-auto max-w-md rounded-2xl border border-amber-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-amber-300">Time Boss</h3>
          <p className="mt-2 text-slate-300">
            Round 1: split a 45-minute interview across the 4 steps. Round 2: spend your deep-dive minutes on the topics that matter for each prompt.
            Rabbit holes cost points.
          </p>
          <button className="mt-5 rounded-2xl bg-amber-400 px-6 py-2 font-bold text-slate-950 hover:bg-amber-300" onClick={() => setPhase('allocate')} autoFocus>
            Start the clock
          </button>
        </div>
      )}

      {phase === 'allocate' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-amber-300">Split your 45 minutes</h3>
            <span className={`rounded-2xl px-3 py-1 font-mono text-sm font-bold ${total === SESSION_MIN ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
              {total} / {SESSION_MIN} min
            </span>
          </div>
          <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-slate-800">
            {plan.map((m, i) => (
              <motion.div key={i} animate={{ width: `${(m / Math.max(total, SESSION_MIN)) * 100}%` }} style={{ background: STEPS[i].color }} />
            ))}
          </div>
          <div className="mt-4 grid gap-4">
            {STEPS.map((s, i) => (
              <label key={s.n} className="grid gap-1">
                <span className="flex justify-between text-sm font-bold">
                  <span style={{ color: s.color }}>{s.n}. {s.title}</span>
                  <span className="font-mono">{plan[i]} min</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={plan[i]}
                  aria-label={`Step ${s.n} minutes`}
                  onChange={(e) => setPlan(plan.map((m, j) => (j === i ? Number(e.target.value) : m)))}
                  className="w-full accent-amber-400"
                />
              </label>
            ))}
          </div>
          <button
            disabled={total !== SESSION_MIN}
            onClick={() => { setAlloc(allocationScore(plan)); setPhase('dive'); }}
            className="mt-5 rounded-2xl bg-amber-400 px-6 py-2 font-bold text-slate-950 disabled:opacity-40"
          >
            Lock in my plan
          </button>
        </div>
      )}

      {phase === 'dive' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          {pi === 0 && !reveal && picked.length === 0 && (
            <div className="mb-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Your plan scored {Math.round(alloc * 100)}% against the book&apos;s guide (3-10 / 10-15 / 10-25 / 3-5 min). You gave the deep dive {plan[2]} minutes.
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-violet-300">Prompt {pi + 1}/{PROMPTS.length}: {prompt.prompt}</h3>
            <span className="rounded-2xl bg-slate-900 px-3 py-1 font-mono text-sm font-bold text-amber-300">{spent} / {budget} min</span>
          </div>
          <div className="mt-3 grid gap-2">
            {prompt.topics.map((tp, i) => {
              const on = picked.includes(i);
              const tone = reveal ? (tp.good ? 'border-emerald-400 bg-emerald-400/10' : on ? 'border-rose-400 bg-rose-400/10' : 'border-slate-800 opacity-60') : on ? 'border-violet-400 bg-violet-400/15' : 'border-slate-700 bg-slate-900';
              return (
                <button key={tp.text} aria-pressed={on} onClick={() => toggle(i)} className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2 text-left text-sm font-semibold ${tone}`}>
                  <span>
                    {tp.text}
                    {reveal && <span className="block text-xs font-normal text-slate-300">{tp.good ? '✓ ' : '✕ '}{tp.why}</span>}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{tp.minutes}m</span>
                </button>
              );
            })}
          </div>
          {!reveal ? (
            <button onClick={lockDive} className="mt-4 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950">Dive!</button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-300">Prompt score {Math.round((dives[dives.length - 1] ?? 0) * 100)}%</span>
              <button onClick={nextPrompt} className="rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950" autoFocus>
                {pi + 1 < PROMPTS.length ? 'Next prompt' : 'See results'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="mx-auto max-w-md rounded-2xl border border-emerald-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-emerald-300">Time Boss: {Math.round(score * 100)}%</h3>
          <p className="mt-2 text-slate-300">Clarify 3-10, blueprint 10-15, deep dive 10-25, wrap up 3-5. And spend the deep dive on what shows design skill.</p>
          <button className="mt-5 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
            Finish
          </button>
        </div>
      )}
    </div>
  );
}
