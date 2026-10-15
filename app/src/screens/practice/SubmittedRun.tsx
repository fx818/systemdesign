import type { SyntheticEvent } from 'react';
import { SimRunner, type SimResult } from '@/sim';
import type { SimConfig } from '@/types/content';

/** Freeze the submitted diagram, so the simulator and structural rubric assess the same graph.
 * The public runner has no controlled graph prop; all editing happens on the preceding ArchCanvas. */
export function SubmittedRun({ config, onFinish }: { config: SimConfig; onFinish: (result: SimResult) => void }) {
  const blockEdit = (event: SyntheticEvent) => {
    if (event.type === 'keydown' && 'key' in event && event.key === 'Tab') return;
    if (event.target instanceof Element && event.target.closest('svg[aria-label="System architecture"]')) {
      event.preventDefault(); event.stopPropagation();
    }
  };
  return <div onPointerDownCapture={blockEdit} onClickCapture={blockEdit} onKeyDownCapture={blockEdit}>
    <p className="mb-3 text-sm text-slate-400">Testing your submitted design. Return to the editor to change its architecture.</p>
    <SimRunner config={config} mode="mission" onFinish={onFinish} />
  </div>;
}
