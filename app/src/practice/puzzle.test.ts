import { describe, expect, it } from 'vitest';
import { createSim } from '@/sim';
import { goalMeters, missionResult } from '@/sim/mission';
import type { ArchGraph, SimConfig } from '@/types/content';
import { gradeArchitecture } from './architecture';
import { designCost } from './config';
import { generatePuzzle, graphMoveCost, puzzleShare, seeded } from './puzzle';
import { interviewConfig, interviewPrompts } from './interview';
import { starterGraph } from './config';

function run(config: SimConfig, graph: ArchGraph) {
  const sim = createSim(config, graph); let lives = 3; let red = 0;
  while (sim.time < config.goals.durationSec - 1e-8 && lives > 0) {
    const state = sim.step(0.1);
    red = goalMeters(state, config, true).some(m => m.failed) || state.dataLoss ? red + 0.1 : 0;
    if (red >= 3 - 1e-8) { lives--; red = 0; }
  }
  return missionResult(sim.state, config, lives, 0);
}
function repair(graph: ArchGraph, title: string): ArchGraph {
  const next = structuredClone(graph);
  if (title === 'One front door') {
    next.nodes.push({ id: 'new-lb', kind: 'lb', x: 280, y: 440 });
    next.edges.push({ from: 'client', to: 'new-lb' }, { from: 'new-lb', to: 'web-a' }, { from: 'new-lb', to: 'web-b' });
  } else if (title === 'One region, one outage') {
    next.nodes.push({ id: 'east', kind: 'datacenter', label: 'US-East', x: 300, y: 600 });
    next.edges = next.edges.filter(e => !(e.from === 'west' && e.to === 'web-b'));
    next.edges.push({ from: 'lb-a', to: 'east' }, { from: 'lb-b', to: 'east' }, ...['web-b', 'db-a', 'replica', 'cache-a', 'cache-b'].map(to => ({ from: 'east', to })));
  } else {
    next.nodes.push({ id: 'web-c', kind: 'web', x: 500, y: 600 });
    next.edges.push({ from: 'lb-a', to: 'web-c' }, { from: 'lb-b', to: 'web-c' }, { from: 'web-c', to: 'db-a' });
    if (title === 'Cold reads') {
      next.nodes.push({ id: 'cache', kind: 'cache', x: 750, y: 100 });
      next.edges.push({ from: 'web-a', to: 'cache' }, { from: 'web-b', to: 'cache' }, { from: 'cache', to: 'db-a' });
    } else {
      next.nodes.push({ id: 'sessions', kind: 'session-store', x: 750, y: 600 }, { id: 'sessions-b', kind: 'session-store', x: 850, y: 600 });
      next.edges.push(...['web-a', 'web-b', 'web-c'].flatMap(from => ['sessions', 'sessions-b'].map(to => ({ from, to }))));
    }
  }
  return next;
}

describe('daily puzzles', () => {
  const puzzles = Array.from({ length: 31 }, (_, index) => generatePuzzle(`2026-10-${String(index + 1).padStart(2, '0')}`));
  const templates = [...new Map(puzzles.map(p => [p.title, p])).values()];
  it('uses all four seeded templates and reproduces a date exactly', () => {
    expect(templates).toHaveLength(4);
    for (const puzzle of puzzles) expect(generatePuzzle(puzzle.date)).toEqual(puzzle);
    expect(generatePuzzle('2026-10-15')).not.toEqual(generatePuzzle('2026-10-16'));
    const a = seeded(123), b = seeded(123); expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b));
  });
  it.each(['2026-02-30', 'not-a-date', '2026-13-01'])('rejects invalid dates: %s', date => expect(() => generatePuzzle(date)).toThrow());
  for (const puzzle of templates) it(`${puzzle.title} has a legal repair that survives every scripted event`, () => {
    const graph = repair(puzzle.graph, puzzle.title);
    expect(gradeArchitecture(puzzle.graph, puzzle.rubric).passed).toBe(false);
    expect(graphMoveCost(puzzle.graph, graph)).toBeLessThanOrEqual(puzzle.maxMoves);
    expect(designCost(graph)).toBeLessThanOrEqual(puzzle.budget);
    expect(gradeArchitecture(graph, puzzle.rubric).checks.filter(c => !c.passed)).toEqual([]);
    expect(run({ ...puzzle.config, start: graph }, graph)).toMatchObject({ passed: true, withinBudget: true });
  });
  it('counts topology edits while allowing free layout changes', () => {
    const graph = starterGraph(); const moved = structuredClone(graph); moved.nodes[0].x += 20;
    expect(graphMoveCost(graph, moved)).toBe(0); moved.edges.pop(); expect(graphMoveCost(graph, moved)).toBe(1);
    expect(puzzleShare(123, 4)).toBe('SD Quest #123 ✅ in 4 moves');
  });
});

describe('interview simulator playability', () => {
  for (const prompt of interviewPrompts) it(`${prompt.title} has an affordable design that meets its rubric and SLOs`, () => {
    const graph = starterGraph();
    graph.nodes.push({ id: 'web-c', kind: 'web', x: 500, y: 600 });
    graph.edges.push({ from: 'lb-a', to: 'web-c' }, { from: 'lb-b', to: 'web-c' }, { from: 'web-c', to: 'db-a' });
    if (prompt.rubric.media) {
      graph.nodes.push({ id: 'cdn', kind: 'cdn', x: 90, y: 90 });
      graph.edges.push({ from: 'client', to: 'cdn' }, { from: 'cdn', to: 'lb-a' }, { from: 'cdn', to: 'lb-b' });
    }
    if (prompt.rubric.async) {
      graph.nodes.push({ id: 'queue', kind: 'queue', x: 750, y: 600 }, { id: 'queue-b', kind: 'queue', x: 850, y: 600 }, { id: 'worker', kind: 'worker', x: 1050, y: 600 }, { id: 'worker-b', kind: 'worker', x: 1150, y: 600 });
      graph.edges.push(...['web-a', 'web-b', 'web-c'].flatMap(from => ['queue', 'queue-b'].map(to => ({ from, to }))), ...['queue', 'queue-b'].flatMap(from => ['worker', 'worker-b'].map(to => ({ from, to }))));
    }
    const config = interviewConfig(prompt, graph);
    expect(designCost(graph)).toBeLessThan(config.budget);
    expect(gradeArchitecture(graph, prompt.rubric).checks.filter(c => !c.passed)).toEqual([]);
    expect(run(config, graph)).toMatchObject({ passed: true, withinBudget: true });
  });
});
