import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import {
  TIERS, WALL_BUDGET, WALL_SERVER_CAPACITY, WALL_SERVER_COST, WALL_TIER_CAPACITY, WALL_UPGRADE_COST, WAVES, type Wave,
} from '../data';

export interface WallState {
  tier: number;      // 0..3, upgrades of server 1
  extra: number;     // extra servers added (scale out)
  spent: number;
  wave: number;      // index of the next wave to run
  results: boolean[];
}

export const initialWall: WallState = { tier: 0, extra: 0, spent: 0, wave: 0, results: [] };
export const MAX_TIER = WALL_TIER_CAPACITY.length - 1;

/** Capacity (rps) of the whole setup; server 1 contributes nothing if it crashed. */
export function wallCapacity(s: Pick<WallState, 'tier' | 'extra'>, crashed = false): number {
  return (crashed ? 0 : WALL_TIER_CAPACITY[s.tier]) + s.extra * WALL_SERVER_CAPACITY;
}
export const canUpgrade = (s: WallState) => s.tier < MAX_TIER && s.spent + WALL_UPGRADE_COST[s.tier] <= WALL_BUDGET;
export const canAdd = (s: WallState) => s.spent + WALL_SERVER_COST <= WALL_BUDGET;

export function upgrade(s: WallState): WallState {
  return canUpgrade(s) ? { ...s, tier: s.tier + 1, spent: s.spent + WALL_UPGRADE_COST[s.tier] } : s;
}
export function addServer(s: WallState): WallState {
  return canAdd(s) ? { ...s, extra: s.extra + 1, spent: s.spent + WALL_SERVER_COST } : s;
}
export function waveSurvived(s: WallState, w: Wave): boolean {
  return wallCapacity(s, w.crash) >= w.rps;
}
export function runWave(s: WallState): WallState {
  const w = WAVES[s.wave];
  if (!w) return s;
  return { ...s, wave: s.wave + 1, results: [...s.results, waveSurvived(s, w)] };
}
export const wallScore = (s: WallState) => Math.round((s.results.filter(Boolean).length / WAVES.length) * 100) / 100;

type Phase = 'build' | 'running' | 'result' | 'done';

