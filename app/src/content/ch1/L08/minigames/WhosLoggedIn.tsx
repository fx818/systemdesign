import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, LogIn, LogOut, Server } from 'lucide-react';
import type { MiniGameProps } from '@/types/content';
import { HOME_SERVER, ROUNDS, USER_COLOR, crashedUntil, requestSucceeds, type Round, type ServerId, type Step, type UserId } from '../data';

/** Why a request succeeded or failed: the lesson in one sentence. */
export function explain(round: Round['id'], step: Step, crashed: ServerId[]): string {
  if (round === 'stateless') return `Server ${step.server} fetches ${step.user}'s session from the shared store. Any server works.`;
  const home = HOME_SERVER[step.user];
  if (crashed.includes(home)) return `${step.user}'s session lived only in server ${home}'s memory, and server ${home} crashed. Logged out!`;
  if (step.server === home) return `Server ${home} holds ${step.user}'s session in memory, so authentication works.`;
  return `Server ${step.server} has no session for ${step.user} (it lives on server ${home}). Authentication fails.`;
}

/** 0..1 score: share of correct calls. */
export function loggedInScore(results: boolean[], total: number): number {
  return total ? Math.round((results.filter(Boolean).length / total) * 100) / 100 : 0;
}

export const TOTAL_STEPS = ROUNDS.reduce((s, r) => s + r.steps.length, 0);

