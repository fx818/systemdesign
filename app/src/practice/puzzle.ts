import type { ArchGraph, SimConfig } from '@/types/content';
import { starterGraph, allComponents } from './config';
import type { ArchitectureRubric } from './architecture';

export function seedFrom(text: string): number {
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}
export function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export interface DailyPuzzle {
  date: string; number: number; title: string; briefing: string; maxMoves: number; budget: number;
  graph: ArchGraph; config: SimConfig; rubric: ArchitectureRubric;
}
export function generatePuzzle(date: string): DailyPuzzle {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Use a valid YYYY-MM-DD date.');
  const random = seeded(seedFrom(date));
  const template = Math.floor(random() * 4);
  const graph = starterGraph();
  let title = ''; let briefing = ''; let maxMoves = 8;
  const rubric: ArchitectureRubric = { loadBalancing: true, databaseRedundancy: true, readHeavy: true, noSinglePointOfFailure: true };
  const knobs: SimConfig['knobs'] = [];
  let failed = 'web-a';
  if (template === 0) {
    title = 'One front door'; briefing = 'Your only load balancer is about to fail. Add an independent entrance to the serving pool.';
    graph.nodes = graph.nodes.filter(n => n.id !== 'lb-b'); failed = 'lb-a';
  } else if (template === 1) {
    title = 'Cold reads'; briefing = 'Repeated reads are overloading the data tier. Restore a cache path and retain an origin fallback.';
    graph.nodes = graph.nodes.filter(n => n.kind !== 'cache'); maxMoves = 10;
  } else if (template === 2) {
    title = 'Sessions that vanish'; briefing = 'Sticky sessions trap users on a dying server. Connect a shared session store to both web servers.';
    maxMoves = 12;
    rubric.sharedSessions = true;
    knobs.push({ id: 'sticky', label: 'Sticky sessions', type: 'toggle', initial: true });
  } else {
    title = 'One region, one outage'; briefing = 'Every web server lives in US-West. Create an independent US-East serving route and keep shared data outside the doomed region.';
    graph.nodes.push({ id: 'west', kind: 'datacenter', label: 'US-West', x: 120, y: 100 });
    graph.edges = graph.edges.filter(e => !e.from.startsWith('lb-'));
    graph.edges.push({ from: 'lb-a', to: 'west' }, { from: 'lb-b', to: 'west' }, { from: 'west', to: 'web-a' }, { from: 'west', to: 'web-b' });
    maxMoves = 10;
  }
  const ids = new Set(graph.nodes.map(n => n.id)); graph.edges = graph.edges.filter(e => ids.has(e.from) && ids.has(e.to));
  const budget = 2400;
  const config: SimConfig = { start: graph, palette: allComponents.filter(k => !['client', 'mobile'].includes(k)), locked: ['client'], budget,
    knobs, goals: { minUptime: 0.97, maxP95Ms: 350, maxCost: budget, durationSec: 45 },
    events: [{ at: 0, type: 'traffic', rps: 600 }, { at: 12, type: 'traffic', rps: template === 3 ? 900 : 1200 },
      template === 3 ? { at: 20, type: 'region-down', region: 'west' } : { at: 20, type: 'kill', target: failed },
      { at: 30, type: 'traffic', rps: 900 }],
  };
  return { date, number: Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) - Math.floor(Date.UTC(2026, 0, 1) / 86400000) + 1, title, briefing, maxMoves, budget, graph, config, rubric };
}
/** One placement, removal or wire edit costs a move. Moving/renaming a box is free. */
export function graphMoveCost(before: ArchGraph, after: ArchGraph): number {
  const diff = (a: string[], b: string[]) => a.filter(id => !b.includes(id)).length + b.filter(id => !a.includes(id)).length;
  return diff(before.nodes.map(n => n.id), after.nodes.map(n => n.id))
    + diff(before.edges.map(e => `${e.from}\0${e.to}`), after.edges.map(e => `${e.from}\0${e.to}`));
}
export const puzzleShare = (number: number, moves: number) => `SD Quest #${number} ✅ in ${moves} moves`;
