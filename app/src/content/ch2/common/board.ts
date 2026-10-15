import type { ArchGraph, ArchNode } from '@/types/content';

/** The PixelPost board every Chapter 2 sim starts from: users -> LB -> web pool -> (cache) -> DB. */
export function pixelBoard({ webs, cache = false, db = true }: { webs: number; cache?: boolean; db?: boolean }): ArchGraph {
  const webIds = Array.from({ length: webs }, (_, i) => `web-${i + 1}`);
  const nodes: ArchNode[] = [
    { id: 'client', kind: 'client', label: 'Web users', x: 110, y: 230 },
    { id: 'mobile', kind: 'mobile', label: 'App users', x: 110, y: 500 },
    { id: 'dns', kind: 'dns', label: 'DNS', x: 330, y: 90 },
    { id: 'lb', kind: 'lb', label: 'Load balancer', x: 340, y: 365 },
    ...webIds.map((id, i) => ({ id, kind: 'web' as const, label: `Server ${i + 1}`, x: 600, y: Math.round(365 + (i - (webs - 1) / 2) * Math.min(130, 520 / Math.max(1, webs - 1))) })),
  ];
  const edges = [
    { from: 'client', to: 'dns' },
    { from: 'mobile', to: 'dns' },
    { from: 'client', to: 'lb' },
    { from: 'mobile', to: 'lb' },
    ...webIds.map((id) => ({ from: 'lb', to: id })),
  ];
  if (cache) {
    nodes.push({ id: 'cache', kind: 'cache', label: 'Cache (memory)', x: 880, y: 200 });
    edges.push(...webIds.map((id) => ({ from: id, to: 'cache' })));
  }
  if (db) {
    nodes.push({ id: 'db', kind: 'db', label: 'Database (disk)', x: 1100, y: 420 });
    edges.push(...webIds.map((id) => ({ from: id, to: 'db' })));
  }
  return { nodes, edges };
}

export const lockedIds = (g: ArchGraph) => g.nodes.map((n) => n.id);
