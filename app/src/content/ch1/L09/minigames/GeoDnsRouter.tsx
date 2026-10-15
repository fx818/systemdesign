import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { C, CheckMark, Chip, CrossMark, Explosion, Label, Node, Packet, Sparkles, Stage, linkPath, progress, type Pt } from '@/scenekit';
import { CONTINENTS, DCS, GEO_ROUNDS, nearestDc, type DcId } from '../data';

/** Why a routing choice was wrong. */
export function routeReason(picked: DcId, want: DcId, down: DcId[]): string {
  const name = (id: DcId) => DCS.find((d) => d.id === id)!.name;
  if (down.includes(picked)) return `${name(picked)} is offline! GeoDNS must send this user to a healthy data center: ${name(want)}.`;
  return `${name(want)} is closer. GeoDNS routes each user to the nearest data center.`;
}

export const TOTAL_USERS = GEO_ROUNDS.reduce((s, r) => s + r.users.length, 0);

/** 0..1: correct routes over all users. */
export function geoScore(results: boolean[]): number {
  return Math.round((results.filter(Boolean).length / TOTAL_USERS) * 100) / 100;
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

type Phase = 'intro' | 'round' | 'play' | 'done';
interface Flash { from: Pt; to: Pt; ok: boolean; t0: number; msg?: string }

export default function GeoDnsRouter({ onComplete }: MiniGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ri, setRi] = useState(0);
  const [ui, setUi] = useState(0);
  const [t0, setT0] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const now = useClock(phase !== 'done');
  const doneRef = useRef(false);

  const round = GEO_ROUNDS[ri];
  const user = round.users[ui];
  const timeLeft = phase === 'play' ? Math.max(0, round.limit - Math.max(0, now - t0)) : round.limit;

  const advance = () => {
    if (ui + 1 < round.users.length) {
      setUi(ui + 1);
      setT0(performance.now() / 1000);
    } else if (ri + 1 < GEO_ROUNDS.length) {
      setRi(ri + 1);
      setUi(0);
      setPhase('round');
    } else setPhase('done');
  };

  const route = (picked: DcId | null) => {
    if (phase !== 'play') return;
    const want = nearestDc(user.pos, round.down);
    const ok = picked === want;
    const target = DCS.find((d) => d.id === (picked ?? want))!.pos;
    setResults((r) => [...r, ok]);
    setFlash({
      from: user.pos, to: target, ok, t0: performance.now() / 1000,
      msg: ok ? undefined : picked === null ? `Too slow! ${user.city} should go to ${DCS.find((d) => d.id === want)!.name}.` : routeReason(picked, want, round.down),
    });
    advance();
  };

  useEffect(() => {
    if (phase === 'play' && now - t0 > round.limit) route(null);
  });

  const score = geoScore(results);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(score);
  };
  const sinceFlash = flash ? now - flash.t0 : 99;

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-violet-300">{round.title}</div>
        <div className="flex gap-1">
          {results.map((r, i) => <span key={i} className={`h-3 w-3 rounded-full ${r ? 'bg-emerald-400' : 'bg-rose-400'}`} />)}
        </div>
        {phase === 'play' && (
          <div className="ml-auto h-3 w-40 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full rounded-full ${timeLeft / round.limit > 0.35 ? 'bg-violet-400' : 'bg-rose-400'}`} style={{ width: `${(timeLeft / round.limit) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_0_40px_rgba(167,139,250,0.15)]">
        <Stage time={now} title="GeoDNS Router map">
          {CONTINENTS.map((d, i) => <path key={i} d={d} fill={C.panel2} stroke={C.line} strokeWidth={2} opacity={0.75} />)}
          {DCS.map((d) => {
            const down = round.down.includes(d.id) && phase !== 'intro';
            return (
              <g key={d.id} role="button" tabIndex={0} aria-label={d.name} style={{ cursor: phase === 'play' ? 'pointer' : 'default', outline: 'none' }}
                onClick={() => route(d.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && route(d.id)}>
                <rect x={d.pos.x - 60} y={d.pos.y - 60} width={120} height={130} fill="transparent" />
                <Node kind="datacenter" label={d.name} x={d.pos.x} y={d.pos.y} size={76} time={now} state={down ? 'down' : 'idle'} glow={down ? 0 : 0.4} />
              </g>
            );
          })}
          {phase === 'play' && user && (
            <g>
              <circle cx={user.pos.x} cy={user.pos.y} r={14 + 8 * Math.abs(Math.sin(now * 4))} fill={C.amber} opacity={0.3} />
              <circle cx={user.pos.x} cy={user.pos.y} r={9} fill={C.amber} />
              <Chip x={user.pos.x} y={user.pos.y + 34} text={user.city} color={C.amber} filled size={15} />
            </g>
          )}
          {flash && sinceFlash < 0.9 && (
            <>
              <Packet along={linkPath(flash.from, flash.to, -30, 0)} t={progress(sinceFlash, 0, 0.5)} color={flash.ok ? C.emerald : C.rose} size={8} />
              {flash.ok ? <CheckMark x={flash.to.x} y={flash.to.y - 60} t={progress(sinceFlash, 0.4, 0.8)} size={36} /> : <CrossMark x={flash.to.x} y={flash.to.y - 60} t={progress(sinceFlash, 0.4, 0.8)} size={36} />}
              {flash.ok && <Sparkles x={flash.to.x} y={flash.to.y} t={progress(sinceFlash, 0.4, 0.9)} radius={60} />}
              {!flash.ok && <Explosion x={flash.to.x} y={flash.to.y} t={progress(sinceFlash, 0.4, 0.9)} size={60} />}
            </>
          )}
          <Label x={640} y={690} text="Click the data center GeoDNS should resolve this user to" size={15} color={C.dim} />
        </Stage>

        <AnimatePresence>
          {flash?.msg && sinceFlash < 2.5 && phase === 'play' && (
            <motion.div key={flash.t0} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-10 left-1/2 w-[90%] max-w-lg -translate-x-1/2 rounded-2xl border border-rose-400/60 bg-slate-950/90 px-4 py-2 text-center text-sm">
              {flash.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {phase !== 'play' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <motion.div key={`${phase}${ri}`} initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-violet-400/40 bg-slate-900 p-6 text-center">
              {phase === 'intro' && (
                <>
                  <h3 className="text-2xl font-black text-violet-300">GeoDNS Router</h3>
                  <p className="mt-2 text-slate-300">You are the geoDNS. Users pop up around the world: click the <b>closest</b> data center for each one before the timer runs out.</p>
                  <button className="mt-4 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950" onClick={() => setPhase('round')} autoFocus>Start</button>
                </>
              )}
              {phase === 'round' && (
                <>
                  <h3 className="text-xl font-black text-violet-300">{round.title}</h3>
                  <p className="mt-2 text-slate-300">
                    {round.down.length ? 'A storm knocked out US-West. Route everyone to the nearest HEALTHY data center, and be quick!' : `${round.users.length} users, ${round.limit} seconds each.`}
                  </p>
                  <button className="mt-4 rounded-2xl bg-violet-400 px-6 py-2 font-bold text-slate-950" onClick={() => { setT0(performance.now() / 1000); setPhase('play'); }} autoFocus>Go!</button>
                </>
              )}
              {phase === 'done' && (
                <>
                  <h3 className="text-2xl font-black text-emerald-300">Traffic routed</h3>
                  <p className="mt-1 text-5xl font-black">{Math.round(score * 100)}%</p>
                  <p className="mt-2 text-slate-300">Nearest data center normally; the healthy one when a region goes dark.</p>
                  <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
