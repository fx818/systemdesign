import { useId, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { LockKeyhole, MousePointer2, Plus, Trash2, Unplug } from 'lucide-react';
import type { ArchGraph, ComponentKind } from '@/types/content';
import { KindIcon, KIND_COLOR, Node, Smoke, StageDefs } from '@/scenekit';
import { COMPONENTS, graphCost } from './components';
import type { SimState } from './types';

export interface ArchCanvasProps {
  graph: ArchGraph;
  state?: SimState;
  time?: number;
  editable?: boolean;
  onChange?: (graph: ArchGraph) => void;
  palette?: ComponentKind[];
  locked?: string[];
  budget?: number;
  /** Quiz consumers can select nodes without enabling the architecture editor. */
  onNodeClick?: (id: string) => void;
  selectedNodeIds?: string[];
  className?: string;
}
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40';

function PaletteItem({ kind, disabled, onAdd }: { kind: ComponentKind; disabled: boolean; onAdd: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `palette-${kind}`, data: { kind }, disabled });
  return <button ref={setNodeRef} {...listeners} {...attributes} type="button" disabled={disabled} onClick={onAdd}
    title={`${COMPONENTS[kind].description} Drag onto the board or click to place.`} aria-label={`Add ${COMPONENTS[kind].name}`}
    className={`${button} min-w-32 touch-none flex-col gap-1 px-3 py-3 ${isDragging ? 'opacity-30' : ''}`}>
    <svg width="32" height="32" viewBox="-20 -20 40 40" aria-hidden="true"><KindIcon kind={kind} size={30} color={KIND_COLOR[kind]} /></svg>
    <span>{COMPONENTS[kind].name}</span><span className="font-mono text-[10px] text-slate-500">{COMPONENTS[kind].cost} credits</span>
  </button>;
}

function CanvasDrop({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'architecture' });
  return <div ref={setNodeRef} className={`relative overflow-x-auto ${isOver ? 'ring-2 ring-inset ring-cyan-300' : ''}`}>{children}</div>;
}