export default function HardwareWall({ onComplete }: MiniGameProps) {
  const [s, setS] = useState<WallState>(initialWall);
  const [phase, setPhase] = useState<Phase>('build');
  const [wall, setWall] = useState(false);
  const finished = useRef(false);
  const wave = WAVES[Math.min(s.wave, WAVES.length - 1)];
  const lastResult = s.results[s.results.length - 1];
  const shownWave = phase === 'result' ? WAVES[s.wave - 1] : wave;
  const cap = wallCapacity(s, phase !== 'build' && shownWave.crash);
  const fill = Math.min(1.3, shownWave.rps / Math.max(1, cap));

  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setTimeout(() => {
      setS((cur) => runWave(cur));
      setPhase('result');
    }, 1400);
    return () => window.clearTimeout(id);
  }, [phase]);

  const tryUpgrade = () => {
    if (s.tier >= MAX_TIER) {
      setWall(true);
      window.setTimeout(() => setWall(false), 900);
      return;
    }
    setS(upgrade);
  };
  const nextWave = () => setPhase(s.wave >= WAVES.length ? 'done' : 'build');
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(wallScore(s));
  };

  const servers = [{ main: true }, ...Array.from({ length: s.extra }, () => ({ main: false }))];
  const crashedNow = phase !== 'build' && shownWave.crash;

  return (
    <div className="mx-auto w-full max-w-4xl select-none text-slate-100">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {WAVES.map((_, i) => (
          <div key={i} className={`rounded-xl px-3 py-1 text-xs font-bold ${
            s.results[i] === true ? 'bg-emerald-400/20 text-emerald-300' : s.results[i] === false ? 'bg-rose-400/20 text-rose-300' : i === s.wave ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-900 text-slate-500'}`}>
            Wave {i + 1}
          </div>
        ))}
        <div className="ml-auto rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-amber-300">
          💳 {WALL_BUDGET - s.spent} / {WALL_BUDGET} credits
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 md:grid-cols-[1fr_280px]">
        {/* arena */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-violet-300">{phase === 'done' ? 'All waves done' : `Wave ${Math.min(s.wave + (phase === 'result' ? 0 : 1), WAVES.length)}`}</div>
          <h3 className="text-2xl font-black text-white">{shownWave.label}</h3>
          <p className="text-sm text-slate-400">{shownWave.rps.toLocaleString('en-US')} requests/sec incoming</p>

          <div className="relative mt-4 flex min-h-[170px] flex-wrap items-end gap-3 rounded-2xl border border-dashed border-slate-700 p-4">
            <AnimatePresence>
              {wall && (
                <motion.div key="wall" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute inset-x-4 top-2 rounded-xl border-2 border-rose-400 bg-rose-400/15 py-1 text-center text-sm font-black text-rose-300">
                  🧱 HARDWARE WALL: no bigger server exists
                </motion.div>
              )}
            </AnimatePresence>
            {servers.map((srv, i) => {
              const dead = srv.main && crashedNow;
              const size = srv.main ? 70 + s.tier * 22 : 64;
              return (
                <motion.div key={i} layout initial={{ scale: 0 }} animate={dead ? { scale: 1, rotate: [0, -8, 8, 0], opacity: 0.35 } : { scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 text-center ${dead ? 'border-slate-600 bg-slate-800' : srv.main ? 'border-cyan-400 bg-cyan-400/10' : 'border-violet-400 bg-violet-400/10'}`}
                  style={{ width: size, height: size }}>
                  <span className="text-2xl">{dead ? '💥' : '🖥️'}</span>
                  <span className="text-[10px] font-bold text-slate-300">{srv.main ? TIERS[s.tier].name : `+1`}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
              <span>Load vs capacity</span>
              <span>{cap.toLocaleString('en-US')} rps capacity</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-800">
              <motion.div className={`h-full ${fill > 1 ? 'bg-rose-400' : fill > 0.8 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                initial={false} animate={{ width: `${Math.min(100, (phase === 'build' ? 0 : fill) * 100)}%` }} transition={{ duration: phase === 'running' ? 1.2 : 0.3 }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'result' && (
              <motion.div key={`r${s.wave}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className={`mt-4 rounded-2xl border-2 p-4 ${lastResult ? 'border-emerald-400 bg-emerald-400/10' : 'border-rose-400 bg-rose-400/10'}`}>
                <div className={`text-xl font-black ${lastResult ? 'text-emerald-300' : 'text-rose-300'}`}>{lastResult ? 'Survived!' : 'Outage!'}</div>
                <p className="text-sm text-slate-200">
                  {shownWave.crash
                    ? lastResult ? 'Server 1 died, but the other servers carried the load. Redundancy!' : 'Server 1 died and there was not enough else to take over. No failover.'
                    : lastResult ? 'Capacity held.' : s.tier >= MAX_TIER ? 'Even the biggest box was not enough. That is the hard limit.' : 'Not enough capacity for this wave.'}
                </p>
                <button className="mt-3 w-full rounded-2xl bg-white/90 py-2 font-bold text-slate-950" onClick={nextWave} autoFocus>
                  {s.wave >= WAVES.length ? 'See results' : 'Prepare next wave'}
                </button>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 text-center">
                <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-6xl font-black text-white">
                  {s.results.filter(Boolean).length}/{WAVES.length}
                </motion.p>
                <p className="mt-1 text-sm text-slate-400">waves survived · {s.spent} credits spent</p>
                <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950" onClick={finish} autoFocus>Finish</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="flex flex-col gap-3">
          <button onClick={tryUpgrade} disabled={phase !== 'build' || (s.tier < MAX_TIER && !canUpgrade(s))}
            className="rounded-2xl border-2 border-cyan-400/60 bg-cyan-400/10 p-3 text-left hover:bg-cyan-400/20 disabled:opacity-40">
            <div className="font-black text-cyan-300">⬆ Upgrade server 1</div>
            <div className="text-xs text-slate-400">
              {s.tier >= MAX_TIER ? 'Already the biggest box' : `→ ${TIERS[s.tier + 1].name}: ${WALL_TIER_CAPACITY[s.tier + 1]} rps · ${WALL_UPGRADE_COST[s.tier]} credits`}
            </div>
          </button>
          <button onClick={() => setS(addServer)} disabled={phase !== 'build' || !canAdd(s)}
            className="rounded-2xl border-2 border-violet-400/60 bg-violet-400/10 p-3 text-left hover:bg-violet-400/20 disabled:opacity-40">
            <div className="font-black text-violet-300">➕ Add a server</div>
            <div className="text-xs text-slate-400">+{WALL_SERVER_CAPACITY} rps · {WALL_SERVER_COST} credits</div>
          </button>
          <button onClick={() => setPhase('running')} disabled={phase !== 'build'}
            className="mt-auto rounded-2xl bg-amber-400 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-40">
            ▶ Run wave
          </button>
          <p className="text-xs text-slate-500">Tip: each upgrade costs twice the last one, and the top tier is a wall. Watch for wave 5.</p>
        </div>
      </div>
    </div>
  );
}