function useClock(running: boolean) {
  const [now, setNow] = useState(() => performance.now() / 1000);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const tick = () => {
      setNow(performance.now() / 1000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  return now;
}

type Phase = 'intro' | 'round' | 'play' | 'feedback' | 'done';

export default function WhosLoggedIn({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ri, setRi] = useState(0);
  const [si, setSi] = useState(0);
  const [t0, setT0] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [last, setLast] = useState<{ ok: boolean; succeeds: boolean; why: string; timeout: boolean } | null>(null);
  const now = useClock(phase === 'play');
  const doneRef = useRef(false);

  const round = ROUNDS[ri];
  const step = round.steps[si];
  const crashed = crashedUntil(round, si);
  const added = round.steps.slice(0, si + 1).some((s) => s.event?.kind === 'add');
  const timeLeft = phase === 'play' ? Math.max(0, round.limit - Math.max(0, now - t0)) : round.limit;

  const answer = (guess: boolean | null) => {
    if (phase !== 'play') return;
    const succeeds = requestSucceeds(round.id, step, crashed);
    const ok = guess === succeeds;
    setResults((r) => [...r, ok]);
    setLast({ ok, succeeds, why: explain(round.id, step, crashed), timeout: guess === null });
    setPhase('feedback');
  };

  useEffect(() => {
    if (phase === 'play' && now - t0 > round.limit) answer(null);
  });

  const startStep = () => {
    setT0(performance.now() / 1000);
    setPhase('play');
  };
  const next = () => {
    if (si + 1 < round.steps.length) {
      setSi(si + 1);
      startStep();
    } else if (ri + 1 < ROUNDS.length) {
      setRi(ri + 1);
      setSi(0);
      setPhase('round');
    } else setPhase('done');
  };

  const score = loggedInScore(results, TOTAL_STEPS);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(score);
  };

  const servers: ServerId[] = added ? [1, 2, 3, 4] : [1, 2, 3];
  const sessionsOn = (s: ServerId): UserId[] =>
    round.id === 'stateful' && !crashed.includes(s) ? (Object.keys(HOME_SERVER) as UserId[]).filter((u) => HOME_SERVER[u] === s) : [];

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">{round.title}</div>
        <div className="flex gap-1">
          {results.map((r, i) => (
            <span key={i} className={`h-3 w-3 rounded-full ${r ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          ))}
        </div>
        {phase === 'play' && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-3 w-36 overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full ${timeLeft / round.limit > 0.35 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${(timeLeft / round.limit) * 100}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-sm tabular-nums">{timeLeft.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {(phase === 'play' || phase === 'feedback') && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <AnimatePresence>
            {step.event && (
              <motion.div key={`${ri}-${si}-ev`} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className={`mb-3 rounded-2xl px-4 py-2 text-center text-sm font-bold ${step.event.kind === 'crash' ? 'bg-rose-500/20 text-rose-200' : 'bg-cyan-500/20 text-cyan-200'}`}>
                {step.event.text}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-[1fr_2fr] items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <motion.div key={`${ri}-${si}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="grid h-20 w-20 place-items-center rounded-2xl border-2 text-3xl font-black" style={{ borderColor: USER_COLOR[step.user], color: USER_COLOR[step.user] }}>
                {step.user}
              </motion.div>
              <motion.div key={`${ri}-${si}-env`} initial={{ x: 0, opacity: 1 }} animate={{ x: 120, opacity: [1, 1, 0] }} transition={{ duration: 0.9 }}
                className="rounded-md px-2 py-0.5 text-xs font-bold text-slate-950" style={{ background: USER_COLOR[step.user] }}>
                GET /feed
              </motion.div>
              <p className="text-center text-sm text-slate-400">User {step.user} → server {step.server}</p>
            </div>
            <div className="space-y-2">
              {servers.map((s) => {
                const dead = crashed.includes(s);
                const target = s === step.server;
                return (
                  <motion.div key={s} layout animate={target ? { scale: [1, 1.04, 1] } : { scale: 1 }} transition={{ repeat: target && phase === 'play' ? Infinity : 0, duration: 1 }}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${dead ? 'border-slate-800 opacity-40' : target ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700'}`}>
                    <Server size={18} className={dead ? 'text-slate-500' : 'text-cyan-300'} />
                    <span className="font-bold">Server {s}{dead ? ' · DOWN' : ''}</span>
                    <span className="ml-auto flex gap-1">
                      {round.id === 'stateful' && sessionsOn(s).map((u) => (
                        <span key={u} className="rounded-full px-2 text-xs font-bold text-slate-950" style={{ background: USER_COLOR[u] }}>session {u}</span>
                      ))}
                      {round.id === 'stateful' && !sessionsOn(s).length && <span className="text-xs text-slate-500">no sessions</span>}
                      {round.id === 'stateless' && <span className="text-xs text-slate-500">no state</span>}
                    </span>
                  </motion.div>
                );
              })}
              {round.id === 'stateless' && (
                <div className="flex items-center gap-3 rounded-2xl border border-orange-400/60 bg-orange-400/10 px-3 py-2">
                  <Database size={18} className="text-orange-300" />
                  <span className="font-bold">Shared NoSQL store</span>
                  <span className="ml-auto flex gap-1">
                    {(['A', 'B', 'C'] as UserId[]).map((u) => (
                      <span key={u} className="rounded-full px-2 text-xs font-bold text-slate-950" style={{ background: USER_COLOR[u] }}>session {u}</span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {phase === 'play' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => answer(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 font-black text-slate-950">
                <LogIn size={18} /> Logged in
              </motion.button>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => answer(false)} className="flex items-center justify-center gap-2 rounded-2xl bg-rose-400 py-3 font-black text-slate-950">
                <LogOut size={18} /> Logged out
              </motion.button>
            </div>
          )}
          {phase === 'feedback' && last && (
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`mt-4 rounded-2xl border p-3 ${last.ok ? 'border-emerald-400/60' : 'border-rose-400/60'}`}>
              <p className={`font-black ${last.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                {last.timeout ? 'Too slow! ' : last.ok ? 'Correct! ' : 'Nope. '}
                {last.succeeds ? 'The request is authenticated.' : 'The user gets logged out.'}
              </p>
              <p className="mt-1 text-sm text-slate-300">{last.why}</p>
              <button className="mt-3 rounded-2xl bg-slate-100 px-5 py-1.5 font-bold text-slate-950" onClick={next} autoFocus>Next</button>
            </motion.div>
          )}
        </div>
      )}

      {(phase === 'intro' || phase === 'round') && (
        <motion.div key={`r${ri}${phase}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-violet-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-violet-300">{phase === 'intro' ? "Who's Logged In?" : round.title}</h3>
          <p className="mt-2 text-slate-300">
            {phase === 'intro' ? 'Requests bounce between servers. For each one, call it: will the user stay logged in, or get kicked out? ' : ''}
            {round.intro}
          </p>
          <button className="mt-4 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950" onClick={phase === 'intro' ? () => setPhase('round') : startStep} autoFocus>
            {phase === 'intro' ? 'Start' : 'Go!'}
          </button>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-emerald-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-emerald-300">Sessions sorted</h3>
          <p className="mt-1 text-5xl font-black">{Math.round(score * 100)}%</p>
          <p className="mt-2 text-slate-300">Stateful: only the home server knows you. Stateless: every server can ask the shared store.</p>
          <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
        </motion.div>
      )}
    </div>
  );
}
