import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MiniGameProps } from '@/types/content';
import { KindIcon } from '@/scenekit';
import { SPOF_DC, SPOF_EDGES, SPOF_IDS, SPOF_NODES } from '../data';

/** (correct marks - wrong marks) / number of SPOFs, clamped to 0..1. */
export function spofScore(marked: string[]): number {
  const hits = marked.filter((m) => SPOF_IDS.includes(m)).length;
  const wrong = marked.length - hits;
  return Math.round(Math.max(0, Math.min(1, (hits - wrong) / SPOF_IDS.length)) * 100) / 100;
}

const byId = Object.fromEntries(SPOF_NODES.map((n) => [n.id, n]));

export default function SpotEverySpof({ onComplete }: MiniGameProps) {
  const [marked, setMarked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const finished = useRef(false);
  const score = spofScore(marked);

  const toggle = (id: string) => {
    if (checked) {
      setInfo(id);
      return;
    }
    setMarked((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onComplete(score);
  };

  const verdict = (id: string) => {
    const isSpof = SPOF_IDS.includes(id);
    const m = marked.includes(id);
    if (!checked) return m ? 'marked' : 'none';
    if (isSpof && m) return 'hit';
    if (isSpof) return 'missed';
    if (m) return 'wrong';
    return 'none';
  };
  const RING: Record<string, string> = { marked: '#fb7185', hit: '#34d399', missed: '#fbbf24', wrong: '#fb7185', none: '#334155' };
  const dcV = verdict(SPOF_DC.id);
  const infoText = info === SPOF_DC.id ? SPOF_DC.why : info ? byId[info]?.why : null;

  return (
    <div className="mx-auto w-full max-w-5xl select-none text-slate-100">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-slate-300">
          {checked ? 'Tap any part to see why.' : 'This is a flawed PixelPost design. Tap every part whose failure alone would take the whole site down. Don\'t forget the building it lives in.'}
        </p>
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-rose-300">💥 {marked.length} marked</div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <svg viewBox="0 0 1100 600" className="w-full">
          <motion.rect
            role="button"
            aria-label={`Mark ${SPOF_DC.label}`}
            onClick={() => toggle(SPOF_DC.id)}
            x={160}
            y={90}
            width={930}
            height={490}
            rx={28}
            fill="transparent"
            stroke={RING[dcV]}
            strokeWidth={dcV === 'none' ? 3 : 6}
            strokeDasharray="14 10"
            className="cursor-pointer"
            animate={dcV === 'marked' ? { strokeDashoffset: [0, -48] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
          <text x={180} y={124} fill={RING[dcV] === '#334155' ? '#94a3b8' : RING[dcV]} fontSize={18} fontWeight={800} className="pointer-events-none">
            {SPOF_DC.label}
          </text>
          {SPOF_EDGES.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} stroke="#334155" strokeWidth={3} />
          ))}
          {SPOF_NODES.map((n) => {
            const v = verdict(n.id);
            return (
              <motion.g
                key={n.id}
                role="button"
                aria-label={`Mark ${n.label}`}
                onClick={() => toggle(n.id)}
                className="cursor-pointer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                animate={v === 'missed' ? { scale: [1, 1.12, 1] } : {}}
                transition={v === 'missed' ? { repeat: Infinity, duration: 0.9 } : undefined}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              >
                <rect x={n.x - 44} y={n.y - 44} width={88} height={88} rx={20} fill="#0f172a" stroke={RING[v]} strokeWidth={v === 'none' ? 2 : 5} />
                <g transform={`translate(${n.x} ${n.y})`}>
                  <KindIcon kind={n.kind} size={54} />
                </g>
                <text x={n.x} y={n.y + 66} textAnchor="middle" fill="#e2e8f0" fontSize={15} fontWeight={700}>
                  {n.label}
                </text>
                {(v === 'marked' || v === 'hit' || v === 'wrong') && (
                  <text x={n.x + 38} y={n.y - 30} fontSize={26}>
                    {v === 'hit' ? '✅' : v === 'wrong' ? '❌' : '💥'}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      <AnimatePresence mode="wait">
        {infoText && (
          <motion.p key={info} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-200">
            {infoText}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="mt-4 flex items-center justify-between gap-3">
        {checked ? (
          <>
            <div>
              <span className="text-4xl font-black text-white">{Math.round(score * 100)}%</span>
              <span className="ml-3 text-sm text-slate-400">
                ✅ found · <span className="text-amber-300">pulsing = missed</span> · ❌ not a SPOF
              </span>
            </div>
            <button className="rounded-2xl bg-emerald-400 px-6 py-2 font-bold text-slate-950 hover:bg-emerald-300" onClick={finish} autoFocus>
              Finish
            </button>
          </>
        ) : (
          <button className="ml-auto rounded-2xl bg-rose-400 px-6 py-2 font-bold text-slate-950 hover:bg-rose-300" onClick={() => setChecked(true)}>
            Check my answer
          </button>
        )}
      </div>
    </div>
  );
}
