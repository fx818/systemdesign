import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ComponentKind, MiniGameProps } from '@/types/content';
import {
  C, CheckMark, Chip, Explosion, Label, Link, Node, Packet, Sparkles, Stage, linkPath, progress, type NodeState, type Pt,
} from '@/scenekit';
import { IP } from '../data';

type Hop = 'client' | 'mobile' | 'dns' | 'server' | 'db';

interface BoardNode { id: Hop; kind: ComponentKind; label: string; pos: Pt }
const BOARD: BoardNode[] = [
  { id: 'client', kind: 'client', label: 'Web browser', pos: { x: 190, y: 230 } },
  { id: 'mobile', kind: 'mobile', label: 'Mobile app', pos: { x: 190, y: 520 } },
  { id: 'dns', kind: 'dns', label: 'DNS', pos: { x: 640, y: 140 } },
  { id: 'server', kind: 'web', label: `Web server`, pos: { x: 1080, y: 370 } },
  { id: 'db', kind: 'db', label: 'Database', pos: { x: 660, y: 590 } },
];
const POS = Object.fromEntries(BOARD.map((n) => [n.id, n.pos])) as Record<Hop, Pt>;

export interface Round {
  title: string;
  story: string;
  start: 'client' | 'mobile';
  limit: number; // seconds
  hops: { to: Hop; carry: string; color: string }[];
}

export const ROUNDS: Round[] = [
  {
    title: 'Load the homepage',
    story: "Maya's mom types api.pixelpost.com into her browser.",
    start: 'client',
    limit: 22,
    hops: [
      { to: 'dns', carry: 'api.pixelpost.com?', color: C.violet },
      { to: 'client', carry: IP, color: C.amber },
      { to: 'server', carry: 'GET / (HTTP)', color: C.cyan },
      { to: 'client', carry: 'HTML', color: C.emerald },
    ],
  },
  {
    title: 'Open the mobile app',
    story: 'Mom opens the PixelPost app to check her profile.',
    start: 'mobile',
    limit: 16,
    hops: [
      { to: 'dns', carry: 'api.pixelpost.com?', color: C.violet },
      { to: 'mobile', carry: IP, color: C.amber },
      { to: 'server', carry: 'GET /users/12', color: C.cyan },
      { to: 'mobile', carry: 'JSON', color: C.amber },
    ],
  },
  {
    title: 'Speed run!',
    story: 'The whole book club refreshes at once. Be quick!',
    start: 'client',
    limit: 10,
    hops: [
      { to: 'dns', carry: 'api.pixelpost.com?', color: C.violet },
      { to: 'client', carry: IP, color: C.amber },
      { to: 'server', carry: 'GET /feed', color: C.cyan },
      { to: 'client', carry: 'HTML', color: C.emerald },
    ],
  },
];

/** Feedback for a wrong click: teaches why that hop is wrong right now. */
export function wrongHopReason(round: Round, hopIndex: number, clicked: Hop): string {
  const want = round.hops[hopIndex].to;
  if (clicked === 'db') return 'Clients never talk to the database directly. Only the web server does.';
  if (clicked !== round.start && (clicked === 'client' || clicked === 'mobile'))
    return 'Wrong device! Replies go back to whoever asked.';
  if (want === 'dns') return 'The client only knows a name. Ask DNS for the IP address first.';
  if (want === round.start) return hopIndex === 1 ? 'DNS hands the IP back to the client. It never forwards the request itself.' : 'The server replies to the client that sent the request.';
  if (want === 'server') return clicked === 'dns' ? 'You already have the IP. Now send HTTP straight to the web server.' : 'Time to send the HTTP request to the web server.';
  return 'Not that one. Follow the request flow!';
}

/** 0..1 score for one round. */
export function roundScore(completed: boolean, mistakes: number, timeLeft: number, limit: number): number {
  if (!completed) return 0;
  const accuracy = Math.max(0.3, 1 - 0.2 * mistakes);
  return Math.round(accuracy * (0.7 + 0.3 * Math.max(0, Math.min(1, timeLeft / limit))) * 100) / 100;
}

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

type Phase = 'intro' | 'play' | 'round-end' | 'done';
const HOP_SEC = 0.7;

