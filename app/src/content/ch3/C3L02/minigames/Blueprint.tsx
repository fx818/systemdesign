import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { hash } from '@/scenekit';
import { BUILD_FLOW, DECOYS, PUBLISH_FLOW, PUBLISH_SLOTS, type FlowStep } from '../data';

/** Deterministic shuffle (same order every run, so tests and replays agree). */
export function shuffled<T>(xs: T[], seed: number): T[] {
  return xs.map((x, i) => ({ x, k: hash(seed * 97 + i * 13) })).sort((a, b) => a.k - b.k).map((p) => p.x);
}

/** Part score: 1 minus 10% per mistake. */
export const partScore = (mistakes: number) => Math.max(0, Math.round((1 - 0.1 * mistakes) * 100) / 100);
export const blueprintScore = (mistakesA: number, mistakesB: number) => Math.round(((partScore(mistakesA) + partScore(mistakesB)) / 2) * 100) / 100;

const EDGES: [string, string][] = [
  ['user', 'lb'], ['lb', 'web'], ['web', 'post'], ['web', 'fanout'], ['web', 'notify'],
  ['post', 'post-cache'], ['post', 'post-db'], ['fanout', 'feed-cache'],
];
const FIXED = [{ id: 'user', text: 'User (web + mobile)', x: 6, y: 50 }];
const POS: Record<string, { x: number; y: number }> = Object.fromEntries([...FIXED, ...PUBLISH_SLOTS].map((s) => [s.id, { x: s.x, y: s.y }]));
const FLOWS: { key: 'publish' | 'build'; title: string; steps: FlowStep[] }[] = [
  { key: 'publish', title: 'Flow 1: feed publishing', steps: PUBLISH_FLOW },
  { key: 'build', title: 'Flow 2: news feed building', steps: BUILD_FLOW },
];

type Phase = 'intro' | 'board' | 'flows' | 'done';

