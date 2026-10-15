import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { Feedback, GameFrame, ResultCard } from '../../common/ui';
import { CONVERT_QS, LADDER_ORDER, LADDER_TILES, SECONDS_PER_Q, ladderPoints, unitLadderScore } from './unitLadder';

type Phase = 'intro' | 'ladder' | 'convert' | 'done';

export default function UnitLadder({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [placed, setPlaced] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongTile, setWrongTile] = useState<string | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(SECONDS_PER_Q);
  const finished = useRef(false);
  const q = CONVERT_QS[Math.min(qi, CONVERT_QS.length - 1)];
  const answered = picked !== null || timedOut;

  useEffect(() => {
    if (phase !== 'convert' || answered) return;
    if (left <= 0) { setTimedOut(true); return; }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, answered, left]);

  const tap = (tile: string) => {
    if (LADDER_ORDER[placed] === tile) {
      setPlaced(placed + 1);
      setWrongTile(null);
    } else {
      setMistakes((m) => m + 1);
      setWrongTile(tile);
    }
  };
  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (qi + 1 >= CONVERT_QS.length) { setPhase('done'); return; }
    setQi(qi + 1); setPicked(null); setTimedOut(false); setLeft(SECONDS_PER_Q);
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(unitLadderScore(mistakes, correct));
  };

  const progress = phase === 'intro' ? 0 : phase === 'ladder' ? (placed / LADDER_ORDER.length) * 0.3 : phase === 'convert' ? 0.3 + (qi / CONVERT_QS.length) * 0.7 : 1;
  const step = phase === 'ladder' ? 'Climb the ladder' : phase === 'convert' ? `Convert ${qi + 1}/${CONVERT_QS.length}` : phase === 'done' ? 'Done' : 'Unit Ladder';

  return (
    <GameFrame step={step} progress={progress} accent="amber"
      extra={phase === 'convert' ? <div className={`rounded-2xl px-3 py-2 text-sm font-black ${left <= 3 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900 text-amber-300'}`}>⏱ {left}s</div> : undefined}>
      {phase === 'intro' && (
        <div className="text-center">
          <div className="text-5xl">🪜</div>
          <h3 className="mt-2 text-2xl font-black text-white">Unit Ladder</h3>
          <p className="mt-2 text-sm text-slate-400">First, tap the units from smallest to largest. Then answer 8 quick conversions, {SECONDS_PER_Q} seconds each. Every rung is × 1,024 (about × 1,000).</p>
          <button className="mt-4 rounded-2xl bg-amber-400 px-6 py-2 font-black text-slate-950 hover:bg-amber-300" onClick={() => setPhase('ladder')} autoFocus>Start climbing</button>
        </div>
      )}

      {phase === 'ladder' && (
        <div>
          <p className="text-sm text-slate-400">Tap the units in order, <b className="text-amber-300">smallest first</b>.</p>
          <div className="mt-4 flex min-h-12 flex-wrap gap-2">
            {LADDER_ORDER.slice(0, placed).map((u, i) => (
              <motion.span key={u} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl border border-emerald-400 bg-emerald-400/15 px-3 py-2 font-black text-emerald-300">
                {i > 0 && <span className="mr-1 text-xs text-slate-500">{i === 1 ? '×8' : '×1,024'}</span>}{u}
              </motion.span>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {LADDER_TILES.filter((u) => !LADDER_ORDER.slice(0, placed).includes(u)).map((u) => (
              <motion.button key={u} aria-label={`Unit ${u}`} onClick={() => tap(u)}
                animate={wrongTile === u ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                className={`rounded-2xl border-2 py-4 text-xl font-black ${wrongTile === u ? 'border-rose-400 text-rose-300' : 'border-slate-700 bg-slate-900 text-white hover:border-amber-400'}`}>
                {u}
              </motion.button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Mistakes: {mistakes}</p>
          {placed === LADDER_ORDER.length && (
            <Feedback ok={mistakes === 0} partial={ladderPoints(mistakes) > 0}>
              <div className="font-black">Bit → Byte → KB → MB → GB → TB → PB</div>
              <p className="mt-1 text-slate-300">8 bits make a byte; after that every rung is 2^10 ≈ 1,000×.</p>
              <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={() => setPhase('convert')} autoFocus>Conversions!</button>
            </Feedback>
          )}
        </div>
      )}

      {phase === 'convert' && (
        <motion.div key={qi} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
          <h3 className="text-center text-3xl font-black text-white">{q.prompt}</h3>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {q.options.map((o, i) => {
              const state = !answered ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'idle';
              return (
                <button key={o} disabled={answered} onClick={() => pick(i)}
                  className={`rounded-2xl border-2 py-3 text-lg font-bold ${state === 'right' ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : state === 'wrong' ? 'border-rose-400 bg-rose-400/15 text-rose-200' : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-amber-400'}`}>
                  {o}
                </button>
              );
            })}
          </div>
          {answered && (
            <Feedback ok={picked === q.answer}>
              <div className="font-black">{picked === q.answer ? 'Correct!' : timedOut ? "Time's up!" : 'Not quite.'}</div>
              <p className="mt-1 text-slate-300">{q.why}</p>
              <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={next} autoFocus>
                {qi + 1 < CONVERT_QS.length ? 'Next' : 'See results'}
              </button>
            </Feedback>
          )}
        </motion.div>
      )}

      {phase === 'done' && (
        <ResultCard title="Ladder report" score={unitLadderScore(mistakes, correct)} onFinish={finish}
          note={`Ladder mistakes: ${mistakes}. Conversions: ${correct}/${CONVERT_QS.length}. Label every number with its unit and count rungs to convert.`} />
      )}
    </GameFrame>
  );
}
