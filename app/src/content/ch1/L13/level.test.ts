import level from './index';

describe('L13 content bar', () => {
  it('meets the level content bar', () => {
    const ls = level.lesson;
    expect(ls.duration).toBeGreaterThanOrEqual(120);
    expect(ls.duration).toBeLessThanOrEqual(200);
    expect(ls.hotspots.length).toBeGreaterThanOrEqual(3);
    expect(ls.hotspots.length).toBeLessThanOrEqual(5);
    expect(ls.checkpoints).toHaveLength(2);
    ls.captions.forEach((c, i) => {
      expect(c.end - c.start).toBeLessThanOrEqual(7);
      if (i) expect(c.start - ls.captions[i - 1].end).toBeLessThanOrEqual(0.5);
    });
    expect(ls.captions[0].start).toBe(0);
    expect(ls.captions.at(-1)?.end).toBe(ls.duration);
    for (const d of [level.incident, level.debrief]) {
      expect(d.length).toBeGreaterThanOrEqual(6);
      expect(d.length).toBeLessThanOrEqual(10);
    }
    expect(level.quiz).toHaveLength(10);
    const kinds = new Set(level.quiz.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    for (const k of ['order', 'bins', 'spot'] as const) expect(kinds.has(k)).toBe(true);
    expect(level.cards.length).toBeGreaterThanOrEqual(4);
    expect(level.mission.hints).toHaveLength(3);
    expect(level.miniGames).toHaveLength(2);
    expect(level.users).toBe(10_000_000);
    expect(level.boss).toBe(true);
    expect(level.mission.config.start.nodes.every((n) => n.kind === 'client' || n.kind === 'mobile')).toBe(true);
    const types = new Set(level.mission.config.events.map((e) => e.type));
    for (const k of ['traffic', 'kill', 'region-down', 'hotkey', 'jobs', 'message'] as const) expect(types.has(k)).toBe(true);
  });
});
