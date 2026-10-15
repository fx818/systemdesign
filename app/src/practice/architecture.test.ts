import { describe, expect, it } from 'vitest';
import { gradeArchitecture, reachable } from './architecture';
import { starterGraph } from './config';
import type { ArchitectureRubric } from './architecture';
const rubric: ArchitectureRubric = { loadBalancing: true, databaseRedundancy: true, readHeavy: true, noSinglePointOfFailure: true };
const result = (graph = starterGraph()) => gradeArchitecture(graph, rubric);

describe('structural architecture grading', () => {
  it('passes a connected redundant architecture', () => { expect(result().score).toBe(100); expect(result().passed).toBe(true); });
  it('rejects empty, disconnected and decorative boxes', () => {
    expect(result({ nodes: [], edges: [] }).score).toBe(0);
    const graph = starterGraph(); graph.edges = [];
    expect(result(graph).score).toBe(0);
  });
  it('rejects web routes that bypass load balancers', () => {
    const graph = starterGraph(); graph.edges.push({ from: 'client', to: 'web-a' });
    expect(result(graph).checks.find(c => c.id === 'load-balancing')?.passed).toBe(false);
  });
  it('requires a connected replica, not an unrelated replica box', () => {
    const graph = starterGraph(); graph.edges = graph.edges.filter(e => e.to !== 'replica');
    expect(result(graph).checks.find(c => c.id === 'database-redundancy')?.passed).toBe(false);
  });
  it('identifies a load balancer that cuts every request path', () => {
    const graph = starterGraph(); graph.nodes = graph.nodes.filter(n => n.id !== 'lb-b');
    const check = result(graph).checks.find(c => c.id === 'no-spof');
    expect(check?.passed).toBe(false); expect(check?.explanation).toContain('Load balancer A');
  });
  it('requires a CDN origin route and a queue-to-worker pipeline', () => {
    const graph = starterGraph();
    graph.nodes.push({ id: 'cdn', kind: 'cdn', x: 80, y: 90 }, { id: 'q', kind: 'queue', x: 600, y: 600 }, { id: 'w', kind: 'worker', x: 800, y: 600 });
    expect(gradeArchitecture(graph, { media: true, async: true }).passed).toBe(false);
    graph.edges.push({ from: 'client', to: 'cdn' }, { from: 'cdn', to: 'lb-a' }, { from: 'web-a', to: 'q' }, { from: 'q', to: 'w' });
    expect(gradeArchitecture(graph, { media: true, async: true }).passed).toBe(true);
  });
  it('identifies async queues and consumers as failure points when they are required', () => {
    const graph = starterGraph();
    graph.nodes.push({ id: 'q', kind: 'queue', x: 600, y: 600 }, { id: 'w', kind: 'worker', x: 800, y: 600 });
    graph.edges.push({ from: 'web-a', to: 'q' }, { from: 'q', to: 'w' });
    const grade = gradeArchitecture(graph, { async: true, noSinglePointOfFailure: true });
    expect(grade.checks.find(check => check.id === 'async-queue')?.passed).toBe(true);
    expect(grade.checks.find(check => check.id === 'no-spof')?.passed).toBe(false);
    expect(grade.checks.find(check => check.id === 'no-spof')?.explanation).toContain('q');
  });
  it('does not accept a cache hanging off a client', () => {
    const graph = starterGraph(); graph.edges = graph.edges.filter(e => !e.to.startsWith('cache'));
    graph.edges.push({ from: 'client', to: 'cache-a' });
    expect(result(graph).checks.find(c => c.id === 'read-cache')?.passed).toBe(false);
  });
  it('handles cycles and dangling edges deterministically', () => {
    const graph = starterGraph(); graph.edges.push({ from: 'db-a', to: 'web-a' }, { from: 'client', to: 'absent' });
    expect(reachable(graph, 'client').has('absent')).toBe(false);
    expect(gradeArchitecture(graph, rubric)).toEqual(gradeArchitecture(graph, rubric));
  });
});
