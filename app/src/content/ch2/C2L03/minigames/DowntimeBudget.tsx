import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { formatDuration } from '../../common/numbers';
import { Feedback, GameFrame, ResultCard } from '../../common/ui';
import { MATCH_ROUNDS, SCENARIOS, TOTAL_POINTS, answerFor, breached, budgetMin, downtimeScore } from './downtime';

export default function DowntimeBudget({ onComplete }: MiniGameProps) {
  const [ri, setRi] = useState(0); // match rounds, then scenarios
  const [si, setSi] = useState(0);
  const [nine, setNine] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [missed, setMissed] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState(0);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [scenariosRight, setScenariosRight] = useState(0);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const inMatch = ri < MATCH_ROUNDS.length;
  const r = MATCH_ROUNDS[Math.min(ri, MATCH_ROUNDS.length - 1)];
  const s = SCENARIOS[Math.min(si, SCENARIOS.length - 1)];
  const score = downtimeScore(firstTry, scenariosRight);

  const pickDuration = (d: string) => {
    if (nine === null) return;
    if (answerFor(r, nine) === d) {
      if (!missed.includes(nine)) setFirstTry((n) => n + 1);
      setMatched((m) => [...m, nine]);
      setNine(null);
      setWrongFlash(null);
    } else {
      setMissed((m) => (m.includes(nine) ? m : [...m, nine]));
      setWrongFlash(d);
    }
  };
  const nextRound = () => { setRi(ri + 1); setMatched([]); setMissed([]); setNine(null); setWrongFlash(null); };
  const judge = (yes: boolean) => {
    if (verdict !== null) return;
    setVerdict(yes);
    if (yes === breached(s)) setScenariosRight((n) => n + 1);
  };
  const nextScenario = () => {
    if (si + 1 >= SCENARIOS.length) { setDone(true); return; }
    setSi(si + 1); setVerdict(null);
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };
  const progress = (MATCH_ROUNDS.slice(0, ri).length * 5 + (inMatch ? matched.length : 0) + (inMatch ? 0 : si)) / TOTAL_POINTS;

  if (done) {
    return (
      <GameFrame step="Results" progress={1} accent="emerald">
        <ResultCard title="Downtime report" score={score} onFinish={finish}
          note="Allowed downtime = (100% − availability) × period. Each extra nine divides it by 10." />
      </GameFrame>
    );
  }

  if (inMatch) {
    const roundDone = matched.length === r.nines.length;
    return (
      <GameFrame step={`${r.title} (${ri + 1}/${MATCH_ROUNDS.length})`} progress={progress} accent="emerald">
        <p className="text-sm text-slate-400">Pick an availability, then the downtime it allows {r.id === 'day' ? 'each day' : 'each year'}.</p>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            {r.nines.map((n) => {
              const ok = matched.includes(n);
              return (
                <button key={n} aria-label={`Availability ${n}%`} disabled={ok} onClick={() => setNine(n)}
                  className={`w-full rounded-2xl border-2 py-2 font-mono text-lg font-black ${ok ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : nine === n ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-700 bg-slate-900 text-white hover:border-emerald-400'}`}>
                  {n}%{ok && <span className="ml-2 text-sm">→ {answerFor(r, n)}</span>}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {r.durations.map((d) => {
              const used = matched.some((n) => answerFor(r, n) === d);
              return (
                <motion.button key={d} aria-label={`Downtime ${d}`} disabled={used || nine === null} onClick={() => pickDuration(d)}
                  animate={wrongFlash === d ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  className={`w-full rounded-2xl border-2 py-2 font-mono text-lg font-bold ${used ? 'border-slate-800 text-slate-600' : wrongFlash === d ? 'border-rose-400 text-rose-200' : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-amber-400'}`}>
                  {d}
                </motion.button>
              );
            })}
          </div>
        </div>
        {roundDone && (
          <Feedback ok={missed.length === 0} partial={missed.length < 3}>
            <div className="font-black">Round complete: {r.nines.length - missed.length}/{r.nines.length} on the first try.</div>
            <p className="mt-1 text-slate-300">Spot the pattern: each extra nine is 10× less downtime.</p>
            <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={nextRound} autoFocus>
              {ri + 1 < MATCH_ROUNDS.length ? 'Next round' : 'Scenarios'}
            </button>
          </Feedback>
        )}
      </GameFrame>
    );
  }

  const right = verdict !== null && verdict === breached(s);
  return (
    <GameFrame step={`Breached? ${si + 1}/${SCENARIOS.length}`} progress={progress} accent="emerald">
      <motion.div key={s.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
        <div className="text-4xl">{breached(s) && verdict !== null ? '🚨' : '📜'}</div>
        <p className="mt-2 text-xl font-bold text-white">{s.text}</p>
        <p className="mt-1 text-sm text-slate-400">Was the SLA breached?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button disabled={verdict !== null} onClick={() => judge(true)} className="rounded-2xl border-2 border-rose-400 bg-rose-400/10 py-3 text-lg font-black text-rose-200">Breached</button>
          <button disabled={verdict !== null} onClick={() => judge(false)} className="rounded-2xl border-2 border-emerald-400 bg-emerald-400/10 py-3 text-lg font-black text-emerald-200">Within SLA</button>
        </div>
        {verdict !== null && (
          <Feedback ok={right}>
            <div className="font-black">{right ? 'Correct!' : 'Not quite.'} {breached(s) ? 'Breached.' : 'Within the SLA.'}</div>
            <p className="mt-1 text-slate-300">
              Budget: {(100 - s.sla).toFixed(s.sla >= 99.99 ? 3 : 1).replace(/0+$/, '')}% of a {s.periodName} ≈ {formatDuration(budgetMin(s) * 60)}. Outage: {s.outageMin} min.
            </p>
            <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={nextScenario} autoFocus>
              {si + 1 < SCENARIOS.length ? 'Next scenario' : 'See results'}
            </button>
          </Feedback>
        )}
      </motion.div>
    </GameFrame>
  );
}
