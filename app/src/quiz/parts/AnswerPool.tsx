import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/** Must render beneath DndContext so the return-to-pool target is registered. */
export function AnswerPool({ children, label, testId }: { children: ReactNode; label: string; testId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });
  return <div
    ref={setNodeRef}
    aria-label={label}
    data-testid={testId}
    className={clsx('flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors',
      isOver ? 'border-violet-400 bg-violet-400/10' : 'border-slate-700 bg-slate-950/40')}
  >{children}</div>;
}
