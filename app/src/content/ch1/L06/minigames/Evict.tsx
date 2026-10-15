import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { EVICT_ROUNDS, KEY_EMOJI } from '../data';
import { playStream, type Step } from './evict';

export const ROUND_STEPS: Step[][] = EVICT_ROUNDS.map((r) => playStream(r.stream, r.policy));
export const TOTAL_QUESTIONS = ROUND_STEPS.reduce((n, steps) => n + steps.filter((s) => s.victim).length, 0);

type Phase = 'intro' | 'run' | 'ask' | 'reveal' | 'roundEnd' | 'done';

export default function Evict({ onComplete }: MiniGameProps) {
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(-1); // index of the last processed access
  const [phase, setPhase] = useState<Phase>('intro');
  const [guess, setGuess] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const finished = useRef(false);
  const r = EVICT_ROUNDS[round];
  const steps = ROUND_STEPS[round];
  const pending = phase === 'ask' || phase === 'reveal' ? steps[pos + 1] : null;
  const shown = pending ? (phase === 'reveal' ? pending.after : pending.before) : pos >= 0 ? steps[pos].after : [];
  const last = pos >= 0 ? steps[pos] : null;
  const score = useMemo(() => Math.round((correct / TOTAL_QUESTIONS) * 100) / 100, [correct]);

  const advance = useCallback(() => {
    if (phase !== 'run') return;
    const next = steps[pos + 1];
    if (!next) {
      setPhase(round + 1 < EVICT_ROUNDS.length ? 'roundEnd' : 'done');
      return;
    }
    if (next.victim) {
      setGuess(null);
      setPhase('ask');
    } else setPos(pos + 1);
  }, [phase, steps, pos, round]);

  const answer = (key: string) => {
    if (phase !== 'ask' || !pending) return;
    setGuess(key);
    if (key === pending.victim) setCorrect((c) => c + 1);
    setPhase('reveal');
  };
  const continueAfterReveal = useCallback(() => {
    setPos((p) => p + 1);
    setPhase('run');
  }, []);
  const nextRound = () => {
    setRound(round + 1);
    setPos(-1);
    setPhase('run');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (phase === 'run') { e.preventDefault(); advance(); }
      else if (phase === 'reveal') { e.preventDefault(); continueAfterReveal(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, advance, continueAfterReveal]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  const meta = (s: { enteredAt: number; lastUsed: number; uses: number }) =>
    r.policy === 'LRU' ? `last used: #${s.lastUsed + 1}` : r.policy === 'LFU' ? `hits: ${s.uses} · last #${s.lastUsed + 1}` : `entered: #${s.enteredAt + 1}`;

  return (
    <div className="mx-auto w-full max-w-3xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-2">
        {EVICT_ROUNDS.map((x, i) => (
          <div key={x.policy} className={`rounded-xl px-3 py-1 text-sm font-black ${i === round ? 'bg-amber-400 text-slate-950' : i < round ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
            {x.policy}
          </div>
        ))}
        <div className="ml-auto rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-emerald-300">✓ {correct}/{TOTAL_QUESTIONS}</div>
      </div>

      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-[0_0_40px_rgba(251,191,36,0.12)]">
        <p className="text-sm text-slate-300"><b className="text-amber-300">{r.policy}</b>: {r.blurb}</p>

        {/* access stream */}
        <div className="mt-4 flex flex-wrap gap-2">
          {r.stream.map((k, i) => {
            const done = i <= pos;
            const cur = pending ? i === pos + 1 : false;
            return (
              <motion.div key={i} animate={cur ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ repeat: cur ? Infinity : 0, duration: 0.9 }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${cur ? 'bg-rose-400/30 ring-2 ring-rose-400' : done ? (ROUND_STEPS[round][i].hit ? 'bg-emerald-400/20' : 'bg-slate-800') : 'bg-slate-900 opacity-40'}`}>
                {KEY_EMOJI[k]}
              </motion.div>
            );
          })}
        </div>

        {/* cache */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => {
            const s = shown[i];
            const isVictim = phase === 'reveal' && pending && s && pending.after[i].key !== pending.before[i]?.key;
            const wasGuess = phase === 'reveal' && pending?.before[i]?.key === guess;
            const prev = pending?.before[i];
            return (
              <motion.button key={i} disabled={phase !== 'ask' || !s} onClick={() => s && answer(s.key)}
                aria-label={s ? `Evict ${s.key}` : `Empty slot ${i + 1}`}
                whileHover={phase === 'ask' ? { scale: 1.05, y: -4 } : undefined} whileTap={phase === 'ask' ? { scale: 0.95 } : undefined}
                className={`relative flex h-32 flex-col items-center justify-center rounded-2xl border-2 ${
                  isVictim ? 'border-emerald-400 bg-emerald-400/10' : wasGuess ? 'border-rose-400 bg-rose-400/10' : phase === 'ask' ? 'border-amber-400/70 bg-slate-900 hover:bg-amber-400/10' : 'border-slate-700 bg-slate-900'}`}>
                <AnimatePresence mode="popLayout">
                  {s ? (
                    <motion.div key={s.key} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0, rotate: 20 }} className="text-center">
                      <div className="text-4xl">{KEY_EMOJI[s.key]}</div>
                      <div className="font-mono text-sm font-bold">{s.key}</div>
                      <div className="text-[11px] text-slate-400">{meta(s)}</div>
                    </motion.div>
                  ) : (
                    <div className="text-xs text-slate-600">empty</div>
                  )}
                </AnimatePresence>
                {isVictim && prev && <div className="absolute -top-3 rounded-full bg-rose-400 px-2 text-[11px] font-black text-slate-950">{KEY_EMOJI[prev.key]} evicted</div>}
              </motion.button>
            );
          })}
        </div>

        {/* status line + actions */}
        <div className="mt-5 min-h-[56px] text-center">
          {phase === 'intro' && (
            <div>
              <p className="text-slate-300">A 4-slot cache, three policies. Step through the requests; when the cache is full and a new key arrives, <b>you</b> pick who gets evicted.</p>
              <button className="mt-3 rounded-2xl bg-amber-400 px-6 py-2 font-bold text-slate-950" onClick={() => setPhase('run')} autoFocus>Start with LRU</button>
            </div>
          )}
          {phase === 'run' && (
            <div>
              <div className="text-sm text-slate-400">
                {last ? (last.hit ? `${KEY_EMOJI[last.key]} ${last.key}: HIT` : last.victim ? `${KEY_EMOJI[last.key]} ${last.key} moved in` : `${KEY_EMOJI[last.key]} ${last.key}: miss, stored`) : 'Cache is empty.'}
              </div>
              <button className="mt-2 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950" onClick={advance} autoFocus>Next request ▶</button>
            </div>
          )}
          {phase === 'ask' && pending && (
            <div className="text-lg font-black text-rose-300">Cache full! {KEY_EMOJI[pending.key]} {pending.key} needs a slot. Who does {r.policy} evict? Click a slot.</div>
          )}
          {phase === 'reveal' && pending && (
            <div>
              <div className={`text-lg font-black ${guess === pending.victim ? 'text-emerald-300' : 'text-rose-300'}`}>
                {guess === pending.victim ? `Correct: ${pending.victim} goes.` : `Nope: ${r.policy} evicts ${pending.victim}.`}
              </div>
              <button className="mt-2 rounded-2xl bg-white/90 px-6 py-2 font-bold text-slate-950" onClick={continueAfterReveal} autoFocus>Continue</button>
            </div>
          )}
          {phase === 'roundEnd' && (
            <div>
              <div className="font-black text-emerald-300">{r.policy} round done!</div>
              <button className="mt-2 rounded-2xl bg-amber-400 px-6 py-2 font-bold text-slate-950" onClick={nextRound} autoFocus>Next: {EVICT_ROUNDS[round + 1].policy}</button>
            </div>
          )}
          {phase === 'done' && (
            <div>
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-5xl font-black text-white">{Math.round(score * 100)}%</motion.div>
              <p className="text-xs text-slate-400">LRU is the most popular policy; LFU and FIFO fit other use cases.</p>
              <button className="mt-3 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
