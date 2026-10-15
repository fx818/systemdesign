import { Flame, RotateCcw, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { levels } from '@/content/registry';
import { completedCount, rankProgress, useGame } from '@/game';
import { BadgeChip, Button, Card, ProgressBar, StarRow } from '@/components/ui';

/** `/profile` — rank, stats and the badge collection. */
export function ProfileScreen() {
  const xp = useGame((s) => s.xp);
  const streak = useGame((s) => s.streak);
  const progress = useGame((s) => s.progress);
  const badges = useGame((s) => s.badges);
  const hintsUsed = useGame((s) => s.hintsUsed);
  const lives = useGame((s) => s.lives);
  const credits = useGame((s) => s.credits);
  const resetProgress = useGame((s) => s.resetProgress);

  const { rank, next, ratio } = rankProgress(xp);
  const allBadges = levels.map((l) => l.badge);
  const earnedBadges = allBadges.filter((b) => badges[b.id] !== undefined);
  const totalStars = Object.values(progress).reduce((sum, p) => sum + (p.stars ?? 0), 0);
  const completed = completedCount(levels, progress);
  const totalHints = Object.values(hintsUsed).reduce((sum, n) => sum + n, 0);

  const confirmReset = () => {
    if (window.confirm('Reset all progress, XP, badges and cards? This cannot be undone.')) resetProgress();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-50">Profile</h1>
          <p className="text-sm text-slate-400">Your climb from Intern to Principal Architect.</p>
        </div>
        <Link to="/" className="text-xs text-slate-500 hover:text-cyan-300">
          &larr; HQ
        </Link>
      </header>

      {/* rank */}
      <Card accent="amber">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-2xl font-black text-amber-300">{rank.name}</span>
          <span className="font-mono text-xs text-slate-500">
            {xp} XP{next ? ` / ${next.minXp} to ${next.name}` : ' — max rank'}
          </span>
        </div>
        <ProgressBar value={ratio} color="amber" />
      </Card>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={<Trophy size={18} />} label="Stars" value={`${totalStars} / ${levels.length * 3}`} />
        <StatCard icon={<Zap size={18} />} label="Levels done" value={`${completed} / ${levels.length}`} />
        <StatCard icon={<Flame size={18} />} label="Streak" value={`${streak.count} day${streak.count === 1 ? '' : 's'}`} />
        <StatCard label="Badges" value={`${earnedBadges.length} / ${allBadges.length}`} />
        <StatCard label="Hints used" value={String(totalHints)} />
        <StatCard label="Lives / credits" value={`${lives} / ${credits}`} />
      </div>

      {/* badge collection */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-100">Badge collection</h2>
        {allBadges.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">Badges appear here as the content team ships levels.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {allBadges.map((b) => (
              <BadgeChip
                key={b.id}
                name={b.name}
                icon={b.icon}
                description={b.description}
                earnedAt={badges[b.id]}
                size="lg"
              />
            ))}
          </div>
        )}
      </section>

      {/* recent level stars */}
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-100">Levels</h2>
        <Card padded={false} className="divide-y divide-slate-800">
          {levels.length === 0 && <p className="p-4 text-sm text-slate-400">No levels yet.</p>}
          {levels.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-semibold text-slate-200">
                  <span className="mr-2 font-mono text-xs text-cyan-300">{l.id}</span>
                  {l.title}
                </div>
                <div className="text-xs text-slate-500">{l.subtitle}</div>
              </div>
              <StarRow value={progress[l.id]?.stars ?? 0} size={16} />
            </div>
          ))}
        </Card>
      </section>

      <div className="flex justify-end">
        <Button variant="danger" onClick={confirmReset}>
          <RotateCcw size={15} /> Reset progress
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black text-slate-100 tabular-nums">{value}</div>
    </Card>
  );
}
