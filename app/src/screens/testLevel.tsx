import type { LevelDef } from '@/types/content';

/** Minimal level for shell integration tests, independent of authored content. */
export const testLevel: LevelDef = {
  id: 'L01', number: 1, title: 'Test mission', subtitle: 'Ship the first request', users: 1000, pages: [5, 7],
  badge: { id: 'test-badge', name: 'First Request', description: 'Deployed the first server', icon: 'server' },
  incident: [], debrief: [],
  lesson: {
    duration: 3, chapters: [{ at: 0, title: 'Start' }], captions: [], checkpoints: [], hotspots: [],
    Scene: ({ time, interactive }) => <svg data-testid="lesson-scene" data-time={time} data-interactive={String(interactive)} />,
  },
  lab: { intro: 'Explore', tasks: [], config: { start: { nodes: [], edges: [] }, palette: [], budget: 100, events: [], goals: { durationSec: 1 } } },
  mission: { brief: [], hints: [], config: { start: { nodes: [], edges: [] }, palette: [], budget: 100, events: [], goals: { durationSec: 1 } } },
  miniGames: [], quiz: [], cards: [{ front: 'Request?', back: 'Response.' }],
};
