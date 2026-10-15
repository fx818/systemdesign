/**
 * MiniDiagram — a small, self-contained SVG renderer for ArchGraph questions
 * (spot / label). Keeps the quiz independent of @/sim: nodes are absolutely
 * positioned buttons (clickable, droppable for dnd-kit) over an SVG edge layer.
 */
import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { ArchGraph, ArchNode } from '@/types/content';
import { Icon } from '@/components/ui';
import { kindMeta } from './kinds';

export const NODE_DROPPABLE_PREFIX = 'node:';

export interface MiniDiagramReveal {
  /** node ids to flash green (correctly answered) */
  correct: readonly string[];
  /** node ids to flash red (wrongly chosen / wrongly labelled) */
  wrong: readonly string[];
}

export interface MiniDiagramProps {
  graph: ArchGraph;
  /** spot: ids currently selected */
  selectedIds?: readonly string[];
  onNodeClick?: (nodeId: string) => void;
  /** label: current assignments (nodeId -> text) */
  assignments?: Record<string, string | null>;
  /** allow labels to be dropped on nodes (label kind) */
  droppable?: boolean;
  /** post-submit coloring; also locks interaction */
  reveal?: MiniDiagramReveal | null;
}

function DiagramNode({
  node,
  selected,
  assignedText,
  droppable,
  onClick,
  revealState,
}: {
  node: ArchNode;
  selected: boolean;
  assignedText: string | null;
  droppable: boolean;
  onClick: ((id: string) => void) | undefined;
  revealState: 'none' | 'correct' | 'wrong';
}) {
  const meta = kindMeta(node.kind);
  const { setNodeRef, isOver } = useDroppable({
    id: `${NODE_DROPPABLE_PREFIX}${node.id}`,
    disabled: !droppable,
  });

  const style: CSSProperties = {
    left: `${(node.x / 1280) * 100}%`,
    top: `${(node.y / 720) * 100}%`,
  };

  const state = revealState === 'correct' || revealState === 'wrong' ? revealState : selected ? 'selected' : isOver ? 'over' : 'idle';

  return (
    <div ref={setNodeRef} className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      {assignedText != null && (
        <div className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 rounded-full border border-violet-400/60 bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-violet-200">
          {assignedText}
        </div>
      )}
      <button
        type="button"
        onClick={onClick ? () => onClick(node.id) : undefined}
        disabled={!onClick}
        aria-pressed={selected}
        aria-label={`${node.label ?? node.kind} node`}
        className={clsx(
          'flex w-24 flex-col items-center gap-1 rounded-xl border-2 px-1.5 py-2 transition-colors',
          'bg-slate-900/95 text-center',
          meta.accent,
          state === 'idle' && onClick && 'hover:border-cyan-300/70',
          state === 'over' && 'border-violet-300 bg-violet-400/20 shadow-[0_0_16px_rgba(167,139,250,0.4)]',
          state === 'selected' && clsx(meta.active, 'shadow-[0_0_16px_rgba(34,211,238,0.35)]'),
          state === 'correct' && 'border-emerald-400 bg-emerald-400/25 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.45)]',
          state === 'wrong' && 'border-rose-400 bg-rose-400/25 text-rose-100 shadow-[0_0_18px_rgba(251,113,133,0.45)]',
          !onClick && 'cursor-default',
        )}
      >
        <Icon name={meta.icon} size={20} className="shrink-0" />
        <span className="text-[10px] leading-tight font-bold tracking-wide uppercase">
          {node.label ?? node.kind}
        </span>
      </button>
    </div>
  );
}

/** Render an ArchGraph as a simple, mobile-friendly SVG diagram. */
export function MiniDiagram({
  graph,
  selectedIds = [],
  onNodeClick,
  assignments,
  droppable = false,
  reveal = null,
}: MiniDiagramProps) {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const selected = new Set(selectedIds);
  const correctSet = new Set(reveal?.correct ?? []);
  const wrongSet = new Set(reveal?.wrong ?? []);

  return (
    <div className="relative aspect-video w-full touch-manipulation overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
      <svg
        viewBox="0 0 1280 720"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <marker id="quiz-mini-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="rgb(71 85 105)" />
          </marker>
        </defs>
        {graph.edges.map((e, i) => {
          const from = nodeById.get(e.from);
          const to = nodeById.get(e.to);
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgb(51 65 85)"
                strokeWidth={3}
                markerEnd="url(#quiz-mini-arrow)"
              />
              {e.label && (
                <text
                  x={mx}
                  y={my - 8}
                  textAnchor="middle"
                  className="fill-slate-500"
                  style={{ fontSize: 26, paintOrder: 'stroke', stroke: 'rgb(2 6 23)', strokeWidth: 8 }}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {graph.nodes.map((n) => {
        const revealState = correctSet.has(n.id)
          ? ('correct' as const)
          : wrongSet.has(n.id)
            ? ('wrong' as const)
            : ('none' as const);
        return (
          <DiagramNode
            key={n.id}
            node={n}
            selected={selected.has(n.id)}
            assignedText={assignments ? (assignments[n.id] ?? null) : null}
            droppable={droppable && !reveal}
            onClick={reveal || !onNodeClick ? undefined : onNodeClick}
            revealState={revealState}
          />
        );
      })}
    </div>
  );
}
