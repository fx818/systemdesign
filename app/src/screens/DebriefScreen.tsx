import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { levels } from '@/content/registry';
import { computeStars, isLevelUnlocked, nextLevel, useGame } from '@/game';
import type { LevelDef } from '@/types/content';
import { BadgeChip, Button, Card, Modal, StarRow } from '@/components/ui';
import { Dialogue } from './Dialogue';
import { LevelGate } from './common';
import { formatUsers, useCountUp } from './format';
import { ArchitectureMap } from './ArchitectureMap';

const CONFETTI_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];

/** Framer-motion confetti burst — no extra deps. */
function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: 260 + Math.random() * 260,
        rotate: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 7,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-[1px]"
          style={{ left: '50%', top: '10%', width: p.size, height: p.size * 0.42, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ delay: p.delay, duration: p.duration, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/** `/level/:id/debrief` — stars, XP count-up, badge + confetti, next map node. */
export function DebriefScreen() {
  return (
    <LevelGate>
      {(level) => <Debrief level={level} />}
    </LevelGate>
  );
}

function Debrief({ level }: { level: LevelDef }) {
  const navigate = useNavigate();
  const progress = useGame((s) => s.progress[level.id]);
  const missionResult = useGame((s) => s.missionResults[level.id]);
  const quizResult = useGame((s) => s.quizResults[level.id]);
  const allProgress = useGame((s) => s.progress);
  const hintsUsed = useGame((s) => s.hintsUsed[level.id] ?? 0);
  const setStars = useGame((s) => s.setStars);
  const awardBadge = useGame((s) => s.awardBadge);
  const ingestCards = useGame((s) => s.ingestCards);
  const addXp = useGame((s) => s.addXp);
  const completeStep = useGame((s) => s.completeStep);

  const alreadyDone = progress?.completedSteps.includes('debrief') ?? false;
  const [dialogueDone, setDialogueDone] = useState(alreadyDone || level.debrief.length === 0);
  const [showBadge, setShowBadge] = useState(false);

  const stars = useMemo(
    () =>
      Math.min(missionResult?.stars ?? 3, computeStars({
        goalsMet: missionResult?.goalsMet === true && (progress?.completedSteps.includes('quiz') ?? false),
        withinBudget: missionResult?.withinBudget ?? false,
        quizScore: quizResult?.score ?? progress?.bestQuiz ?? 0,
        hintsUsed,
        heartsLeft: quizResult?.heartsLeft,
      })),
    [missionResult, progress, hintsUsed, quizResult],
  );

  const debriefXp = stars > 0 ? stars * 40 + 20 : 0;
  const [rewardXp, setRewardXp] = useState(0);
  const xpCount = useCountUp(rewardXp);

  const awardedRef = useRef(alreadyDone);
  const finalize = useCallback(() => {
    if (stars === 0) return;
    // Successful retries can improve stars; the completion bonus is one-time.
    setStars(level.id, stars);
    if (awardedRef.current) return;
    awardedRef.current = true;
    awardBadge(level.badge.id);
    ingestCards(level.id, level.cards);
    addXp(debriefXp);
    setRewardXp(debriefXp);
    completeStep(level.id, 'debrief');
    setShowBadge(true);
  }, [stars, level, debriefXp, setStars, awardBadge, ingestCards, addXp, completeStep]);

  useEffect(() => {
    if (dialogueDone) finalize();
  }, [dialogueDone, finalize]);

  const next = nextLevel(levels, level.id);
  const nextUnlocked = next && isLevelUnlocked(next, levels, allProgress);

  return (
    <div className="mx-auto w-full max-w-2xl pb-10">
      {!dialogueDone ? (
        <>
          <header className="mb-4">
            <div className="text-xs font-bold tracking-[0.3em] text-amber-300 uppercase">Debrief</div>
            <h1 className="mt-1 text-2xl font-black text-slate-50">{level.title}</h1>
          </header>
          <Dialogue lines={level.debrief} onDone={() => setDialogueDone(true)} />
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5 text-center">
          <div>
            <div className="text-xs font-bold tracking-[0.3em] text-amber-300 uppercase">{stars > 0 ? 'Mission complete' : 'Keep building'}</div>
            <h1 className="mt-1 text-3xl font-black text-slate-50">{level.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {stars > 0 ? <>PixelPost now serves <span className="font-bold text-cyan-300">{formatUsers(level.users)}</span> users.</> : 'Meet the mission goals and finish the interview to earn your first star.'}
            </p>
          </div>

          <StarRow value={stars} size={44} animate />

          <div className="rounded-2xl bg-amber-400/10 px-6 py-3">
            <span className="text-2xl font-black text-amber-300 tabular-nums">+{Math.round(xpCount)}</span>{' '}
            <span className="text-sm font-semibold text-amber-300/80">XP</span>
          </div>

          {stars > 0 && <Card accent="violet" className="flex w-full flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-violet-300 uppercase">
              <MapPin size={14} /> New on your architecture map
            </div>
            <p className="max-w-md text-sm text-slate-400">
              A new building block joined the map. Revisit it any time from the HQ map to rewatch its lesson.
            </p>
            <ArchitectureMap />
            <Link to="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              View the map &rarr;
            </Link>
          </Card>}

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/level/${level.id}`)}>
              Mission hub
            </Button>
            {stars === 0 && <Button onClick={() => navigate(`/level/${level.id}/mission`)}>Retry mission</Button>}
            {next && nextUnlocked ? (
              <Button onClick={() => navigate(`/level/${next.id}`)}>
                Next level: {next.title} <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => navigate('/')}>Back to HQ</Button>
            )}
          </div>
        </motion.div>
      )}

      {/* badge unlock modal with confetti */}
      <Modal open={showBadge} onClose={() => setShowBadge(false)} widthClass="max-w-sm" dismissable={false}>
        <div className="relative overflow-hidden rounded-xl">
          <AnimatePresence>{showBadge && <Confetti />}</AnimatePresence>
          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="text-xs font-bold tracking-[0.3em] text-violet-300 uppercase">Badge unlocked</div>
            <motion.div initial={{ scale: 0.5, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
              <BadgeChip name={level.badge.name} icon={level.badge.icon} description={level.badge.description} earnedAt={Date.now()} size="lg" />
            </motion.div>
            <p className="text-sm text-slate-400">{level.badge.description}</p>
            <Button variant="violet" className="mt-2 w-full" onClick={() => setShowBadge(false)}>
              Nice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
