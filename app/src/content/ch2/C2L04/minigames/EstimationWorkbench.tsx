import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { Feedback, GameFrame, ResultCard } from '../../common/ui';
import { ROUND_BONUS, STEPS, grade, isRound, parseEntry, pretty, stepPoints, workbenchScore } from './workbench';

export default function EstimationWorkbench({ onComplete }: MiniGameProps) {
  const [i, setI] = useState(0);
  const [raw, setRaw] = useState('');
  const [entries, setEntries] = useState<number[]>([]);
  const [showFormula, setShowFormula] = useState(false);
  const finished = useRef(false);
  const done = entries.length === STEPS.length && i >= STEPS.length;
  const step = STEPS[Math.min(i, STEPS.length - 1)];
  const submitted = entries.length > i;
  const value = submitted ? entries[i] : parseEntry(raw);
  const g = submitted ? grade(step, value) : null;

  const submit = () => {
    if (submitted || !Number.isFinite(parseEntry(raw))) return;
    setEntries((e) => [...e, parseEntry(raw)]);
  };
  const next = () => { setI(i + 1); setRaw(''); setShowFormula(false); };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(workbenchScore(entries));
  };

  if (done) {
    return (
      <GameFrame step="Napkin complete" progress={1} accent="amber">
        <ResultCard title="Estimate report" score={workbenchScore(entries)} onFinish={finish}
          note="Assumptions → DAU → QPS → peak → servers → storage. Round numbers earn the bonus: precision is not expected." />
      </GameFrame>
    );
  }

  return (
    <GameFrame step={`Step ${i + 1}/${STEPS.length} · ${step.label}`} progress={i / STEPS.length} accent="amber">
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <motion.div key={step.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="text-2xl font-black text-white">{step.label}</h3>
          <p className="mt-1 text-slate-300">{step.prompt}</p>
          <button className="mt-2 text-xs font-bold text-cyan-300 underline" onClick={() => setShowFormula(true)}>
            {showFormula ? `Formula: ${step.formula}` : 'Show formula'}
          </button>
          <form className="mt-4 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input aria-label={step.label} inputMode="decimal" value={submitted ? String(entries[i]) : raw} disabled={submitted}
              onChange={(e) => setRaw(e.target.value)} placeholder="your estimate" autoFocus
              className="w-48 rounded-2xl border-2 border-slate-700 bg-slate-900 px-4 py-2 font-mono text-xl text-white outline-none focus:border-amber-400" />
            <span className="font-bold text-amber-300">{step.unit}</span>
            {!submitted && (
              <button type="submit" disabled={!Number.isFinite(parseEntry(raw))} className="ml-auto rounded-2xl bg-amber-400 px-5 py-2 font-black text-slate-950 disabled:opacity-40">Check</button>
            )}
          </form>
          {submitted && (
            <Feedback ok={g === 'exact'} partial={g === 'close'}>
              <div className="font-black">
                {g === 'exact' ? (step.final ? 'Within 2×: full marks!' : 'Spot on!') : g === 'close' ? 'Within 2×: half marks.' : 'Way off.'}
                {g === 'exact' && isRound(entries[i]) && <span className="ml-2 rounded-full bg-emerald-400 px-2 py-0.5 text-xs text-slate-950">Round it! +{ROUND_BONUS}</span>}
              </div>
              <p className="mt-1 text-slate-300">{step.formula} ≈ <b className="text-white">{pretty(step.answer)} {step.unit}</b>. Next steps use this value.</p>
              <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={next} autoFocus>
                {i + 1 < STEPS.length ? 'Next step' : 'Finish napkin'}
              </button>
            </Feedback>
          )}
        </motion.div>
        <div className="rounded-2xl bg-amber-100 p-4 font-mono text-sm text-slate-800 shadow-inner" style={{ transform: 'rotate(-1deg)' }}>
          <div className="mb-2 font-black text-amber-700">NAPKIN</div>
          {STEPS.slice(0, entries.length).map((s, k) => (
            <div key={s.id} className="flex justify-between gap-2">
              <span className="truncate">{s.label}</span>
              <b className={stepPoints(s, entries[k]) >= 1 ? 'text-emerald-700' : stepPoints(s, entries[k]) > 0 ? 'text-amber-700' : 'text-rose-700'}>{pretty(entries[k])}</b>
            </div>
          ))}
          {!entries.length && <div className="text-slate-500">your numbers land here</div>}
        </div>
      </div>
    </GameFrame>
  );
}