export default function Blueprint({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakesA, setMistakesA] = useState(0);
  const [mistakesB, setMistakesB] = useState(0);
  const [flowIdx, setFlowIdx] = useState(0);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ text: string; bad: boolean; n: number } | null>(null);
  const finished = useRef(false);
  const tray = useMemo(() => shuffled([...PUBLISH_SLOTS.map((s) => s.answer), ...DECOYS], 3), []);
  const cards = useMemo(() => shuffled([...PUBLISH_FLOW, ...BUILD_FLOW], 11), []);
  const flow = FLOWS[flowIdx];
  const used = new Set(Object.values(placed));
  const done = new Set(ordered);
  const score = blueprintScore(mistakesA, mistakesB);

  const say = (text: string, bad: boolean) => setMsg((m) => ({ text, bad, n: (m?.n ?? 0) + 1 }));

  const dropOn = (slotId: string) => {
    if (phase !== 'board' || placed[slotId]) return;
    if (!selected) return say('Pick a box from the tray first.', false);
    const slot = PUBLISH_SLOTS.find((s) => s.id === slotId)!;
    if (DECOYS.includes(selected)) {
      setMistakesA((m) => m + 1);
      setSelected(null);
      return say(`"${selected}"? Nobody asked for that. Over-engineering is a red flag.`, true);
    }
    if (selected !== slot.answer) {
      setMistakesA((m) => m + 1);
      return say(`Not there. This slot ${slot.hint}.`, true);
    }
    const next = { ...placed, [slotId]: selected };
    setPlaced(next);
    setSelected(null);
    say(`${selected}: ${slot.hint}. ✓`, false);
    if (Object.keys(next).length === PUBLISH_SLOTS.length) setPhase('flows');
  };

  const pickStep = (step: FlowStep) => {
    if (phase !== 'flows' || done.has(step.id)) return;
    const expected = flow.steps.find((s) => !done.has(s.id))!;
    if (step.id !== expected.id) {
      setMistakesB((m) => m + 1);
      return say(step.flow !== flow.key ? 'That step belongs to the other flow.' : 'Right flow, wrong moment. What has to happen first?', true);
    }
    const next = [...ordered, step.id];
    setOrdered(next);
    say('✓', false);
    if (flow.steps.every((s) => next.includes(s.id))) {
      if (flowIdx + 1 < FLOWS.length) setFlowIdx(flowIdx + 1);
      else setPhase('done');
    }
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">
          {phase === 'flows' ? flow.title : 'Part 1: draw the feed publishing blueprint'}
        </div>
        <div className="ml-auto rounded-2xl bg-slate-900 px-3 py-2 text-sm font-bold text-rose-300">Mistakes: {mistakesA + mistakesB}</div>
      </div>

      {phase === 'intro' && (
        <div className="mx-auto max-w-md rounded-2xl border border-violet-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-violet-300">Blueprint</h3>
          <p className="mt-2 text-slate-300">
            Part 1: pick a box from the tray, then click where it goes on the whiteboard. Some boxes in the tray are over-engineered decoys.
            Part 2: put the steps of the two news feed flows in order.
          </p>
          <button className="mt-5 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950 hover:bg-violet-300" onClick={() => setPhase('board')} autoFocus>
            Grab a marker
          </button>
        </div>
      )}

      {phase === 'board' && (
        <>
          <div className="relative h-[380px] overflow-hidden rounded-2xl border-2 border-slate-700 bg-[#0b1324]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {EDGES.map(([a, b]) => (
                <line key={a + b} x1={POS[a].x} y1={POS[a].y} x2={POS[b].x} y2={POS[b].y} stroke={placed[b] || b === 'user' ? '#a78bfa' : '#334155'} strokeWidth={0.4} strokeDasharray={placed[b] ? undefined : '1 1'} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            {FIXED.map((f) => (
              <div key={f.id} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-sky-400 bg-slate-900 px-2 py-2 text-center text-xs font-bold text-sky-200" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 92 }}>
                {f.text}
              </div>
            ))}
            {PUBLISH_SLOTS.map((s) => (
              <motion.button
                key={s.id}
                aria-label={`Slot: ${s.hint}`}
                onClick={() => dropOn(s.id)}
                animate={placed[s.id] ? { scale: [1.15, 1] } : {}}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-center text-xs font-bold ${
                  placed[s.id] ? 'border-2 border-violet-400 bg-violet-400/20 text-white' : `border-2 border-dashed ${selected ? 'border-amber-400/70 bg-amber-400/5 text-amber-200' : 'border-slate-600 text-slate-500'}`
                }`}
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: 132 }}
              >
                {placed[s.id] ?? s.hint}
              </motion.button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tray">
            {tray.filter((t) => !used.has(t)).map((t) => (
              <button
                key={t}
                onClick={() => setSelected(selected === t ? null : t)}
                className={`rounded-2xl border-2 px-3 py-2 text-sm font-bold ${selected === t ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600 bg-slate-900 hover:border-violet-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'flows' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Step cards: click the next step of {flow.key === 'publish' ? 'feed publishing' : 'news feed building'}</div>
            <div className="grid gap-2">
              {cards.filter((c) => !done.has(c.id)).map((c) => (
                <motion.button key={c.id} layout onClick={() => pickStep(c)} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm font-semibold hover:border-violet-400">
                  {c.text}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {FLOWS.map((f, fi) => (
              <div key={f.key} className={`rounded-2xl border-2 p-3 ${fi === flowIdx ? 'border-violet-400 bg-violet-400/10' : 'border-slate-800 bg-slate-900'}`}>
                <div className="text-sm font-black text-violet-200">{f.title}</div>
                <ol className="mt-2 grid gap-1 text-sm">
                  {f.steps.map((s, i) => (
                    <li key={s.id} className={`rounded-lg px-2 py-1 ${done.has(s.id) ? 'bg-emerald-400/15 text-emerald-100' : 'text-slate-600'}`}>
                      {i + 1}. {done.has(s.id) ? s.text : '…'}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {msg && phase !== 'intro' && phase !== 'done' && (
          <motion.div key={msg.n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mt-3 rounded-2xl border px-4 py-2 text-sm ${msg.bad ? 'border-rose-400/60 bg-rose-400/10 text-rose-100' : 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'}`}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'done' && (
        <div className="mx-auto mt-2 max-w-md rounded-2xl border border-emerald-400/40 bg-slate-900 p-6 text-center">
          <h3 className="text-2xl font-black text-emerald-300">Blueprint approved: {Math.round(score * 100)}%</h3>
          <p className="mt-2 text-slate-300">Publishing writes the post and spreads it to friends; building aggregates friends&apos; posts newest first.</p>
          <button className="mt-5 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
            Finish
          </button>
        </div>
      )}
    </div>
  );
}
