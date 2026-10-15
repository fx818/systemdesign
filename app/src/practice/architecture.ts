import type { ArchGraph, ComponentKind } from '@/types/content';

export interface ArchitectureRubric {
  loadBalancing?: boolean;
  databaseRedundancy?: boolean;
  readHeavy?: boolean;
  media?: boolean;
  async?: boolean;
  sharedSessions?: boolean;
  noSinglePointOfFailure?: boolean;
}
export interface RubricCheck { id: string; passed: boolean; explanation: string }
export interface ArchitectureGrade { score: number; checks: RubricCheck[]; passed: boolean }

/** Directed reachability; cycles and absent endpoints are safe. */
export function reachable(graph: ArchGraph, start: string, excluded: ReadonlySet<string> = new Set()): Set<string> {
  const allowed = new Set(graph.nodes.filter(n => !excluded.has(n.id)).map(n => n.id));
  const visited = new Set<string>();
  const pending = allowed.has(start) ? [start] : [];
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const edge of graph.edges) if (edge.from === id && allowed.has(edge.to) && !visited.has(edge.to)) pending.push(edge.to);
  }
  return visited;
}

/** Checks topology, not mere box counts. Numerical SLOs are graded by the simulator. */
export function gradeArchitecture(graph: ArchGraph, rubric: ArchitectureRubric): ArchitectureGrade {
  const sources = graph.nodes.filter(n => n.kind === 'client' || n.kind === 'mobile');
  const live = new Set(sources.flatMap(n => [...reachable(graph, n.id)]));
  const nodes = (kind: ComponentKind) => graph.nodes.filter(n => n.kind === kind && live.has(n.id));
  const web = nodes('web');
  const db = nodes('db');
  const lb = nodes('lb');
  const replicas = graph.nodes.filter(n => n.kind === 'db-replica' && (live.has(n.id) || db.some(primary => graph.edges.some(e => (e.from === primary.id && e.to === n.id) || (e.to === primary.id && e.from === n.id)))));
  const synchronized = (id: string) => db.some(primary => graph.edges.some(e =>
    (e.from === primary.id && e.to === id) || (e.to === primary.id && e.from === id)));
  const replicated = db.length > 0 && db.every(primary => replicas.some(replica => graph.edges.some(e =>
    (e.from === primary.id && e.to === replica.id) || (e.to === primary.id && e.from === replica.id))));
  const checks: RubricCheck[] = [];
  const check = (id: string, passed: boolean, explanation: string) => checks.push({ id, passed, explanation });
  check('request-path', sources.length > 0 && sources.every(source => [...reachable(graph, source.id)].some(id => web.some(n => n.id === id))) && web.every(n => [...reachable(graph, n.id)].some(id => db.some(d => d.id === id) || nodes('nosql').some(d => d.id === id) || nodes('shard').some(d => d.id === id))),
    'Every client needs a directed route to a web server, and each serving web needs a data path.');
  if (rubric.loadBalancing) {
    const bypass = sources.some(source => [...reachable(graph, source.id, new Set(lb.map(n => n.id)))].some(id => web.some(n => n.id === id)));
    check('load-balancing', web.length >= 2 && lb.length > 0 && !bypass, 'Place a reachable load balancer before at least two web servers; remove routes that bypass the balancers.');
  }
  if (rubric.databaseRedundancy) check('database-redundancy', replicated, 'Connect each primary to a reachable replica so its data can survive a primary failure.');
  if (rubric.readHeavy) check('read-cache', web.some(n => [...reachable(graph, n.id)].some(id => nodes('cache').some(c => c.id === id && [...reachable(graph, c.id)].some(data => db.some(d => d.id === data) || nodes('shard').some(d => d.id === data))))), 'Put a cache on a web-to-data path for repeated reads.');
  if (rubric.media) check('media-cdn', nodes('cdn').some(n => [...reachable(graph, n.id)].some(id => web.some(w => w.id === id))), 'Connect a CDN from the users to a serving origin for static media.');
  if (rubric.async) check('async-queue', web.some(n => [...reachable(graph, n.id)].some(id => nodes('queue').some(q => q.id === id && [...reachable(graph, q.id)].some(worker => nodes('worker').some(w => w.id === worker))))), 'Connect a producer web server through a queue to at least one worker.');
  if (rubric.sharedSessions) check('shared-sessions', nodes('session-store').some(store => web.every(server => reachable(graph, server.id).has(store.id))), 'Connect every web server to the same shared session store before relying on failover.');
  if (rubric.noSinglePointOfFailure) {
    // Replica promotion rewires incoming primary requests in this structural model.
    const protectedGraph: ArchGraph = { ...graph, edges: [...graph.edges] };
    for (const replica of replicas.filter(n => synchronized(n.id))) {
      for (const primary of db) if (graph.edges.some(e => (e.from === primary.id && e.to === replica.id) || (e.to === primary.id && e.from === replica.id))) {
        for (const incoming of graph.edges.filter(e => e.to === primary.id)) protectedGraph.edges.push({ from: incoming.from, to: replica.id });
      }
    }
    const critical = graph.nodes.filter(n => live.has(n.id) && (['lb', 'web', 'db', 'db-replica', 'cache', 'cdn', 'datacenter', 'nosql', 'shard'].includes(n.kind) || (rubric.async && ['queue', 'worker'].includes(n.kind)) || (rubric.sharedSessions && n.kind === 'session-store')));
    const cuts = critical.filter(failure => sources.some(source => {
      const available = reachable(protectedGraph, source.id, new Set([failure.id]));
      const survivingWeb = web.filter(server => server.id !== failure.id && available.has(server.id));
      const excluded = new Set([failure.id]);
      const serving = survivingWeb.some(server => [...reachable(protectedGraph, server.id, excluded)].some(id => graph.nodes.some(n => n.id === id && ['db', 'db-replica', 'nosql', 'shard'].includes(n.kind))));
      const asyncAvailable = !rubric.async || survivingWeb.some(server => nodes('queue').some(queue => available.has(queue.id) && reachable(protectedGraph, server.id, excluded).has(queue.id) && nodes('worker').some(worker => reachable(protectedGraph, queue.id, excluded).has(worker.id))));
      const sessionsAvailable = !rubric.sharedSessions || survivingWeb.every(server => nodes('session-store').some(store => reachable(protectedGraph, server.id, excluded).has(store.id)));
      return !serving || !asyncAvailable || !sessionsAvailable;
    }));
    check('no-spof', critical.length > 0 && sources.length > 0 && cuts.length === 0, cuts.length ? `Single points of failure: ${cuts.map(n => n.label ?? n.id).join(', ')}. Add independent routes, redundancy or origin fallback.` : 'The required serving, data and background paths survive each single component loss, assuming synchronized replica promotion.');
  }
  const score = Math.round(checks.filter(c => c.passed).length / checks.length * 100);
  return { score, checks, passed: checks.every(c => c.passed) };
}
