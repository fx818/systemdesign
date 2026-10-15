import { levelMetas, loadLevel } from '@/content/registry';
import { nextLevel } from '@/game/unlocks';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LEVEL_STEPS, useGame, type StepId } from '@/game';
import type { LevelDef } from '@/types/content';
import { Card, Icon, StarRow } from '@/components/ui';
import { LevelGate } from './common';
import { formatUsers } from './format';

interface StepMeta {
  id: StepId;
  label: string;
  icon: string;
  blurb: string;
}

const STEPS: StepMeta[] = [
  { id: 'incident', label: 'Incident', icon: 'siren', blurb: 'The pager goes off. Something is on fire.' },
  { id: 'lesson', label: 'Briefing', icon: 'clapperboard', blurb: 'Ravi explains the building block, animated.' },
  { id: 'lab', label: 'Lab', icon: 'flask-conical', blurb: 'Break it on purpose in the sandbox.' },
  { id: 'minigame', label: 'Mini-game', icon: 'gamepad-2', blurb: 'A quick drill to make it stick.' },
  { id: 'mission', label: 'Mission', icon: 'rocket', blurb: 'Fix the live system under real traffic.' },
  { id: 'quiz', label: 'Interview', icon: 'mic', blurb: "Ravi's interview round. Answer sharp." },
  { id: 'debrief', label: 'Debrief', icon: 'trophy', blurb: 'Stars, XP, badge, and a new map piece.' },
];

function routeFor(level: LevelDef, step: StepId): string {
  if (step === 'minigame') {
    const mg = level.miniGames[0];
    return mg ? `/level/${level.id}/minigame/${mg.id}` : `/level/${level.id}`;
  }
  return `/level/${level.id}/${step}`;
}

export function LevelHubScreen() {
  return (
    <LevelGate>
      {(level) => <LevelHub level={level} />}
    </LevelGate>
  );
}

function LevelHub({ level }: { level: LevelDef }) {
  const navigate = useNavigate();
  const progress = useGame((s) => s.progress[level.id]);
  const completeStep = useGame((s) => s.completeStep);

  useEffect(() => {
    const next = nextLevel(levelMetas, level.id);
    if (next) void loadLevel(next.id).catch(() => { /* Optional prefetch; routes can retry. */ });
  }, [level.id]);

  const done = new Set(progress?.completedSteps ?? []);
  const hasMiniGames = level.miniGames.length > 0;

  // No mini-game in this level -> the step auto-clears so the flow never stalls.
  useEffect(() => {
    if (!hasMiniGames && !done.has('minigame')) completeStep(level.id, 'minigame');
  }, [hasMiniGames, done, completeStep, level.id]);

  const firstOpenIdx = LEVEL_STEPS.findIndex((s) => !done.has(s));
  const stepState = (idx: number, id: StepId): 'done' | 'current' | 'locked' => {
    if (done.has(id)) return 'done';
    if (idx === firstOpenIdx) return 'current';
    return 'locked';
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <header>
        <Link to="/" className="text-xs text-slate-500 hover:text-cyan-300">
          &larr; HQ
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black text-slate-50">
            <span className="mr-2 font-mono text-cyan-300">{level.id}</span>
            {level.title}
          </h1>
          <StarRow value={progress?.stars ?? 0} size={18} />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {level.subtitle} &middot; {formatUsers(level.users)} users &middot; book pages {level.pages[0]}-{level.pages[1]}
        </p>
      </header>

      <Card padded={false} className="overflow-hidden">
        <ol>
          {STEPS.map((step, idx) => {
            const state = stepState(idx, step.id);
            const clickable = state !== 'locked';
            return (
              <li key={step.id} className="relative">
                {idx < STEPS.length - 1 && (
                  <span className="absolute top-12 left-[27px] h-[calc(100%-3rem)] w-0.5 bg-slate-800" aria-hidden />
                )}
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  disabled={!clickable}
                  onClick={() => clickable && navigate(routeFor(level, step.id))}
                  className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors ${
                    clickable ? 'hover:bg-slate-800/50' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <span
                    className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                      state === 'done'
                        ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
                        : state === 'current'
                          ? 'border-cyan-400/80 bg-cyan-400/10 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                          : 'border-slate-700 bg-slate-900 text-slate-600'
                    }`}
                  >
                    {state === 'done' ? <Check size={18} /> : state === 'locked' ? <Lock size={15} /> : <Icon name={step.icon} size={18} />}
                  </span>
                  <span className="flex-1">
                    <span className={`block font-bold ${state === 'locked' ? 'text-slate-500' : 'text-slate-100'}`}>
                      {step.label}
                      {state === 'current' && (
                        <span className="ml-2 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] tracking-widest text-cyan-300 uppercase">
                          up next
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-500">{step.blurb}</span>
                  </span>
                  {clickable && <ChevronRight size={18} className="text-slate-600 group-hover:text-cyan-300" />}
                </motion.button>

                {/* minigame chips when the level ships several */}
                {step.id === 'minigame' && level.miniGames.length > 1 && state !== 'locked' && (
                  <div className="flex flex-wrap gap-2 pr-4 pb-3 pl-18">
                    {level.miniGames.map((mg) => (
                      <Link
                        key={mg.id}
                        to={`/level/${level.id}/minigame/${mg.id}`}
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"
                      >
                        {mg.title}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
