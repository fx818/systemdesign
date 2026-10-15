/**
 * label: drag labels onto diagram nodes — or tap a label, then tap a node
 * (mobile-friendly fallback). The label pool is shuffled deterministically
 * by question id. Placing a label kicks the previous one back to the pool.
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { clsx } from 'clsx';
import type { QuizQuestion } from '@/types/content';
import { useState } from 'react';
import { MiniDiagram, NODE_DROPPABLE_PREFIX, type MiniDiagramReveal } from '../MiniDiagram';
import { seededShuffle } from '../seeded';

export interface LabelAnswerProps {
  question: Extract<QuizQuestion, { kind: 'label' }>;
  value: { kind: 'label'; assignments: Record<string, string | null> } | null;
  onChange: (v: { kind: 'label'; assignments: Record<string, string | null> }) => void;
  locked: boolean;
}

const POOL_ID = 'pool';

function LabelChip({
  text,
  selected,
  locked,
  onTap,
}: {
  text: string;
  selected: boolean;
  locked: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `label:${text}`,
    disabled: locked,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      data-testid={`label-chip-${text}`}
      aria-pressed={selected}
      className={clsx(
        'touch-manipulation rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        'border-violet-400/60 bg-violet-400/10 text-violet-100 hover:border-violet-300',
        selected && 'border-violet-300 bg-violet-400/30 shadow-[0_0_14px_rgba(167,139,250,0.5)]',
        isDragging && 'z-20 opacity-80 shadow-[0_0_18px_rgba(167,139,250,0.4)]',
      )}
    >
      {text}
    </button>
  );
}

export function LabelAnswer({ question, value, onChange, locked }: LabelAnswerProps) {
  const assignments =
    value?.kind === 'label'
      ? { ...value.assignments }
      : Object.fromEntries(question.labels.map((l) => [l.nodeId, null]));
  const [tapped, setTapped] = useState<string | null>(null);
  const [pool] = useState(() => seededShuffle(question.labels.map((l) => l.text), question.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );

  const assign = (nodeId: string, text: string | null) => {
    if (locked) return;
    const next = { ...assignments };
    if (text != null) {
      // Kick the same label out of any other node first.
      for (const [nid, t] of Object.entries(next)) if (t === text) next[nid] = null;
    }
    next[nodeId] = text;
    onChange({ kind: 'label', assignments: next });
    setTapped(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const text = String(active.id).slice('label:'.length);
    const overId = String(over.id);
    if (overId === POOL_ID) {
      const nid = Object.entries(assignments).find(([, t]) => t === text)?.[0];
      if (nid) assign(nid, null);
      return;
    }
    if (overId.startsWith(NODE_DROPPABLE_PREFIX)) assign(overId.slice(NODE_DROPPABLE_PREFIX.length), text);
  };

  const tapNode = (nodeId: string) => {
    if (locked) return;
    if (tapped != null) assign(nodeId, tapped);
    else if (assignments[nodeId] != null) assign(nodeId, null); // tap labelled node to clear
  };

  const { setNodeRef: setPoolRef, isOver: overPool } = useDroppable({ id: POOL_ID });

  const assignedTexts = new Set(
    Object.values(assignments).filter((t): t is string => t != null),
  );
  const poolTexts = pool.filter((t) => !assignedTexts.has(t));

  const reveal: MiniDiagramReveal | null = locked
    ? {
        correct: question.labels
          .filter((l) => assignments[l.nodeId] === l.text)
          .map((l) => l.nodeId),
        wrong: question.labels
          .filter((l) => assignments[l.nodeId] != null && assignments[l.nodeId] !== l.text)
          .map((l) => l.nodeId),
      }
    : null;

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <MiniDiagram
          graph={question.diagram}
          assignments={assignments}
          droppable
          onNodeClick={tapNode}
          reveal={reveal}
        />
        <div
          ref={setPoolRef}
          className={clsx(
            'flex min-h-14 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors',
            overPool ? 'border-violet-400 bg-violet-400/10' : 'border-slate-700 bg-slate-950/40',
          )}
          aria-label="Label pool"
          data-testid="label-pool"
        >
          {poolTexts.length === 0 ? (
            <span className="text-xs text-slate-600">Every label is placed.</span>
          ) : (
            poolTexts.map((text) => (
              <LabelChip
                key={text}
                text={text}
                selected={tapped === text}
                locked={locked}
                onTap={() => setTapped(tapped === text ? null : text)}
              />
            ))
          )}
        </div>
      </DndContext>
      {!locked && (
        <p className="text-xs text-slate-500">
          Drag a label onto a node — or tap a label, then tap a node. Tap a placed node to clear it.
        </p>
      )}
    </div>
  );
}
