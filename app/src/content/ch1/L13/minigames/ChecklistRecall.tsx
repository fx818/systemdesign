import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { CHECKLIST, DISTRACTORS, type Rule } from '../data';

/** Find the first not-yet-recalled rule whose keywords appear in the typed text. */
export function matchRule(text: string, recalled: string[]): Rule | undefined {
  const s = text.trim().toLowerCase();
  if (s.length < 3) return undefined;
  return CHECKLIST.find((r) => !recalled.includes(r.id) && r.keywords.some((k) => s.includes(k)));
}

/** Typed recall = 1 point, picked from the list = 0.5, each distractor picked = -0.25. Out of 8. */
export function recallScore(typed: number, picked: number, wrong: number): number {
  const s = (typed + 0.5 * picked - 0.25 * wrong) / CHECKLIST.length;
  return Math.round(Math.max(0, Math.min(1, s)) * 100) / 100;
}

type Phase = 'type' | 'pick' | 'done';
interface Choice {
  key: string;
  text: string;
  rule?: Rule;
  why: string;
}

export default function ChecklistRecall({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('type');
  const [input, setInput] = useState('');
  const [typed, setTyped] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  const finished = useRef(false);
  const recalled = [...typed, ...picked];
  const score = recallScore(typed.length, picked.length, wrong.length);

  // deterministic interleave of the remaining rules and the distractors
  const choices = useMemo<Choice[]>(() => {
    if (phase === 'type') return [];
    const rules: Choice[] = CHECKLIST.filter((r) => !typed.includes(r.id)).map((r) => ({ key: r.id, text: r.text, rule: r, why: r.why }));
    const fakes: Choice[] = DISTRACTORS.map((d, i) => ({ key: `fake-${i}`, text: d.text, why: d.why }));
    const out: Choice[] = [];
    for (let i = 0; i < Math.max(rules.length, fakes.length); i++) {
      if (i % 2 === 0 && fakes[i]) out.push(fakes[i]);
      if (rules[i]) out.push(rules[i]);
      if (i % 2 === 1 && fakes[i]) out.push(fakes[i]);
    }
    return out;
  }, [phase, typed]);

  const submit = () => {
    const r = matchRule(input, recalled);
    if (r) {
      const next = [...typed, r.id];
      setTyped(next);
      setInput('');
      if (next.length === CHECKLIST.length) setPhase('done');
    } else setMiss((m) => m + 1);
  };

  const choose = (c: Choice) => {
    if (recalled.includes(c.key) || wrong.includes(c.key)) return;
    if (c.rule) {
      const next = [...picked, c.key];
      setPicked(next);
      if (typed.length + next.length === CHECKLIST.length) setPhase('done');
    } else setWrong((w) => [...w, c.key]);
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-amber-300">
          {recalled.length}/{CHECKLIST.length} rules
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <motion.div className="h-full bg-amber-400" animate={{ width: `${(recalled.length / CHECKLIST.length) * 100}%` }} />
        </div>
      </div>

      {/* the board of 8 slots */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {CHECKLIST.map((r, i) => {
          const how = typed.includes(r.id) ? 'typed' : picked.includes(r.id) ? 'picked' : null;
          return (
            <motion.div
              key={r.id}
              animate={{ rotateY: how ? 0 : 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className={`relative min-h-[84px] rounded-2xl border p-3 ${
                how === 'typed' ? 'border-emerald-400 bg-emerald-400/10' : how === 'picked' ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-800 bg-slate-900'
              }`}
            >
              {how ? (
                <div style={{ transform: 'rotateY(0deg)' }}>
                  <div className="text-xs font-bold text-slate-400">
                    #{i + 1} {how === 'typed' ? '· from memory ★' : '· picked'}
                  </div>
                  <div className="font-bold">{r.text}</div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-black text-slate-700" style={{ transform: 'rotateY(180deg)' }}>
                  ?
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <AnimatePresence mode="wait">
          {phase === 'type' && (
            <motion.div key="type" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-slate-300">
                Round 1 · <b className="text-amber-300">from memory</b>: type a rule from the chapter's summary (e.g. "cache as much as you can") and press Enter. Each one you recall is worth full points.
              </p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <motion.input
                  key={miss}
                  animate={miss ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                  aria-label="Type a rule"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                  placeholder="keep the web tier…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-amber-400"
                />
                <button type="submit" className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300">
                  Recall
                </button>
              </form>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{miss > 0 ? `${miss} guess${miss === 1 ? '' : 'es'} did not match a missing rule` : 'Tip: key words are enough.'}</span>
                <button onClick={() => setPhase('pick')} className="rounded-xl border border-slate-700 px-3 py-1 font-bold text-slate-300 hover:bg-slate-800">
                  I'm stuck: show choices
                </button>
              </div>
            </motion.div>
          )}
          {phase === 'pick' && (
            <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-slate-300">
                Round 2 · <b className="text-cyan-300">pick</b> the real rules (half points). Careful: some are traps (−¼ each).
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {choices.map((c) => {
                  const ok = picked.includes(c.key);
                  const bad = wrong.includes(c.key);
                  return (
                    <motion.button
                      key={c.key}
                      onClick={() => choose(c)}
                      disabled={ok || bad}
                      animate={bad ? { x: [0, -8, 8, -4, 4, 0] } : ok ? { scale: [1, 1.05, 1] } : {}}
                      className={`rounded-xl border p-3 text-left text-sm ${
                        ok ? 'border-emerald-400 bg-emerald-400/15' : bad ? 'border-rose-400 bg-rose-400/10' : 'border-slate-700 bg-slate-900 hover:border-cyan-400'
                      }`}
                    >
                      <div className="font-bold">{c.text}</div>
                      {(ok || bad) && <div className={`mt-1 text-xs ${ok ? 'text-emerald-200' : 'text-rose-200'}`}>{c.why}</div>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <h3 className="text-2xl font-black text-amber-300">All 8 rules on the board</h3>
              <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-6xl font-black text-white">
                {Math.round(score * 100)}%
              </motion.p>
              <p className="text-sm text-slate-400">
                {typed.length} from memory · {picked.length} picked · {wrong.length} traps
              </p>
              <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                Finish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
