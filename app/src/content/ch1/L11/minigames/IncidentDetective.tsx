import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { DASH_SERIES, HOSTS, HOST_METRICS, LOGS, SUSPECTS, type HostId, type LogLevel } from '../data';

type Tab = 'logs' | 'hosts' | 'dash';
interface Evidence {
  id: string;
  text: string;
  clue: boolean;
}

/** 0..1: start at 1, -0.3 per wrong accusation, -0.2 if you accused without pinning any real clue. */
export function detectiveScore(wrong: number, cluesPinned: number): number {
  const s = 1 - 0.3 * wrong - (cluesPinned > 0 ? 0 : 0.2);
  return Math.round(Math.max(0.1, Math.min(1, s)) * 100) / 100;
}

const LEVEL_STYLE: Record<LogLevel, string> = {
  INFO: 'text-slate-400',
  WARN: 'text-amber-300',
  ERROR: 'text-rose-300',
};

function Chart({ values, color, max = 100, unit = '%' }: { values: number[]; color: string; max?: number; unit?: string }) {
  const hi = Math.max(max, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 200},${60 - (v / hi) * 56}`).join(' ');
  const last = values[values.length - 1];
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="-4 -4 208 68" className="h-16 w-full max-w-[220px]">
        <rect x={-4} y={-4} width={208} height={68} rx={8} fill="#1e293b" opacity={0.6} />
        <motion.polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <span className="w-16 text-right font-mono text-sm font-bold" style={{ color }}>
        {last}
        {unit}
      </span>
    </div>
  );
}

export default function IncidentDetective({ onComplete }: MiniGameProps) {
  const [tab, setTab] = useState<Tab>('logs');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [host, setHost] = useState<HostId>('web-1');
  const [inspected, setInspected] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [struck, setStruck] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(0);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const finished = useRef(false);

  const logs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOGS.filter(
      (l) => (level === 'ALL' || l.level === level) && (!q || `${l.ts} ${l.host} ${l.level} ${l.msg}`.toLowerCase().includes(q)),
    );
  }, [query, level]);

  const cluesPinned = evidence.filter((e) => e.clue).length;
  const score = detectiveScore(struck.length, cluesPinned);

  const pin = (e: Evidence) => setEvidence((ev) => (ev.some((x) => x.id === e.id) ? ev.filter((x) => x.id !== e.id) : [...ev, e].slice(-6)));
  const pinned = (id: string) => evidence.some((e) => e.id === id);

  const accuse = (id: string) => {
    if (solved || struck.includes(id)) return;
    const s = SUSPECTS.find((x) => x.id === id);
    if (!s) return;
    if (s.correct) setSolved(true);
    else {
      setStruck((x) => [...x, id]);
      setLastWrong(id);
      setShake((n) => n + 1);
    }
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      {/* case header */}
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3"
      >
        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} className="text-2xl">
          📟
        </motion.span>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-300">Case file · 03:04 AM</div>
          <div className="font-black text-white">About a third of photo uploads are failing. Find the root cause.</div>
        </div>
        <div className="rounded-xl bg-slate-950/60 px-3 py-1 text-sm font-bold text-amber-300">Wrong guesses: {struck.length}</div>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* investigation */}
        <div className="min-h-[420px] rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
          <div className="mb-3 flex gap-2">
            {tabBtn('logs', '📜 Central logs')}
            {tabBtn('hosts', '🖥️ Host metrics')}
            {tabBtn('dash', '📊 Dashboards')}
          </div>
          <AnimatePresence mode="wait">
            {tab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-2 flex flex-wrap gap-2">
                  <input
                    aria-label="Search logs"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="search: host, level, text…"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400"
                  />
                  {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${level === l ? 'bg-violet-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="max-h-[330px] space-y-1 overflow-auto pr-1">
                  {logs.length === 0 && <p className="p-4 text-center text-slate-500">No log lines match.</p>}
                  {logs.map((l) => {
                    const id = `log-${l.ts}-${l.host}`;
                    return (
                      <motion.div
                        layout
                        key={id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 font-mono text-xs ${pinned(id) ? 'bg-cyan-400/15 ring-1 ring-cyan-400' : 'bg-slate-900/60'}`}
                      >
                        <span className="text-slate-500">{l.ts}</span>
                        <span className="w-14 text-sky-300">{l.host}</span>
                        <span className={`w-12 font-bold ${LEVEL_STYLE[l.level]}`}>{l.level}</span>
                        <span className="flex-1 text-slate-200">{l.msg}</span>
                        <button
                          aria-label={`Pin log ${l.ts} ${l.host}`}
                          onClick={() => pin({ id, text: `${l.host}: ${l.msg}`, clue: Boolean(l.clue) })}
                          className="rounded-md px-1 text-base hover:bg-slate-700"
                        >
                          {pinned(id) ? '📌' : '📍'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {tab === 'hosts' && (
              <motion.div key="hosts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-3 flex flex-wrap gap-2">
                  {HOSTS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHost(h)}
                      className={`rounded-xl px-3 py-2 font-mono text-sm font-bold ${host === h ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <p className="mb-2 text-xs text-slate-400">Host-level metrics, 03:00 to 03:11. One machine at a time.</p>
                <div className="space-y-3">
                  {(['cpu', 'mem', 'disk'] as const).map((m) => {
                    const vals = HOST_METRICS[host][m];
                    const id = `host-${host}-${m}`;
                    const clue = host === 'web-3' && m === 'disk';
                    const label = m === 'cpu' ? 'CPU' : m === 'mem' ? 'Memory' : 'Disk used';
                    return (
                      <div key={id} className={`flex items-center gap-3 rounded-xl p-2 ${pinned(id) ? 'bg-cyan-400/10 ring-1 ring-cyan-400' : 'bg-slate-900/50'}`}>
                        <span className="w-20 text-sm font-bold text-slate-300">{label}</span>
                        <div className="flex-1">
                          <Chart key={id} values={vals} color={vals[vals.length - 1] >= 95 ? '#fb7185' : m === 'cpu' ? '#22d3ee' : m === 'mem' ? '#a78bfa' : '#34d399'} />
                        </div>
                        <button
                          aria-label={`Pin ${host} ${label}`}
                          onClick={() => pin({ id, text: `${host} ${label}: ${vals[0]}% → ${vals[vals.length - 1]}%`, clue })}
                          className="rounded-md px-1 text-base hover:bg-slate-700"
                        >
                          {pinned(id) ? '📌' : '📍'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {tab === 'dash' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3 sm:grid-cols-2">
                {DASH_SERIES.map((s) => {
                  const id = `dash-${s.id}`;
                  const open = inspected.includes(s.id);
                  return (
                    <div key={s.id} className={`rounded-xl p-3 ${pinned(id) ? 'bg-cyan-400/10 ring-1 ring-cyan-400' : 'bg-slate-900/60'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{s.title}</span>
                        <span className={`rounded-full px-2 text-[10px] font-bold uppercase ${s.kind === 'business' ? 'bg-amber-400/20 text-amber-200' : 'bg-violet-400/20 text-violet-200'}`}>
                          {s.kind}
                        </span>
                      </div>
                      <Chart values={s.values} color={s.id === 'err' || s.id === 'up' ? '#fbbf24' : '#a78bfa'} max={0} unit={s.unit} />
                      <div className="mt-1 flex items-center gap-2">
                        {open ? (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 text-xs text-slate-300">
                            {s.note}
                          </motion.p>
                        ) : (
                          <button onClick={() => setInspected((x) => [...x, s.id])} className="flex-1 rounded-lg bg-slate-800 py-1 text-xs font-bold text-cyan-300 hover:bg-slate-700">
                            Inspect
                          </button>
                        )}
                        <button aria-label={`Pin ${s.title}`} onClick={() => pin({ id, text: `${s.title}: ${s.note}`, clue: false })} className="rounded-md px-1 hover:bg-slate-700">
                          {pinned(id) ? '📌' : '📍'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* evidence + suspects */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Evidence board ({evidence.length})</div>
            {evidence.length === 0 && <p className="text-xs text-slate-500">Pin log lines and charts with 📍 to build your case.</p>}
            <ul className="space-y-1">
              <AnimatePresence>
                {evidence.map((e) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, x: 30, rotate: 4 }}
                    animate={{ opacity: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-slate-900 shadow"
                  >
                    {e.text}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-300">Suspects</div>
            <div className="space-y-2">
              {SUSPECTS.map((s) => {
                const out = struck.includes(s.id);
                const win = solved && s.correct;
                return (
                  <motion.button
                    key={s.id}
                    aria-label={`Accuse: ${s.title}`}
                    whileHover={!out && !solved ? { scale: 1.02 } : {}}
                    whileTap={!out && !solved ? { scale: 0.97 } : {}}
                    onClick={() => accuse(s.id)}
                    disabled={out || solved}
                    className={`w-full rounded-xl border p-2 text-left transition ${
                      win ? 'border-emerald-400 bg-emerald-400/15' : out ? 'border-slate-700 bg-slate-900 opacity-50 line-through' : 'border-slate-700 bg-slate-950 hover:border-rose-400'
                    }`}
                  >
                    <div className="text-sm font-bold">{s.title}</div>
                    <div className="text-xs text-slate-400">{s.detail}</div>
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {lastWrong && !solved && (
                <motion.p key={lastWrong} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 rounded-lg bg-rose-400/10 p-2 text-xs text-rose-200">
                  ✗ {SUSPECTS.find((s) => s.id === lastWrong)?.rebuttal}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-4 rounded-2xl border-2 border-emerald-400 bg-emerald-400/10 p-5 text-center"
          >
            <div className="text-sm font-bold uppercase tracking-widest text-emerald-300">Case closed</div>
            <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }} className="text-5xl font-black text-white">
              {Math.round(score * 100)}%
            </motion.div>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-200">{SUSPECTS.find((s) => s.correct)?.rebuttal}</p>
            {cluesPinned === 0 && <p className="mt-1 text-xs text-amber-300">Tip: pin real evidence (the disk chart or the "no space" errors) before accusing for full marks.</p>}
            <p className="mt-1 text-xs text-slate-400">Central logs found the error, host metrics found the machine, dashboards showed the business impact.</p>
            <button className="mt-4 rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
              Finish
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
