import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { C, CheckMark, Chip, Label, Link, Node, Packet, Sparkles, Stage, linkPath, progress, type Pt } from '@/scenekit';
import { CDN_STEPS, CDN_STEP_SHORT } from '../data';

/** Fixed (deterministic) shuffle so the puzzle never starts solved. */
export const DECK_ORDER = [3, 0, 5, 2, 4, 1];

/** 0..1 score: lose 15% per wrong pick. */
export function orderScore(mistakes: number): number {
  return Math.max(0, Math.round((1 - 0.15 * mistakes) * 100) / 100);
}

/** Feedback for picking step `picked` when `want` was next. */
export function orderHint(want: number, picked: number): string {
  if (picked > want) {
    if (want === 1) return 'The edge cannot have the file yet. First it has to miss and go to the origin.';
    if (want === 2) return 'The CDN asked the origin. What comes back, and with which header?';
    if (want === 3) return 'The CDN has the file now. Before anyone else asks, what happens for User A?';
    if (want === 4) return 'A cache hit needs somebody to ask first: User B.';
    return 'Too early! Every CDN story starts with User A asking for image.png.';
  }
  return 'That already happened.';
}

const USER_A: Pt = { x: 180, y: 220 };
const USER_B: Pt = { x: 180, y: 520 };
const EDGE: Pt = { x: 640, y: 370 };
const ORIGIN: Pt = { x: 1080, y: 370 };
/** Replay: each step is one packet hop. */
const HOPS: { from: Pt; to: Pt; color: string; label: string }[] = [
  { from: USER_A, to: EDGE, color: C.sky, label: 'GET image.png' },
  { from: EDGE, to: ORIGIN, color: C.rose, label: 'miss → origin' },
  { from: ORIGIN, to: EDGE, color: C.emerald, label: 'image.png + TTL' },
  { from: EDGE, to: USER_A, color: C.emerald, label: 'cached · reply' },
  { from: USER_B, to: EDGE, color: C.sky, label: 'GET image.png' },
  { from: EDGE, to: USER_B, color: C.emerald, label: 'HIT from cache' },
];
const HOP_SEC = 1.6;

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

type Phase = 'intro' | 'play' | 'replay' | 'done';

