import { motion } from 'framer-motion';
import { Flame, Lock, RotateCcw, Skull } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { levels } from '@/content/registry';
import { useGame, isLevelUnlocked, pickFlashback, rankProgress, streakAlive, todayKey } from '@/game';
import type { LevelLike } from '@/game';
import { ProgressBar, StarRow } from '@/components/ui';
import { ArchitectureMap } from './ArchitectureMap';
import { formatUsers, useCountUp } from './format';

const TOTAL_LEVELS = 13;
const levelIdFor = (n: number) => `L${String(n).padStart(2, '0')}`;

function useUserCounter(): number {
  const progress = useGame((s) => s.progress);
  return useMemo(() => {
    let users = 1;
    for (const l of levels) {
      if ((progress[l.id]?.stars ?? 0) >= 1) users = Math.max(users, l.users);
    }
    return users;
  }, [progress]);
}

export function HomeScreen() {
  const navigate = useNavigate();
  const xp = useGame((s) => s.xp);
  const streak = useGame((s) => s.streak);
  const cards = useGame((s) => s.cards);

  const { rank, next, ratio } = rankProgress(xp);
  const targetUsers = useUserCounter();
  const users = useCountUp(targetUsers);
  const today = todayKey();
  const flashback = pickFlashback(cards, today);
  const alive = streakAlive(streak, today);

  // The level path always shows 13 slots; registry levels fill them in.
  const slots: LevelLike[] = useMemo(
    () =>
      Array.from({ length: TOTAL_LEVELS }, (_, i) => {
        const n = i + 1;
        const real = levels.find((l) => l.number === n);
        return real ?? { id: levelIdFor(n), number: n, boss: n === TOTAL_LEVELS ? true : undefined };
      }),
    [],
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ------------------------------- hero ------------------------------- */}
      <section className="bg-grid-neon relative overflow-hidden rounded-2xl border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold tracking-[0.3em] text-cyan-300 uppercase">PixelPost HQ</div>
            <h1 className="mt-2 text-4xl font-black text-slate-50 sm:text-5xl">
              <span className="text-cyan-300 tabular-nums drop-shadow-[0_0_18px_rgba(34,211,238,0.6)]">
                {formatUsers(Math.round(users))}
              </span>{' '}
              users
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              From one server to ten million users. Every outage is a lesson; every lesson is a building block.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* streak */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2">
              <motion.span
                animate={alive ? { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] } : {}}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.4 }}
              >
                <Flame size={22} className={alive ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
              </motion.span>
              <div>
                <div className="text-lg leading-5 font-bold text-slate-100 tabular-nums">{streak.count}</div>
                <div className="text-[10px] tracking-widest text-slate-500 uppercase">day streak</div>
              </div>
            </div>

            {/* flashback */}
            <Link to="/review">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-violet-200"
              >
                <RotateCcw size={18} />
                <div>
                  <div className="text-sm font-semibold">Daily Flashback</div>
                  <div className="text-[10px] text-violet-300/80">
                    {flashback.length > 0 ? `${flashback.length} cards due` : 'all caught up'}
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* rank bar */}
        <div className="mt-6 max-w-xl">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-amber-300">{rank.name}</span>
            <span className="font-mono text-xs text-slate-500">
              {xp} XP{next ? ` / ${next.minXp} to ${next.name}` : ' — max rank'}
            </span>
          </div>
          <ProgressBar value={ratio} color="amber" />
        </div>
      </section>

      {/* ------------------------- architecture map ------------------------- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-slate-100">Architecture map</h2>
          <span className="text-xs text-slate-500">reveals as you ship fixes</span>
        </div>
        <ArchitectureMap />
      </section>

      {/* ----------------------------- level path ---------------------------- */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-100">The road to 10M</h2>
        <LevelPath slots={slots} onPick={(id) => navigate(`/level/${id}`)} />
      </section>
    </div>
  );
}

function LevelPath({ slots, onPick }: { slots: LevelLike[]; onPick: (id: string) => void }) {
  const progress = useGame((s) => s.progress);
  const rowH = 92;

  return (
    <div className="relative mx-auto w-full max-w-xl" style={{ height: slots.length * rowH + 40 }}>
      {/* dashed connector */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {slots.slice(0, -1).map((slot, i) => {
          const x1 = pathX(i);
          const y1 = i * rowH + 46;
          const x2 = pathX(i + 1);
          const y2 = (i + 1) * rowH + 46;
          const lit = isLevelUnlocked(slots[i + 1], slots, progress);
          return (
            <line
              key={slot.id}
              x1={`${x1}%`}
              y1={y1}
              x2={`${x2}%`}
              y2={y2}
              stroke={lit ? 'rgba(34,211,238,0.5)' : 'rgba(51,65,85,0.7)'}
              strokeWidth={3}
              strokeDasharray="7 7"
            />
          );
        })}
      </svg>

      {slots.map((slot, i) => {
        const real = levels.find((l) => l.number === slot.number);
        const unlocked = isLevelUnlocked(slot, slots, progress) && !!real;
        const stars = progress[slot.id]?.stars ?? 0;
        const x = pathX(i);
        const y = i * rowH + 46;
        const boss = !!slot.boss;

        return (
          <motion.div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: y }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <button
              disabled={!unlocked}
              onClick={() => onPick(slot.id)}
              className="group flex flex-col items-center gap-1"
              title={real ? real.title : 'Coming soon'}
            >
              <span
                className={`flex items-center justify-center rounded-full border-2 font-black transition-transform ${
                  boss
                    ? 'h-18 w-18 border-rose-400/70 bg-gradient-to-br from-rose-500/30 to-violet-500/30 text-rose-300 shadow-[0_0_24px_rgba(251,113,133,0.35)]'
                    : 'h-14 w-14'
                } ${
                  unlocked
                    ? 'border-cyan-400/70 bg-slate-900 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.35)] group-hover:scale-110'
                    : 'border-slate-700 bg-slate-900/70 text-slate-600'
                }`}
              >
                {boss ? (
                  <Skull size={26} className={unlocked ? '' : 'opacity-50'} />
                ) : unlocked ? (
                  slot.number
                ) : (
                  <Lock size={18} />
                )}
              </span>
              <span
                className={`max-w-28 text-center text-[11px] leading-tight font-semibold ${
                  unlocked ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {real ? real.title : `Level ${slot.number}`}
              </span>
              <StarRow value={stars} size={13} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Winding path x-position (percent) for row i. */
function pathX(i: number): number {
  return 50 + 30 * Math.sin(i * 0.85);
}
