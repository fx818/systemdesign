/**
 * bins: drag chips into bins with @dnd-kit — or tap a chip, then tap a bin
 * (mobile-friendly fallback). Tap a placed chip to send it back to the pool.
 */
import {
  DndContext,
  closestCenter,
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
import type { ReactNode } from 'react';
import type { QuizQuestion } from '@/types/content';
import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { AnswerPool } from './AnswerPool';

export interface BinsAnswerProps {
  question: Extract<QuizQuestion, { kind: 'bins' }>;
  value: { kind: 'bins'; placements: (number | null)[] } | null;
  onChange: (v: { kind: 'bins'; placements: (number | null)[] }) => void;
  locked: boolean;
}

const POOL_ID = 'pool';
const binId = (bi: number) => `bin-${bi}`;

function Chip({
  text,
  index,
  selected,
  locked,
  state,
  onTap,
}: {
  text: string;
  index: number;
  selected: boolean;
  locked: boolean;
  state: 'pool' | 'in-bin' | 'correct' | 'wrong';
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `chip-${index}`,
    disabled: locked,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Don't let chip taps bubble to the bin's tap-to-place handler.
        e.stopPropagation();
        onTap();
      }}
      data-testid={`chip-${index}`}
      aria-pressed={selected}
      className={clsx(
        'touch-manipulation rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        state === 'pool' && 'border-slate-600 bg-slate-900/80 text-slate-200 hover:border-cyan-400/60',
        state === 'in-bin' && 'border-cyan-400/70 bg-cyan-400/10 text-cyan-100',
        selected && 'border-violet-300 bg-violet-400/25 text-violet-100 shadow-[0_0_14px_rgba(167,139,250,0.45)]',
        state === 'correct' && 'border-emerald-400 bg-emerald-400/15 text-emerald-100',
        state === 'wrong' && 'border-rose-400 bg-rose-400/15 text-rose-100',
        isDragging && 'z-20 opacity-80 shadow-[0_0_18px_rgba(34,211,238,0.4)]',
      )}
    >
      {text}
    </button>
  );
}

function Bin({
  index,
  name,
  onTap,
  children,
}: {
  index: number;
  name: string;
  onTap: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: binId(index) });
  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      role="button"
      tabIndex={0}
      aria-label={`Place selected item in ${name}`}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.code === 'Space')) {
          event.preventDefault();
          event.stopPropagation();
          onTap();
        }
      }}
      data-testid={`bin-${index}`}
      data-bin={name}
      className={clsx(
        'flex min-h-24 flex-1 cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-colors',
        isOver ? 'border-violet-400 bg-violet-400/10' : 'border-slate-700 bg-slate-950/40 hover:border-slate-600',
      )}
    >
      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{name}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function BinsAnswer({ question, value, onChange, locked }: BinsAnswerProps) {
  const placements =
    value?.kind === 'bins' && value.placements.length === question.items.length
      ? value.placements.slice()
      : question.items.map(() => null);
  const [tapped, setTapped] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );

  const place = (chip: number, bin: number | null) => {
    if (locked) return;
    const next = placements.slice();
    next[chip] = bin;
    onChange({ kind: 'bins', placements: next });
    setTapped(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const match = /^chip-(\d+)$/.exec(String(active.id));
    if (!match) return;
    const chip = Number(match[1]);
    if (chip < 0 || chip >= placements.length) return;
    const overId = String(over.id);
    if (overId === POOL_ID) place(chip, null);
    else if (/^bin-\d+$/.test(overId)) place(chip, Number(overId.slice(4)));
  };

  const tapChip = (i: number) => {
    if (locked) return;
    if (placements[i] != null) place(i, null);
    else setTapped(tapped === i ? null : i);
  };

  const chipState = (i: number): 'pool' | 'in-bin' | 'correct' | 'wrong' => {
    if (!locked) return placements[i] == null ? 'pool' : 'in-bin';
    return placements[i] === question.items[i].bin ? 'correct' : 'wrong';
  };

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={(args) => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)} onDragEnd={handleDragEnd}>
        <AnswerPool label="Item pool" testId="bins-pool">
          {placements.every((p) => p != null) ? (
            <span className="text-xs text-slate-600">Pool empty — every item is in a bin.</span>
          ) : (
            placements.map((p, i) =>
              p == null ? (
                <Chip
                  key={i}
                  text={question.items[i].text}
                  index={i}
                  selected={tapped === i}
                  locked={locked}
                  state={chipState(i)}
                  onTap={() => tapChip(i)}
                />
              ) : null,
            )
          )}
        </AnswerPool>

        <div className="flex flex-col gap-2.5 sm:flex-row" role="group" aria-label="Bins">
          {question.bins.map((bin, bi) => (
            <Bin key={bi} index={bi} name={bin} onTap={() => tapped != null && place(tapped, bi)}>
              {placements.map((p, i) => {
                if (p !== bi) return null;
                return (
                  <Chip
                    key={i}
                    text={question.items[i].text}
                    index={i}
                    selected={false}
                    locked={locked}
                    state={chipState(i)}
                    onTap={() => tapChip(i)}
                  />
                );
              })}
            </Bin>
          ))}
        </div>
      </DndContext>
      {!locked && (
        <p className="text-xs text-slate-500">
          Drag a chip into a bin — or tap a chip, then tap a bin. Tap a placed chip to take it back.
        </p>
      )}
    </div>
  );
}