export default function CdnFlowOrder({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [placed, setPlaced] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<{ step: number; msg: string; key: number } | null>(null);
  const [replayStart, setReplayStart] = useState(0);
  const now = useClock(phase === 'replay');
  const doneRef = useRef(false);

  const pick = (step: number) => {
    if (phase !== 'play' || placed.includes(step)) return;
    const want = placed.length;
    if (step === want) {
      setWrong(null);
      const next = [...placed, step];
      setPlaced(next);
      if (next.length === CDN_STEPS.length) {
        setReplayStart(performance.now() / 1000);
        setPhase('replay');
      }
    } else {
      setMistakes((m) => m + 1);
      setWrong({ step, msg: orderHint(want, step), key: Date.now() });
    }
  };

  const rt = phase === 'replay' ? Math.max(0, now - replayStart) : 0;
  const hop = phase === 'done' ? HOPS.length - 1 : Math.min(HOPS.length - 1, Math.floor(rt / HOP_SEC));
  useEffect(() => {
    if (phase === 'replay' && rt > HOPS.length * HOP_SEC + 1) setPhase('done');
  }, [phase, rt]);

  const score = orderScore(mistakes);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(score);
  };

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-sky-300">Order the CDN flow</div>
        <div className="text-sm text-slate-400">Placed {placed.length}/6</div>
        <div className="ml-auto rounded-2xl bg-slate-900 px-3 py-1 text-sm text-rose-300">Mistakes: {mistakes}</div>
      </div>

      {phase !== 'replay' && phase !== 'done' && (
        <div className="grid gap-4 md:grid-cols-2">
          <ol className="space-y-2" aria-label="Your order">
            {CDN_STEPS.map((_, i) => (
              <li key={i} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 py-2 ${placed[i] !== undefined ? 'border-emerald-400/60 bg-emerald-400/10' : i === placed.length ? 'border-sky-400/60 border-dashed' : 'border-slate-800 border-dashed'}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-800 font-black text-sky-300">{i + 1}</span>
                <AnimatePresence>
                  {placed[i] !== undefined && (
                    <motion.span layoutId={`step-${placed[i]}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="text-sm">
                      {CDN_STEPS[placed[i]]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ol>
          <div className="space-y-2">
            {DECK_ORDER.filter((s) => !placed.includes(s)).map((s) => (
              <motion.button
                key={s}
                layoutId={`step-${s}`}
                onClick={() => pick(s)}
                disabled={phase !== 'play'}
                animate={wrong?.step === s ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm ${wrong?.step === s ? 'border-rose-400 bg-rose-400/10' : 'border-slate-700 bg-slate-900 hover:border-sky-400'}`}
              >
                {CDN_STEPS[s]}
              </motion.button>
            ))}
            <AnimatePresence>
              {wrong && (
                <motion.p key={wrong.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-rose-400/50 bg-slate-950 px-3 py-2 text-sm text-rose-200" role="status">
                  {wrong.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {(phase === 'replay' || phase === 'done') && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800">
          <Stage time={now} title="CDN workflow replay">
            <Link from={USER_A} to={EDGE} color={C.line} width={2} dashed />
            <Link from={USER_B} to={EDGE} color={C.line} width={2} dashed />
            <Link from={EDGE} to={ORIGIN} color={C.line} width={2} dashed />
            <Node kind="client" label="User A" x={USER_A.x} y={USER_A.y} time={now} state={hop === 0 || hop === 3 ? 'active' : 'idle'} />
            <Node kind="mobile" label="User B" x={USER_B.x} y={USER_B.y} time={now} state={hop >= 4 ? 'active' : 'idle'} />
            <Node kind="cdn" label="CDN edge" x={EDGE.x} y={EDGE.y} size={120} time={now} glow={hop >= 3 ? 0.8 : 0.2} state={hop === 1 ? 'busy' : 'idle'} />
            <Node kind="web" label="Origin (web / S3)" x={ORIGIN.x} y={ORIGIN.y} time={now} state={hop === 1 || hop === 2 ? 'active' : 'idle'} />
            {phase === 'replay' && (
              <Packet along={linkPath(HOPS[hop].from, HOPS[hop].to, 0, 60)} t={progress(rt - hop * HOP_SEC, 0, HOP_SEC * 0.9)} color={HOPS[hop].color} label={HOPS[hop].label} size={11} shape="envelope" />
            )}
            <Chip x={640} y={60} text={CDN_STEP_SHORT[hop]} color={C.sky} filled size={20} />
            <Label x={640} y={680} text={CDN_STEPS[hop]} size={18} color={C.text} />
            {phase === 'done' && (
              <>
                <Sparkles x={640} y={370} t={1} radius={260} />
                <CheckMark x={640} y={250} t={1} size={80} />
              </>
            )}
          </Stage>
          {phase === 'replay' && (
            <button className="absolute bottom-3 right-3 rounded-2xl border border-slate-600 bg-slate-900/80 px-4 py-1 text-sm text-slate-200 hover:bg-slate-800" onClick={() => setPhase('done')}>
              Skip replay
            </button>
          )}
          {phase === 'done' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4">
              <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl border border-sky-400/40 bg-slate-900 p-6 text-center">
                <h3 className="text-2xl font-black text-sky-300">Flow mastered</h3>
                <p className="mt-1 text-5xl font-black text-white">{Math.round(score * 100)}%</p>
                <p className="mt-2 text-slate-300">Miss once at the origin, then serve everyone from the edge until the TTL expires.</p>
                <button className="mt-5 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                  Finish
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      {phase === 'intro' && (
        <div className="mt-4 rounded-2xl border border-sky-400/40 bg-slate-900 p-5 text-center">
          <p className="text-slate-300">Six steps of the CDN workflow got shuffled. Click them in the right order to rebuild the flow, then watch it replay.</p>
          <button className="mt-4 rounded-2xl bg-sky-400 px-6 py-2 font-bold text-slate-950 hover:bg-sky-300" onClick={() => setPhase('play')} autoFocus>
            Start
          </button>
        </div>
      )}
    </div>
  );
}
