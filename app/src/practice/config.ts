import { COMPONENTS } from '@/sim';
import type { ArchGraph, ComponentKind, Knob, SimConfig } from '@/types/content';
export const allComponents = Object.keys(COMPONENTS) as ComponentKind[];
export const practiceKnobs: Knob[] = [
  { id: 'rps', label: 'Traffic (requests/sec)', type: 'slider', min: 0, max: 50000, step: 100, initial: 600 },
  { id: 'servers', label: 'Web pool size', type: 'slider', min: 1, max: 20, initial: 1 },
  { id: 'replicas', label: 'Read replica pool', type: 'slider', min: 0, max: 10, initial: 1 },
  { id: 'workers', label: 'Worker pool', type: 'slider', min: 0, max: 20, initial: 1 },
  { id: 'shards', label: 'Shards', type: 'slider', min: 1, max: 16, initial: 1 },
  { id: 'ttl', label: 'Cache TTL (seconds)', type: 'slider', min: 0, max: 600, step: 10, initial: 60 },
  { id: 'cacheSize', label: 'Cache size', type: 'slider', min: 0, max: 100, initial: 50 },
  { id: 'eviction', label: 'Eviction policy', type: 'select', options: ['LRU', 'LFU', 'FIFO'], initial: 'LRU' },
  { id: 'split', label: 'US-East traffic (%)', type: 'slider', min: 0, max: 100, initial: 50 },
  { id: 'sticky', label: 'Sticky sessions', type: 'toggle', initial: false },
  { id: 'cdn', label: 'Use CDN', type: 'toggle', initial: true },
];
export function starterGraph(): ArchGraph {
  return {
    nodes: [
      { id: 'client', kind: 'client', label: 'Users', x: 90, y: 300 },
      { id: 'lb-a', label: 'Load balancer A', kind: 'lb', x: 280, y: 220 }, { id: 'lb-b', label: 'Load balancer B', kind: 'lb', x: 280, y: 440 },
      { id: 'web-a', label: 'Web server A', kind: 'web', x: 500, y: 220 }, { id: 'web-b', label: 'Web server B', kind: 'web', x: 500, y: 440 },
      { id: 'db-a', label: 'Primary', kind: 'db', x: 980, y: 250 }, { id: 'replica', label: 'Read replica', kind: 'db-replica', x: 980, y: 490 },
      { id: 'cache-a', label: 'Cache A', kind: 'cache', x: 730, y: 180 }, { id: 'cache-b', label: 'Cache B', kind: 'cache', x: 730, y: 460 },
    ],
    edges: [
      ...['lb-a', 'lb-b'].flatMap(lb => [{ from: 'client', to: lb }, ...['web-a', 'web-b'].map(web => ({ from: lb, to: web }))]),
      ...['web-a', 'web-b'].flatMap(web => ['cache-a', 'cache-b', 'db-a'].map(to => ({ from: web, to }))),
      { from: 'cache-a', to: 'db-a' }, { from: 'cache-b', to: 'db-a' }, { from: 'db-a', to: 'replica' },
    ],
  };
}
export const designCost = (graph: ArchGraph) => graph.nodes.reduce((sum, n) => sum + COMPONENTS[n.kind].cost, 0);
export function sandboxConfig(graph: ArchGraph): SimConfig {
  return { start: graph, palette: allComponents, budget: Number.MAX_SAFE_INTEGER, events: [{ at: 0, type: 'traffic', rps: 600 }, { at: 0, type: 'jobs', perSec: 20 }], goals: { durationSec: 3600 }, knobs: practiceKnobs, locked: [] };
}
