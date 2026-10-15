import { lazy, Suspense } from 'react';
import type { SimConfig } from '@/types/content';
import type { SimRunnerProps as RunnerProps } from '../sim/SimRunner';
import { Card } from '@/components/ui';

/** The shell consumes only these fields from the full simulator result. */
export interface SimRunResult {
  goalsMet?: boolean;
  withinBudget?: boolean;
  xp?: number;
  passed?: boolean;
  cost?: number;
  livesLeft?: number;
  stars?: number;
}

export interface SimRunnerProps extends Pick<RunnerProps, 'tasks' | 'hints' | 'hintsUsed' | 'onHint' | 'onLifeLost' | 'onRetry'> {
  config: SimConfig;
  mode: 'lab' | 'mission';
  onFinish: (result: SimRunResult) => void;
}

/** Load the real simulator on demand; the module is a required dependency. */
const LazySimRunner = lazy(() => import('@/sim').then(m => ({ default: m.SimRunner })));

export function SimRunnerBridge(props: SimRunnerProps) {
  return (
    <Suspense fallback={<Card className="flex items-center justify-center py-16 text-slate-500">Booting the simulator&hellip;</Card>}>
      <LazySimRunner {...props} />
    </Suspense>
  );
}