export function ArchCanvas({ graph, state, time = state?.t ?? 0, editable = false, onChange, palette = [], locked = [], budget, onNodeClick, selectedNodeIds = [], className = '' }: ArchCanvasProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragKind, setDragKind] = useState<ComponentKind | null>(null);
  const [notice, setNotice] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const moving = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const idSequence = useRef(1);
  const gridId = useId().replaceAll(':', '');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const cost = state?.cost ?? graphCost(graph.nodes.map(n => n.kind));
  const selectedNode = graph.nodes.find(n => n.id === selected);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const flowMap = new Map(state?.flows.map(flow => [`${flow.from}:${flow.to}`, flow]));
  const editableNow = editable && Boolean(onChange);
  const point = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 640, y: 360 };
    const p = svg.createSVGPoint(); p.x = clientX; p.y = clientY;
    const local = p.matrixTransform(matrix.inverse());
    return { x: Math.max(65, Math.min(1215, local.x)), y: Math.max(75, Math.min(625, local.y)) };
  };
  function add(kind: ComponentKind, position?: { x: number; y: number }) {
    if (!editableNow) return;
    if (budget !== undefined && cost + COMPONENTS[kind].cost > budget) { setNotice('That component would exceed your budget. Remove something or choose a cheaper design.'); return; }
    let id = `${kind}-${idSequence.current++}`;
    while (byId.has(id)) id = `${kind}-${idSequence.current++}`;
    const p = position ?? { x: 240 + ((graph.nodes.length * 173) % 850), y: 170 + ((graph.nodes.length * 137) % 390) };
    onChange?.({ ...graph, nodes: [...graph.nodes, { id, kind, label: `${COMPONENTS[kind].name} ${id.split('-').at(-1)}`, ...p }] });
    setSelected(id); setNotice(`${COMPONENTS[kind].name} placed. Select it, then select another node to connect.`);
  }
  function onDragEnd(event: DragEndEvent) {
    setDragKind(null);
    const kind = event.active.data.current?.kind as ComponentKind | undefined;
    if (!kind || event.over?.id !== 'architecture') return;
    const rect = event.active.rect.current.translated;
    if (rect) add(kind, point(rect.left + rect.width / 2, rect.top + rect.height / 2));
  }
  function choose(id: string) {
    if (suppressClick.current) { suppressClick.current = false; return; }
    onNodeClick?.(id);
    if (!editableNow) return;
    if (selected && selected !== id && byId.has(selected)) {
      if (!graph.edges.some(e => e.from === selected && e.to === id)) {
        onChange?.({ ...graph, edges: [...graph.edges, { from: selected, to: id }] });
        setNotice(`Connected ${byId.get(selected)?.label ?? selected} → ${byId.get(id)?.label ?? id}.`);
      }
      setSelected(null);
    } else setSelected(selected === id ? null : id);
  }
  function move(event: ReactPointerEvent<SVGGElement>) {
    const active = moving.current;
    if (!active || !editableNow) return;
    const p = point(event.clientX, event.clientY);
    if (Math.hypot(p.x - active.x, p.y - active.y) < 4 && !active.moved) return;
    active.moved = true;
    onChange?.({ ...graph, nodes: graph.nodes.map(n => n.id === active.id ? { ...n, ...p } : n) });
  }
  const outage = state && state.rps > 0 && state.recentUptime < 0.9;
  return <DndContext sensors={sensors} onDragStart={event => setDragKind(event.active.data.current?.kind as ComponentKind ?? null)} onDragEnd={onDragEnd} onDragCancel={() => setDragKind(null)}>
    <div className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-300 uppercase"><span className={`h-2 w-2 rounded-full ${outage ? 'bg-rose-400' : 'bg-cyan-400'}`} />PixelPost / Architecture</div>
        {budget !== undefined && <span className={`font-mono text-xs ${cost > budget ? 'text-rose-300' : 'text-amber-200'}`}>{Math.round(cost)} / {budget} credits</span>}
      </div>
      <CanvasDrop>
        <svg ref={svgRef} viewBox="0 0 1280 720" className="block w-full min-w-[800px] sm:min-w-0" aria-label="System architecture" role="group">
          <StageDefs />
          <defs><pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1e293b" /></pattern></defs>
          <rect width="1280" height="720" fill="#020617" /><rect width="1280" height="720" fill={`url(#${gridId})`} />
          {graph.edges.map((edge, i) => {
            const a = byId.get(edge.from); const b = byId.get(edge.to);
            if (!a || !b) return null;
            const flow = flowMap.get(`${edge.from}:${edge.to}`);
            const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.hypot(dx, dy) || 1;
            const inset = Math.min(51, length / 3);
            const x1 = a.x + dx / length * inset; const y1 = a.y + dy / length * inset;
            const x2 = b.x - dx / length * inset; const y2 = b.y - dy / length * inset;
            const color = flow && flow.errorRate > 0.01 ? '#fb7185' : flow && flow.rps > 0 ? '#22d3ee' : '#475569';
            const dots = Math.min(6, Math.ceil((flow?.rps ?? 0) / 500));
            return <g key={`${edge.from}-${edge.to}-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" opacity="0.5" />
              <path d={`M -8 -5 L 0 0 L -8 5`} transform={`translate(${x2} ${y2}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`} fill="none" stroke={color} strokeWidth="2" />
              {edge.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} textAnchor="middle" fill="#94a3b8" fontSize="13" paintOrder="stroke" stroke="#020617" strokeWidth="5">{edge.label}</text>}
              {Array.from({ length: dots }, (_, d) => {
                const p = ((time * (0.35 + Math.min(2, (flow?.rps ?? 0) / 3000)) + d / dots + i * 0.17) % 1 + 1) % 1;
                return <circle key={d} cx={x1 + (x2 - x1) * p} cy={y1 + (y2 - y1) * p} r="4" fill={color} />;
              })}
              {editableNow && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="18" role="button" tabIndex={0} aria-label={`Remove connection ${a.label ?? a.id} to ${b.label ?? b.id}`}
                className="cursor-pointer focus:stroke-rose-400/40" onClick={() => onChange?.({ ...graph, edges: graph.edges.filter((_, index) => index !== i) })}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Delete' || e.key === ' ') { e.preventDefault(); onChange?.({ ...graph, edges: graph.edges.filter((_, index) => index !== i) }); } }}><title>Click to remove this connection</title></line>}
            </g>;
          })}
          {graph.nodes.map((n, i) => {
            const nodeState = state?.nodes[n.id];
            const health = nodeState?.health;
            const active = selected === n.id || selectedNodeIds.includes(n.id);
            const interactive = editableNow || Boolean(onNodeClick);
            return <g key={n.id} role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : undefined}
              aria-label={`${n.label ?? COMPONENTS[n.kind].name}${nodeState ? `, ${health}, ${Math.round(nodeState.util * 100)}% load` : ''}`} aria-pressed={interactive ? active : undefined}
              className={`${interactive ? 'cursor-pointer outline-none focus:opacity-70' : ''} ${editableNow ? 'touch-none' : ''}`} onClick={() => choose(n.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(n.id); }
                if (e.key === 'Escape') setSelected(null);
                if (editableNow && e.key.startsWith('Arrow')) { e.preventDefault(); onChange?.({ ...graph, nodes: graph.nodes.map(item => item.id === n.id ? { ...item, x: Math.max(65, Math.min(1215, item.x + (e.key === 'ArrowRight' ? 16 : e.key === 'ArrowLeft' ? -16 : 0))), y: Math.max(75, Math.min(625, item.y + (e.key === 'ArrowDown' ? 16 : e.key === 'ArrowUp' ? -16 : 0))) } : item) }); }
              }}
              onPointerDown={e => { if (!editableNow || e.button !== 0) return; const p = point(e.clientX, e.clientY); moving.current = { id: n.id, ...p, moved: false }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
              onPointerMove={move} onPointerUp={e => { if (moving.current?.moved) suppressClick.current = true; moving.current = null; if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { moving.current = null; }}>
              <title>{COMPONENTS[n.kind].description}{nodeState?.promoted ? ' Promoted to primary.' : ''}</title>
              {active && <rect x={n.x - 59} y={n.y - 59} width="118" height="118" rx="27" fill="#22d3ee" fillOpacity="0.08" stroke="#22d3ee" strokeDasharray="5 5" />}
              <Node kind={n.kind} x={n.x} y={n.y} size={88} label={(n.label ?? COMPONENTS[n.kind].name).slice(0, 29)} time={time}
                state={health === 'down' ? 'down' : health === 'overloaded' ? 'overloaded' : health === 'degraded' ? 'busy' : state ? 'active' : 'idle'}
                color={health === 'healthy' ? '#34d399' : undefined} load={nodeState?.util} sublabel={nodeState?.promoted ? 'PROMOTED → PRIMARY' : nodeState ? `${Math.round(nodeState.rps)} rps · ${Math.round(nodeState.util * 100)}%` : undefined} />
              {(health === 'down' || health === 'overloaded') && <Smoke x={n.x} y={n.y - 32} time={time} intensity={0.5} seed={i + 1} />}
              {locked.includes(n.id) && <g transform={`translate(${n.x + 32} ${n.y - 46})`}><circle r="11" fill="#0f172a" /><LockKeyhole size={13} x={-6.5} y={-6.5} color="#64748b" /></g>}
            </g>;
          })}
          {!graph.nodes.length && <text x="640" y="360" textAnchor="middle" fill="#64748b" fontSize="24">Your architecture starts here</text>}
        </svg>
        {outage && <div role="status" className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-xl border border-rose-400/50 bg-rose-950/90 px-5 py-2 text-xs font-black tracking-[0.3em] text-rose-200 shadow-lg shadow-rose-950">OUTAGE · PAGER ALERT</div>}
      </CanvasDrop>
      {editableNow && <>
        <div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-slate-800 px-4 py-3">
          <MousePointer2 size={14} className="text-cyan-300" /><span className="mr-auto text-xs text-slate-400">{selectedNode ? `${selectedNode.label ?? selectedNode.id} selected. Click a destination to wire →` : 'Drag to move · Click two nodes to wire · Click a wire to remove'}</span>
          {selectedNode && <><button type="button" className={button} onClick={() => setSelected(null)}>Cancel</button><button type="button" className={button} onClick={() => onChange?.({ ...graph, edges: graph.edges.filter(e => e.from !== selected && e.to !== selected) })}><Unplug size={13} />Disconnect</button>
            <button type="button" className={button} disabled={locked.includes(selectedNode.id)} onClick={() => { onChange?.({ nodes: graph.nodes.filter(n => n.id !== selected), edges: graph.edges.filter(e => e.from !== selected && e.to !== selected) }); setSelected(null); }}><Trash2 size={13} />Remove</button></>}
        </div>
        {palette.length > 0 && <div className="flex items-stretch gap-2 overflow-x-auto border-t border-slate-800 bg-slate-900/40 p-3" aria-label="Component palette"><div className="flex min-w-16 flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"><Plus size={20} />Build</div>{palette.map(kind => <PaletteItem key={kind} kind={kind} disabled={budget !== undefined && cost + COMPONENTS[kind].cost > budget} onAdd={() => add(kind)} />)}</div>}
        <p role="status" className="sr-only">{notice}</p>
      </>}
    </div>
    <DragOverlay>{dragKind && <div className="rounded-xl border border-cyan-300 bg-slate-900 p-3 text-xs font-bold text-cyan-200">+ {COMPONENTS[dragKind].name}</div>}</DragOverlay>
  </DndContext>;
}