export default function PacketJourney({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ri, setRi] = useState(0);
  const [hop, setHop] = useState(0);
  const [at, setAt] = useState<Hop>('client');
  const [move, setMove] = useState<{ from: Hop; to: Hop; t0: number; color: string; carry: string } | null>(null);
  const [roundStart, setRoundStart] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<{ id: Hop; t0: number; msg: string } | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<{ ok: boolean; score: number; t0: number } | null>(null);
  const now = useClock(phase !== 'done');
  const round = ROUNDS[ri];
  const doneRef = useRef(false);

  const timeLeft = phase === 'play' ? Math.max(0, round.limit - (now - roundStart) - penalty) : round.limit;

  const startRound = useCallback((i: number) => {
    setRi(i);
    setHop(0);
    setAt(ROUNDS[i].start);
    setMove(null);
    setPenalty(0);
    setMistakes(0);
    setWrong(null);
    setRoundStart(performance.now() / 1000);
    setPhase('play');
  }, []);

  const endRound = useCallback(
    (ok: boolean, left: number) => {
      const s = roundScore(ok, mistakes, left, round.limit);
      setScores((prev) => [...prev, s]);
      setLastResult({ ok, score: s, t0: performance.now() / 1000 });
      setPhase('round-end');
    },
    [mistakes, round.limit],
  );

  // finish a hop animation
  useEffect(() => {
    if (!move || now - move.t0 < HOP_SEC) return;
    setAt(move.to);
    setMove(null);
    const next = hop + 1;
    setHop(next);
    if (next >= round.hops.length) endRound(true, timeLeft);
  }, [now, move, hop, round.hops.length, endRound, timeLeft]);

  // timeout
  useEffect(() => {
    if (phase === 'play' && !move && timeLeft <= 0) endRound(false, 0);
  }, [phase, move, timeLeft, endRound]);

  const click = (id: Hop) => {
    if (phase !== 'play' || move) return;
    const want = round.hops[hop];
    if (id === want.to) {
      setWrong(null);
      setMove({ from: at, to: id, t0: performance.now() / 1000, color: want.color, carry: want.carry });
    } else if (id !== at) {
      setMistakes((m) => m + 1);
      setPenalty((p) => p + 2);
      setWrong({ id, t0: performance.now() / 1000, msg: wrongHopReason(round, hop, id) });
    }
  };

  const total = useMemo(() => (scores.length ? scores.reduce((a, b) => a + b, 0) / ROUNDS.length : 0), [scores]);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(Math.round(total * 100) / 100);
  };

  const sinceWrong = wrong ? now - wrong.t0 : 99;
  const moveT = move ? progress(now - move.t0, 0, HOP_SEC) : 0;
  const packetPos = move ? linkPath(POS[move.from], POS[move.to], 0, 0) : [POS[at]];
  const nextCarry = phase === 'play' && hop < round.hops.length ? round.hops[hop].carry : '';

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      {/* HUD */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">
          Round {ri + 1}/{ROUNDS.length} · {round.title}
        </div>
        <div className="flex gap-1">
          {round.hops.map((h, i) => (
            <span key={i} className={`h-3 w-8 rounded-full ${i < hop ? 'bg-emerald-400' : i === hop && phase === 'play' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} title={h.carry} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-3 w-40 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${timeLeft / round.limit > 0.4 ? 'bg-emerald-400' : timeLeft / round.limit > 0.2 ? 'bg-amber-400' : 'bg-rose-400'}`}
              style={{ width: `${(timeLeft / round.limit) * 100}%` }}
            />
          </div>
          <span className="w-12 text-right font-mono text-sm tabular-nums">{timeLeft.toFixed(1)}s</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        <Stage time={now} title="Packet Journey board">
          {/* faint wiring */}
          {(
            [
              ['client', 'dns'],
              ['mobile', 'dns'],
              ['client', 'server'],
              ['mobile', 'server'],
              ['server', 'db'],
            ] as [Hop, Hop][]
          ).map(([a, b]) => (
            <Link key={a + b} from={POS[a]} to={POS[b]} color={C.line} width={2} dashed inset={64} />
          ))}
          {BOARD.map((n) => {
            const isWrong = wrong?.id === n.id && sinceWrong < 0.6;
            const state: NodeState = isWrong ? 'overloaded' : n.id === at && !move ? 'active' : 'idle';
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={n.label}
                style={{ cursor: phase === 'play' ? 'pointer' : 'default', outline: 'none' }}
                onClick={() => click(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && click(n.id)}
              >
                <rect x={n.pos.x - 80} y={n.pos.y - 70} width={160} height={150} fill="transparent" />
                <Node kind={n.kind} x={n.pos.x} y={n.pos.y} label={n.label} state={state} time={now} glow={n.id === at ? 0.8 : 0.2}
                  sublabel={n.id === 'server' ? IP : undefined} />
              </g>
            );
          })}
          {wrong && sinceWrong < 0.6 && <Explosion x={POS[wrong.id].x} y={POS[wrong.id].y} t={sinceWrong / 0.6} size={70} />}
          {phase === 'play' && (
            <Packet along={packetPos} t={moveT} color={move?.color ?? round.hops[hop]?.color ?? C.cyan} label={move ? move.carry : nextCarry} size={11} shape="envelope" />
          )}
          {phase === 'round-end' && lastResult && (
            <>
              <Sparkles x={640} y={360} t={lastResult.ok ? progress(now - lastResult.t0, 0, 1.2) : 0} radius={200} />
              {lastResult.ok && <CheckMark x={640} y={360} t={progress(now - lastResult.t0, 0, 0.8)} size={90} />}
            </>
          )}
          <Label x={640} y={700} text="Click the next hop for the packet" size={15} color={C.dim} />
          {phase === 'play' && <Chip x={640} y={40} text={round.story} color={C.violet} size={15} />}
        </Stage>

        <AnimatePresence>
          {wrong && sinceWrong < 2.5 && phase === 'play' && (
            <motion.div
              key={wrong.t0}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="absolute bottom-4 left-1/2 w-[90%] max-w-lg -translate-x-1/2 rounded-2xl border border-rose-400/60 bg-slate-950/90 px-4 py-3 text-center text-sm"
            >
              <span className="font-bold text-rose-300">-2s · </span>
              {wrong.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {phase !== 'play' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-cyan-400/40 bg-slate-900 p-6 text-center">
              {phase === 'intro' && (
                <>
                  <h3 className="text-2xl font-black text-cyan-300">Packet Journey</h3>
                  <p className="mt-2 text-slate-300">
                    You are the packet's GPS. Click each hop in the right order: ask <b>DNS</b>, bring the <b>IP</b> home, send <b>HTTP</b> to the server, deliver the <b>response</b>.
                    Wrong hops cost 2 seconds.
                  </p>
                  <button className="mt-5 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300" onClick={() => startRound(0)} autoFocus>
                    Start
                  </button>
                </>
              )}
              {phase === 'round-end' && lastResult && (
                <>
                  <h3 className={`text-2xl font-black ${lastResult.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{lastResult.ok ? 'Delivered!' : 'Timed out!'}</h3>
                  <p className="mt-2 text-slate-300">
                    {lastResult.ok
                      ? `${mistakes === 0 ? 'Flawless route.' : `${mistakes} wrong hop${mistakes > 1 ? 's' : ''}.`} Round score ${Math.round(lastResult.score * 100)}%.`
                      : 'The user stared at a spinner. Remember: DNS, IP back to the client, HTTP to the server, response back.'}
                  </p>
                  <button
                    className="mt-5 rounded-2xl bg-cyan-400 px-6 py-2 font-bold text-slate-950 hover:bg-cyan-300"
                    autoFocus
                    onClick={() => (ri + 1 < ROUNDS.length ? startRound(ri + 1) : setPhase('done'))}
                  >
                    {ri + 1 < ROUNDS.length ? 'Next round' : 'See results'}
                  </button>
                </>
              )}
              {phase === 'done' && (
                <>
                  <h3 className="text-2xl font-black text-amber-300">Journey complete</h3>
                  <p className="mt-1 text-5xl font-black text-white">{Math.round(total * 100)}%</p>
                  <p className="mt-2 text-slate-300">Ask DNS → IP comes back → HTTP to the server → HTML or JSON home.</p>
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      className="rounded-2xl border border-slate-600 px-5 py-2 font-bold text-slate-200 hover:bg-slate-800"
                      onClick={() => {
                        setScores([]);
                        startRound(0);
                      }}
                    >
                      Play again
                    </button>
                    <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
                      Finish
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
