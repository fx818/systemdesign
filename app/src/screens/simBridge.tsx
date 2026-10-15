import { Component, lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import type { SimConfig } from '@/types/content';
import { Card } from '@/components/ui';

/** Loose result shape — OC-sim owns the exact type; the shell only needs these. */
export interface SimRunResult {
  goalsMet?: boolean;
  withinBudget?: boolean;
  xp?: number;
  [key: string]: unknown;
}

export interface SimRunnerProps {
  config: SimConfig;
  mode: 'lab' | 'mission';
  onFinish: (result: SimRunResult) => void;
}

/**
 * Lazy bridge to `@/sim` (owned by OC-sim). If the module is not present at
 * runtime the ErrorBoundary renders a placeholder instead of crashing the app.
 */
const LazySimRunner = lazy(() =>
  import('@/sim').then((m) => ({
    default: (m as Record<string, unknown>).SimRunner as ComponentType<SimRunnerProps>,
  })),
);

interface BoundaryState {
  failed: boolean;
}

class SimErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <SimPlaceholder />;
    return this.props.children;
  }
}

function SimPlaceholder() {
  return (
    <Card accent="amber" className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="text-3xl">🛠️</div>
      <h2 className="text-lg font-bold text-slate-100">Simulator module not installed yet</h2>
      <p className="max-w-md text-sm text-slate-400">
        The simulation engine (<code>@/sim</code>) is being built by another team. Once it lands this screen lights
        up with live traffic, meters and failure events.
      </p>
    </Card>
  );
}

export function SimRunnerBridge(props: SimRunnerProps) {
  return (
    <SimErrorBoundary>
      <Suspense
        fallback={
          <Card className="flex items-center justify-center py-16 text-slate-500">Booting the simulator&hellip;</Card>
        }
      >
        <LazySimRunner {...props} />
      </Suspense>
    </SimErrorBoundary>
  );
}
