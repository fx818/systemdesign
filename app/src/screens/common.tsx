import { Fragment, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLevelMeta, levelMetas, useLevel } from '@/content/registry';
import { isLevelUnlocked, useGame } from '@/game';
import type { LevelDef } from '@/types/content';
import { LevelLoading } from '@/components/ui/LevelLoading';
import { Button, Card } from '@/components/ui';

/**
 * Route gate for `/level/:id/*` pages: resolves the level from the registry and
 * renders a friendly placeholder while content has not landed (the app must
 * keep working with zero levels present).
 */
export function LevelGate({ children }: { children: (level: LevelDef) => ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const progress = useGame((s) => s.progress);
  const meta = id ? getLevelMeta(id) : undefined;
  const unlocked = meta !== undefined && isLevelUnlocked(meta, levelMetas, progress);
  const { level, loading, error } = useLevel(id, unlocked);
  if (!meta) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <Card accent="amber" className="flex flex-col items-center gap-3">
          <div className="text-4xl">🚧</div>
          <h1 className="text-xl font-bold text-slate-100">Level {id} is still under construction</h1>
          <p className="text-sm text-slate-400">
            The content team is still writing this chapter. Check the level path for what is already playable.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm">
              Back to HQ
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  if (!unlocked) {
    return <Card className="mx-auto max-w-lg text-center">
      <h1 className="text-xl font-bold text-slate-100">Level locked</h1>
      <p className="my-3 text-slate-400">Earn a star in the preceding missions to unlock {meta.title}.</p>
      <Link to="/">Back to HQ</Link>
    </Card>;
  }
  if (loading || error) return <LevelLoading id={meta.id} error={error} />;
  if (!level) return null;
  return <Fragment key={level.id}>{children(level)}</Fragment>;
}
