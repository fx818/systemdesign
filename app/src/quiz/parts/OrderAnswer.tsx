/**
 * order: drag-to-reorder with @dnd-kit/sortable. The initial arrangement is
 * shuffled deterministically by question id (seeded.ts) and never starts
 * already-solved. Fully keyboard operable: focus a row, Space to lift,
 * arrows to move, Space to drop.
 */
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import type { QuizQuestion } from '@/types/content';
import { GripVertical } from 'lucide-react';

export interface OrderAnswerProps {
  question: Extract<QuizQuestion, { kind: 'order' }>;
  value: { kind: 'order'; order: number[] } | null;
  onChange: (v: { kind: 'order'; order: number[] }) => void;
  locked: boolean;
}

function SortableRow({
  itemIndex,
  position,
  text,
  locked,
}: {
  itemIndex: number; // index into question.items
  position: number; // current display position
  text: string;
  locked: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `item-${itemIndex}`,
    disabled: locked,
  });
  const solved = locked && itemIndex === position;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('relative', isDragging && 'z-20')}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        data-testid={`order-row-${position}`}
        className={clsx(
          'flex min-h-14 w-full touch-manipulation items-center gap-3 rounded-xl border-2 bg-slate-900/80 px-4 py-3 text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
          !locked && 'border-slate-700 hover:border-cyan-400/60',
          isDragging && 'border-cyan-400 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.35)]',
          locked && solved && 'border-emerald-400/80 bg-emerald-400/10 text-emerald-100',
          locked && !solved && 'border-rose-400/80 bg-rose-400/10 text-rose-100',
        )}
      >
        <GripVertical size={18} className={clsx('shrink-0', locked ? 'text-slate-700' : 'text-slate-500')} />
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-xs font-black text-cyan-300 tabular-nums"
        >
          {position + 1}
        </span>
        <span className="flex-1 text-sm font-semibold sm:text-base">{text}</span>
      </button>
    </div>
  );
}

export function OrderAnswer({ question, value, onChange, locked }: OrderAnswerProps) {
  const order = value?.kind === 'order' ? value.order : question.items.map((_, i) => i);
  // Space-only lift/drop so Enter stays reserved for "submit".
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((i) => `item-${i}` === active.id);
    const to = order.findIndex((i) => `item-${i}` === over.id);
    if (from < 0 || to < 0) return;
    onChange({ kind: 'order', order: arrayMove(order, from, to) });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={order.map((i) => `item-${i}`)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-2.5" aria-label="Drag to put the steps in order">
          {order.map((itemIndex, position) => (
            <li key={itemIndex}>
              <SortableRow
                itemIndex={itemIndex}
                position={position}
                text={question.items[itemIndex]}
                locked={locked}
              />
            </li>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
