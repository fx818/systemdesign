import { describe, expect, it } from 'vitest';
import { createSurvival } from './survival';
import { starterGraph } from './config';

describe('survival waves', () => {
  it('replays seeded failures and traffic escalation exactly', () => {
    const a = createSurvival(starterGraph(), 42); const b = createSurvival(starterGraph(), 42);
    for (let i = 0; i < 610; i++) { a.step(); b.step(); }
    expect(a.state).toEqual(b.state); expect(a.wave).toBe(3); expect(a.state.rps).toBe(400);
    expect(a.message).toContain('Wave 3');
  });
  it('ends only after a sustained five-second SLO failure and stops its clock', () => {
    const run = createSurvival({ nodes: [{ id: 'client', kind: 'client', x: 80, y: 80 }], edges: [] }, 10);
    for (let i = 0; i < 49; i++) run.step();
    expect(run.ended).toBe(false); run.step(); expect(run.ended).toBe(true);
    const end = run.state.t; run.step(); expect(run.state.t).toBe(end);
  });
  it('preserves time when a live design is upgraded', () => {
    const run = createSurvival(starterGraph(), 42); run.step(); const t = run.state.t;
    const graph = starterGraph(); graph.nodes.push({ id: 'metrics', kind: 'metrics', x: 200, y: 200 });
    run.setGraph(graph); expect(run.state.t).toBe(t); expect(run.state.nodes.metrics).toBeDefined();
  });
});

it('can reach the Survivor milestone with an affordable redundant design', () => {
  const graph = starterGraph();
  graph.nodes.push({ id: 'cdn-a', kind: 'cdn', x: 100, y: 80 }, { id: 'cdn-b', kind: 'cdn', x: 100, y: 550 }, { id: 'db-b', kind: 'db', x: 1050, y: 350 }, { id: 'replica-b', kind: 'db-replica', x: 1100, y: 600 });
  graph.edges.push(...['cdn-a', 'cdn-b'].flatMap(from => [{ from: 'client', to: from }, { from, to: 'lb-a' }, { from, to: 'lb-b' }]));
  graph.edges.push({ from: 'db-b', to: 'replica-b' });
  for (let i = 0; i < 6; i++) {
    const id = `extra-web-${i}`; graph.nodes.push({ id, kind: 'web', x: 400 + i * 80, y: 550 });
    graph.edges.push({ from: 'lb-a', to: id }, { from: 'lb-b', to: id }, { from: id, to: 'db-a' }, { from: id, to: 'db-b' }, { from: id, to: 'cache-a' }, { from: id, to: 'cache-b' });
  }
  graph.edges.push({ from: 'web-a', to: 'db-b' }, { from: 'web-b', to: 'db-b' }, { from: 'cache-a', to: 'db-b' }, { from: 'cache-b', to: 'db-b' });
  const run = createSurvival(graph, 42);
  for (let i = 0; i < 1810 && !run.ended; i++) run.step();
  expect(run.state.cost).toBeLessThanOrEqual(4500);
  expect(run.ended).toBe(false); expect(run.state.t).toBeGreaterThanOrEqual(180);
});
