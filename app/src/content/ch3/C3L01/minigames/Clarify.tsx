import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { hash } from '@/scenekit';
import { NEWS_FEED_QA } from '../../framework';
import { REQUIREMENT_NOTES } from '../data';

export interface Req { key: string; q: string; a: string; note: string; assume?: boolean }
export interface ClarifyRound {
  prompt: string;
  turns: number;
  reqs: Req[];
  /** Premature solutions: a red flag. */
  premature: string[];
  /** Irrelevant details: a wasted turn. */
  filler: string[];
}

export const ROUNDS: ClarifyRound[] = [
  {
    prompt: 'Design a news feed system.',
    turns: 8,
    reqs: NEWS_FEED_QA.map((qa) => ({ ...qa, note: REQUIREMENT_NOTES[qa.key] })),
    premature: [
      'I\'ll shard the posts table by user_id across 64 databases.',
      'Let\'s use Kafka for everything, then figure out the rest.',
      'I\'ll start with the EdgeRank ranking formula in detail.',
      'Obviously we need a cache cluster in every region.',
      'I\'ll draw the final architecture now; we can confirm details later.',
    ],
    filler: [
      'What colour is the "post" button?',
      'Which font does the app use?',
      'Do you prefer tabs or spaces?',
      'Is the office dog friendly?',
    ],
  },
  {
    prompt: 'Design a photo-sharing app.',
    turns: 6,
    reqs: [
      { key: 'features', q: 'What specific features are we going to build?', a: 'Upload photos, follow people, and a home feed.', note: 'Upload, follow, feed' },
      { key: 'users', q: 'How many users does the product have?', a: 'About 1 million users today.', note: '1M users today' },
      { key: 'growth', q: 'How fast do we expect to scale in 3 months, 6 months and a year?', a: 'Roughly 10x within a year.', note: '10x in 12 months' },
      { key: 'stack', q: 'What is the tech stack? Are there existing services we can reuse?', a: 'You decide. Make an assumption.', note: 'Assume: reuse existing login service', assume: true },
    ],
    premature: [
      'I\'ll put every photo in a NoSQL graph database.',
      'Step one: a CDN with 200 edge locations.',
      'I\'ll design the image-compression algorithm first.',
    ],
    filler: [
      'Can photos have rounded corners?',
      'What is the app\'s logo?',
      'Will there be a dark mode?',
    ],
  },
];

export type OptionKind = 'good' | 'premature' | 'filler';
export interface TurnOption { kind: OptionKind; text: string; key?: string }

