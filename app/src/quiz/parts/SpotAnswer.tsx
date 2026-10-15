/** spot: click the right node(s) on a mini architecture diagram. */
import type { QuizQuestion } from '@/types/content';
import { MiniDiagram, type MiniDiagramReveal } from '../MiniDiagram';

export interface SpotAnswerProps {
  question: Extract<QuizQuestion, { kind: 'spot' }>;
  value: { kind: 'spot'; nodeIds: string[] } | null;
  onChange: (v: { kind: 'spot'; nodeIds: string[] }) => void;
  locked: boolean;
}

export function SpotAnswer({ question, value, onChange, locked }: SpotAnswerProps) {
  const picked = value?.kind === 'spot' ? value.nodeIds : [];

  const toggle = (nodeId: string) => {
    if (locked) return;
    const next = picked.includes(nodeId)
      ? picked.filter((n) => n !== nodeId)
      : [...picked, nodeId];
    onChange({ kind: 'spot', nodeIds: next });
  };

  const reveal: MiniDiagramReveal | null = locked
    ? { correct: question.answers, wrong: picked.filter((n) => !question.answers.includes(n)) }
    : null;

  return (
    <div className="flex flex-col gap-2">
      <MiniDiagram
        graph={question.diagram}
        selectedIds={picked}
        onNodeClick={toggle}
        reveal={reveal}
      />
      {!locked && (
        <p className="text-xs text-slate-500">
          {question.answers.length > 1
            ? 'Tap every node that applies.'
            : 'Tap the node that answers the question.'}
        </p>
      )}
    </div>
  );
}