/** Deterministic options for a turn: one useful question, one premature solution, one filler, shuffled. */
export function turnOptions(round: ClarifyRound, found: string[], turn: number, roundIndex = 0): TurnOption[] {
  const open = round.reqs.filter((r) => !found.includes(r.key));
  const opts: TurnOption[] = [];
  if (open.length) {
    const r = open[Math.floor(hash(turn * 7 + roundIndex * 31) * open.length)];
    opts.push({ kind: 'good', text: r.q, key: r.key });
  }
  opts.push({ kind: 'premature', text: round.premature[(turn + roundIndex) % round.premature.length] });
  opts.push({ kind: 'filler', text: round.filler[(turn * 3 + roundIndex) % round.filler.length] });
  return opts
    .map((o, i) => ({ o, k: hash(turn * 13 + i * 5 + roundIndex * 101) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.o);
}

/** Round score 0..1: share of requirements written down, minus 0.15 per red flag. */
export function clarifyScore(found: number, total: number, redFlags: number): number {
  if (!total) return 0;
  return Math.round(Math.max(0, Math.min(1, found / total - 0.15 * redFlags)) * 100) / 100;
}

interface Msg { id: number; from: 'you' | 'maya' | 'ravi'; text: string; tone?: 'good' | 'bad' | 'meh' }
type Phase = 'intro' | 'play' | 'assume' | 'round-end' | 'done';

export default function Clarify({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ri, setRi] = useState(0);
  const [turn, setTurn] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [flags, setFlags] = useState(0);
  const [log, setLog] = useState<Msg[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [pendingAssume, setPendingAssume] = useState<Req | null>(null);
  const finished = useRef(false);
  const nextId = useRef(0);
  const logEnd = useRef<HTMLDivElement>(null);
  const round = ROUNDS[ri];
  const options = useMemo(() => turnOptions(round, found, turn, ri), [round, found, turn, ri]);
  const turnsLeft = round.turns - turn;

  useEffect(() => {
    logEnd.current?.scrollIntoView?.({ block: 'nearest' });
  }, [log]);

  const say = (...msgs: Omit<Msg, 'id'>[]) => setLog((l) => [...l, ...msgs.map((m) => ({ ...m, id: nextId.current++ }))]);

  const startRound = (i: number) => {
    setRi(i);
    setTurn(0);
    setFound([]);
    setFlags(0);
    setPendingAssume(null);
    nextId.current = 0;
    setLog([{ id: nextId.current++, from: 'maya', text: ROUNDS[i].prompt }]);
    setPhase('play');
  };

  const endRound = (f: string[], fl: number) => {
    const s = clarifyScore(f.length, round.reqs.length, fl);
    setScores((prev) => [...prev, s]);
    setPhase('round-end');
  };

  const advance = (f: string[], fl: number) => {
    const next = turn + 1;
    setTurn(next);
    if (f.length === round.reqs.length || next >= round.turns) endRound(f, fl);
  };

  const pick = (o: TurnOption) => {
    if (phase !== 'play') return;
    if (o.kind === 'good') {
      const r = round.reqs.find((x) => x.key === o.key)!;
      say({ from: 'you', text: o.text, tone: 'good' }, { from: 'maya', text: r.a });
      if (r.assume) {
        setPendingAssume(r);
        setPhase('assume');
        return;
      }
      const f = [...found, r.key];
      setFound(f);
      advance(f, flags);
    } else if (o.kind === 'premature') {
      say({ from: 'you', text: o.text, tone: 'bad' }, { from: 'maya', text: 'Hold on. What exactly are we building? You haven\'t asked.' });
      const fl = flags + 1;
      setFlags(fl);
      advance(found, fl);
    } else {
      say({ from: 'you', text: o.text, tone: 'meh' }, { from: 'maya', text: 'That doesn\'t matter for the design. Next?' });
      advance(found, flags);
    }
  };

  const resolveAssume = (write: boolean) => {
    if (!pendingAssume) return;
    const r = pendingAssume;
    setPendingAssume(null);
    setPhase('play');
    if (write) {
      say({ from: 'ravi', text: `Good: you wrote "${r.note}" on the whiteboard.` });
      const f = [...found, r.key];
      setFound(f);
      advance(f, flags);
    } else {
      say({ from: 'ravi', text: 'Unwritten assumptions get lost. Always write them down!' });
      advance(found, flags);
    }
  };

  const total = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / ROUNDS.length) * 100) / 100 : 0;
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(total);
  };

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-cyan-300">Round {ri + 1}/{ROUNDS.length}</div>
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">“{round.prompt}”</div>
        <div className="ml-auto flex items-center gap-2 text-sm font-bold">
          <span className="rounded-2xl bg-slate-900 px-3 py-2 text-amber-300">Turns left: {phase === 'play' || phase === 'assume' ? turnsLeft : '-'}</span>
          <span className={`rounded-2xl px-3 py-2 ${flags ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900 text-slate-400'}`}>🚩 {flags}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* chat */}
        <div className="relative flex min-h-[420px] flex-col rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_0_40px_rgba(167,139,250,0.12)]">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Interview room</div>
          <div className="flex max-h-[300px] flex-1 flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
            <AnimatePresence initial={false}>
              {log.map((m) => (
                <motion.div
                  key={`${ri}-${m.id}`}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                    m.from === 'you'
                      ? `self-end ${m.tone === 'good' ? 'border-emerald-400/60 bg-emerald-400/10' : m.tone === 'bad' ? 'border-rose-400/60 bg-rose-400/10' : 'border-slate-600 bg-slate-800/60'}`
                      : m.from === 'ravi'
                        ? 'self-start border-cyan-400/50 bg-cyan-400/10'
                        : 'self-start border-violet-400/50 bg-violet-400/10'
                  }`}
                >
                  <div className={`text-[11px] font-black uppercase ${m.from === 'you' ? 'text-emerald-300' : m.from === 'ravi' ? 'text-cyan-300' : 'text-violet-300'}`}>
                    {m.from === 'you' ? 'You' : m.from === 'ravi' ? 'Ravi (coach)' : 'Maya (interviewer)'}
                  </div>
                  {m.text}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEnd} />
          </div>

          {phase === 'play' && (
            <div className="mt-3 grid gap-2">
              {options.map((o) => (
                <motion.button
                  key={`${turn}-${o.text}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => pick(o)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-left text-sm font-semibold hover:border-cyan-400 hover:bg-slate-800"
                >
                  {o.text}
                </motion.button>
              ))}
            </div>
          )}
          {phase === 'assume' && pendingAssume && (
            <div className="mt-3 rounded-2xl border border-amber-400/60 bg-amber-400/10 p-3">
              <div className="text-sm font-bold text-amber-200">The interviewer wants you to assume. What do you do?</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950" onClick={() => resolveAssume(true)}>
                  Write the assumption on the whiteboard
                </button>
                <button className="rounded-2xl border border-slate-600 px-4 py-2 text-sm font-bold" onClick={() => resolveAssume(false)}>
                  Keep it in my head
                </button>
              </div>
            </div>
          )}
        </div>

        {/* whiteboard */}
        <div className="rounded-2xl border-2 border-slate-700 bg-[#0b1324] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Whiteboard: requirements</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {round.reqs.map((r, i) => {
              const on = found.includes(r.key);
              return (
                <motion.div
                  key={`${ri}-${r.key}`}
                  animate={on ? { rotate: i % 2 ? 2 : -2, scale: 1 } : { rotate: 0, scale: 0.97 }}
                  className={`min-h-[64px] rounded-lg p-2 text-sm font-bold ${on ? 'bg-amber-300 text-slate-950 shadow-lg' : 'border border-dashed border-slate-700 text-slate-600'}`}
                >
                  {on ? r.note : '?'}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {found.length}/{round.reqs.length} requirements clarified. Ask the right questions before the turns run out; premature solutions are red flags (−15% each).
          </div>
        </div>
      </div>

      {phase !== 'play' && phase !== 'assume' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-md rounded-2xl border border-cyan-400/40 bg-slate-900 p-6 text-center">
          {phase === 'intro' && (
            <>
              <h3 className="text-2xl font-black text-cyan-300">Clarify!</h3>
              <p className="mt-2 text-slate-300">
                Maya gives you a vague prompt. Each turn, pick what to say. Good clarifying questions reveal requirements for the whiteboard;
                jumping into a solution is a <b className="text-rose-300">red flag</b>; trivia wastes a turn.
              </p>
              <button className="mt-5 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={() => startRound(0)} autoFocus>
                Enter the interview room
              </button>
            </>
          )}
          {phase === 'round-end' && (
            <>
              <h3 className="text-2xl font-black text-emerald-300">{found.length === round.reqs.length ? 'Scope locked in!' : 'Time to move on'}</h3>
              <p className="mt-2 text-slate-300">
                {found.length}/{round.reqs.length} requirements, {flags} red flag{flags === 1 ? '' : 's'}. Round score {Math.round((scores[scores.length - 1] ?? 0) * 100)}%.
              </p>
              <button
                className="mt-5 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300"
                autoFocus
                onClick={() => (ri + 1 < ROUNDS.length ? startRound(ri + 1) : setPhase('done'))}
              >
                {ri + 1 < ROUNDS.length ? 'Next prompt' : 'See results'}
              </button>
            </>
          )}
          {phase === 'done' && (
            <>
              <h3 className="text-2xl font-black text-amber-300">Interview scope: {Math.round(total * 100)}%</h3>
              <p className="mt-2 text-slate-300">Features, users, growth, tech stack. Ask first, write it down, then design.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800" onClick={() => { setScores([]); startRound(0); }}>
                  Play again
                </button>
                <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                  Finish
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
